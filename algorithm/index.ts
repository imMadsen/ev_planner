import { findDynamicXForArea, findXForArea } from "./utilities";

export type Vertex = {
  nickname?: string;
  time?: number;
  battery_state_wh?: number;
  energy_needed?: number;
  energy_consumption?: number;
  charging_station?: ChargingStation;
};

export type Edge = {
  start_vertex: Vertex;
  end_vertex: Vertex;
  cost?: number;
  //distance: number; //meters
};

export type Graph = {
  edges: Edge[];
  vertices: Vertex[];
};

export type Path = {
  edges: Edge[];
};

export type VehicleModel = {
  charging_curve_kw: number[][];
  battery_capacity_wh: number;
};

export type Vehicle = {
  model: VehicleModel;
  battery_state_wh?: number;
};

export type Connector = {
  output_time_kw: [number, number][];
};

export type ChargingStation = {
  vertex: Vertex;
  connectors: Connector[];
};

export async function myAlgorithm(
  getEnergyConsumptionOfTraversel: (edge: Edge) => Promise<number>,
  getTimeToTraverse: (edge: Edge) => Promise<number>,
  origin: Vertex,
  destination: Vertex,
  vehicle: Vehicle,
  charging_stations: ChargingStation[],
  startTime: number
) {
  let total_visits = 0;

  console.log(
    "Algorithm stated with a chargingStations count of ",
    charging_stations.length
  );

  function getNeighbours(u: Vertex, graph: Graph): Vertex[] {
    return [
      ...new Set(
        graph.edges
          .filter((edge) => edge.start_vertex === u)
          .map((edge) => edge.end_vertex)
      ),
    ];
  }
  type chargeAndTraverseData = {
    chargeTime: number;
    energyCharged: number;
    chargingFinishedTime: number;
  };
  async function getTimeToCharge(
    vertex: Vertex,
    energyNeeded: number,
    chargingStation: ChargingStation,
    edge: Edge,
    vehicle: Vehicle
  ) {

    let data: chargeAndTraverseData = {
      chargeTime: Number.MAX_SAFE_INTEGER,
      energyCharged: Number.MAX_SAFE_INTEGER,
      chargingFinishedTime: Number.MAX_SAFE_INTEGER
    };

    let connector: Connector | undefined;
    let doneCharging = Number.MAX_SAFE_INTEGER;
    for (let _connector of chargingStation.connectors) {
      let _doneCharging = findXForArea(
        _connector.output_time_kw,
        vertex.time!,
        energyNeeded,

      );

      if (_doneCharging === undefined) {
        continue;
      }

      if (_doneCharging < doneCharging) {
        doneCharging = _doneCharging;
        connector = _connector;
      }
    }

    // Check if a connector was found, if so use it
    if (connector !== undefined) {
      data.chargeTime = doneCharging - vertex.time!;
      data.chargingFinishedTime = doneCharging;
      data.energyCharged = energyNeeded;
    }

    return data;
  }

  // Create a new Graph that only represents distances between chargingStations, origin & destination
  const vertices: Vertex[] = [
    origin,
    destination,
    ...charging_stations.map((chargingStation) => {
      chargingStation.vertex.charging_station = chargingStation;
      return chargingStation.vertex;
    }),
  ];

  const edges: Edge[] = [];

  const graph: Graph = {
    vertices,
    edges,
  };
  for (const v1 of vertices)
    for (const v2 of vertices)
      if (v1 !== v2) {
        edges.push({
          start_vertex: v1,
          end_vertex: v2,
        });
      }

  const dist = new Map<Vertex, number>();
  const previous = new Map<Vertex, Vertex | undefined>();

  for (const vertex of graph.vertices) {
    dist.set(vertex, Number.MAX_SAFE_INTEGER);
    previous.set(vertex, undefined);
  }

  origin.battery_state_wh = vehicle.battery_state_wh;
  origin.time = startTime;

  dist.set(origin, 0);

  // Create a copy of vertices
  let Q = [...graph.vertices];

  while (Q.length > 0) {
    // vertex in Q with smallest dist[]
    let u: Vertex | undefined;
    let _dist = Number.MAX_SAFE_INTEGER;
    for (const _u of Q) {
      const _u_dist = dist.get(_u)!;
      if (_u_dist < _dist) {
        u = _u;
        _dist = _u_dist;
      }
    }

    if (!u) throw "Dijkstra was unable to find a valid path 🤡";

    if (dist.get(u)! >= Number.MAX_SAFE_INTEGER) break;
    if (u === destination) break;

    // Remove u from Q
    Q = Q.filter((i) => i !== u);

    for (const v of getNeighbours(u, graph)) {
      total_visits++;

      // Get the edge between our current node (u) and neighbour (v)
      const edge = graph.edges.find(
        (edge) => edge.start_vertex === u && edge.end_vertex === v
      )!;

      let cost = Number.MAX_SAFE_INTEGER; // Set cost to infinity aka. assuming we are stuck.
      let batteryState;

      // Calculate the consumption of the edge
      const energyConsumption = await getEnergyConsumptionOfTraversel(edge);

      // Calculcate required amount to charge for traversal
      const energyNeeded = energyConsumption - u.battery_state_wh!;

      // Check if edge can be traversed without charging
      if (energyNeeded <= 0) {
        cost = await getTimeToTraverse(edge);
        batteryState = u.battery_state_wh! - energyConsumption;
      } else {
        // Check if at a charging staiton
        const chargingStation = charging_stations.find(
          (chargingStation) => chargingStation.vertex === u
        );

        if (chargingStation !== undefined) {
          // Make sure the vehicle can store that much energy
          if (energyNeeded <= vehicle.model.battery_capacity_wh) {
            // Try to calculate the most optimal charger
            let chargeData = await getTimeToCharge(
              u,
              energyNeeded,
              chargingStation,
              edge,
              vehicle
            );

            if(chargeData.chargeTime < Number.MAX_SAFE_INTEGER){
              const traverseTime = await getTimeToTraverse(edge);
              batteryState = u.battery_state_wh! - energyNeeded + chargeData.energyCharged;
              cost = chargeData.chargeTime + traverseTime;
            }
          }
        }
      }

      const alt = dist.get(u)! + cost;
      if (alt < dist.get(v)!) {
        v.battery_state_wh = batteryState;
        v.energy_needed = energyNeeded;
        v.energy_consumption = energyConsumption;
        v.time = u.time! + cost;

        dist.set(v, alt);
        previous.set(v, u);
      }
    }
  }

  const S: Vertex[] = [];
  let p = destination;
  while (previous.get(p)) {
    S.push(p);
    p = previous.get(p)!;
  }

  S.push(origin);

  console.log("Algorithm finished with a total visits of ", total_visits);

  console.log(
    "The duration of the route is ",
    (destination.time || 0) - startTime
  );

  return {
    ordered_vertices: S.reverse(),
    destination_time: destination.time,
    total_visits,
  };
}
