import { getChargingMetricsByVehicleModel, findXForArea } from "./utilities";

export type Vertex = {
  id?: string;
  time?: number;
  battery_state_wh?: number;
  energy_needed?: number;
  energy_consumption?: number;
  charging_station?: ChargingStation;
  debug_data: {
    timeOfArrival: number;
    amountCharged: number;
    chargeTime: number;
  };
};

export type Edge = {
  start_vertex: Vertex;
  end_vertex: Vertex;
  cost?: number;
  debug_data: {
    distance: number;  
    speed: number;
    timeToTraverse: number;
    energyConsumedOnTraversal: number;
  }
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

  function getNeighbours(u: Vertex, graph: Graph): Vertex[] {
    return [
      ...new Set(
        graph.edges
          .filter((edge) => edge.start_vertex === u)
          .map((edge) => edge.end_vertex)
      ),
    ];
  }

  async function getTimeToChargeCandidate(
    vertex: Vertex,
    energyRequired: number,
    chargingStation: ChargingStation,
    vehicle: Vehicle
  ) {
    let connector: Connector | undefined;
    let doneCharging = Number.MAX_SAFE_INTEGER;
    
    for (let _connector of chargingStation.connectors) {
      let _chargingMetrics = getChargingMetricsByVehicleModel(
        _connector.output_time_kw,
        vertex.time!,
        energyRequired,
        vehicle.model,
        vertex.battery_state_wh!
      );

      if (_chargingMetrics === undefined) {
        continue;
      }

      if (_chargingMetrics.chargeFinishTime < doneCharging) {
        vertex.debug_data.amountCharged = _chargingMetrics.amountCharged
        vertex.debug_data.chargeTime = _chargingMetrics.chargeFinishTime
        doneCharging = _chargingMetrics.chargeFinishTime;
        connector = _connector;
      }
    }

    // Check if a connector was found, if so use it
    if (connector !== undefined) {
      
      return {
        chargingTime: doneCharging - vertex.time!,
        energyRequired
      };
    }
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

  const _edges: Edge[] = [];

  const graph: Graph = {
    vertices,
    edges: _edges,
  };
  for (const v1 of vertices)
    for (const v2 of vertices)
      if (v1 !== v2) {
        _edges.push({
          start_vertex: v1,
          end_vertex: v2,
          debug_data: {
            distance: Number.MAX_SAFE_INTEGER,
            speed: Number.MAX_SAFE_INTEGER,
            timeToTraverse: Number.MAX_SAFE_INTEGER,
            energyConsumedOnTraversal: Number.MAX_SAFE_INTEGER
          }
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
      const energyRequired = energyConsumption - u.battery_state_wh!;

      // Check if edge can be traversed without charging
      if (energyRequired <= 0) {
        cost = await getTimeToTraverse(edge);
        batteryState = u.battery_state_wh! - energyConsumption;
      } else {
        // Check if at a charging staiton
        const chargingStation = charging_stations.find(
          (chargingStation) => chargingStation.vertex === u
        );

        if (chargingStation !== undefined) {
          // Make sure the vehicle can store that much energy
          if (energyRequired <= vehicle.model.battery_capacity_wh) {
            // Try to calculate the most optimal charger
            let timeToChargeCandidate = await getTimeToChargeCandidate(
              u,
              energyRequired,
              chargingStation,
              vehicle
            );

            if (timeToChargeCandidate) {
              const { chargingTime, energyRequired } = timeToChargeCandidate;
              const traverseTime = await getTimeToTraverse(edge);
              batteryState = u.battery_state_wh! - energyRequired + energyRequired;
              cost = chargingTime + traverseTime;
            }
          }
        }
      }

      const alt = dist.get(u)! + cost;
      if (alt < dist.get(v)!) {
        v.battery_state_wh = batteryState;
        v.energy_needed = energyRequired;
        v.energy_consumption = energyConsumption;
        v.time = u.time! + cost;

        // Settings the timeOfArrival in debug
        v.debug_data.timeOfArrival = v.time;

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

  const ordered_vertices = S.reverse();


  let relevant_edges: Edge[] = []
  // Return all "relevant" edges for debugging purposes

  for (let i = 0; i < S.length - 1; i++) {
    const edge = _edges.find(({ start_vertex, end_vertex }) => 
        (start_vertex === S[i] && end_vertex === S[i+1]) || 
        (start_vertex === S[i+1] && end_vertex === S[i])
    );
    if (edge) {
        relevant_edges.push(edge);
    }
}

  return {
    ordered_vertices: ordered_vertices.map(({ id, debug_data }) => ({ id, debug_data })),
    relevant_edges: relevant_edges.map(({ debug_data, end_vertex, start_vertex }) => ({
      end_vertex: end_vertex.id,
      start_vertex: start_vertex.id,
      debug_data
    })),
    destination_time: destination.time,
    total_visits,
  };
}
