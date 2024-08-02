import { findXForArea } from "./utilities";

export type Vertex = {
  nickname?: string;
  batteryState?: number;
  time?: number;
};

export type Edge = {
  startVertex: Vertex;
  endVertex: Vertex;
  cost?: number;
};

export type Graph = {
  edges: Edge[];
  vertices: Vertex[];
};

export type Path = {
  edges: Edge[];
};

export type VehicleModel = {
  batteryCapacity: number;
};

export type Vehicle = {
  model: VehicleModel
  batteryState?: number;
}

export type Connector = {
  output: [number, number][];
};

export type ChargingStation = {
  vertex: Vertex;
  connectors: Connector[];
};

export async function myAlgorithm(
  getEnergyConsumptionOfTraversel: (
    edge: Edge
  ) => Promise<number>,
  getTimeToTraverse: (edge: Edge) => Promise<number>,
  origin: Vertex,
  destination: Vertex,
  vehicle: Vehicle,
  chargingStations: ChargingStation[],
  startTime: number
) {
  let total_visits = 0;

  console.log("Algorithm stated with a chargingStations count of ", chargingStations.length)

  function getNeighbours(u: Vertex, graph: Graph): Vertex[] {
    return [
      ...new Set(
        graph.edges
          .filter((edge) => edge.startVertex === u)
          .map((edge) => edge.endVertex)
      ),
    ];
  }

  // Create a new Graph that only represents distances between chargingStations, origin & destination
  const vertices = [
    origin,
    destination,
    ...chargingStations.map((chargingStation) => chargingStation.vertex),
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
          startVertex: v1,
          endVertex: v2,
        });
      }

  const dist = new Map<Vertex, number>();
  const previous = new Map<Vertex, Vertex | undefined>();

  for (const vertex of graph.vertices) {
    dist.set(vertex, Number.MAX_SAFE_INTEGER);
    previous.set(vertex, undefined);
  }

  origin.batteryState = vehicle.batteryState;
  origin.time = startTime;

  dist.set(origin, 0);

  // Create a copy of verticies
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
      total_visits++

      // Get the edge between our current node (u) and neighbour (v)
      const edge = graph.edges.find(
        (edge) => edge.startVertex === u && edge.endVertex === v
      )!;

      let cost = Number.MAX_SAFE_INTEGER; // Set cost to infinity aka. assuming we are stuck.
      let batteryState;

      // Check if edge can be traversed without charging
      const energyConsumption = await getEnergyConsumptionOfTraversel(edge);
      if (energyConsumption < u.batteryState!) {
        cost = energyConsumption;
        batteryState = u.batteryState! - energyConsumption;
      } else {
        // Check if at a charging staiton
        const chargingStation = chargingStations.find(
          (chargingStation) => chargingStation.vertex === u
        );


        if (chargingStation !== undefined) {
          // Calculcate required amount to charge
          const energyNeeded = energyConsumption - u.batteryState!;

          // Make sure the vehicle can store that much energy
          if (energyNeeded <= vehicle.model.batteryCapacity) {
            // Try to calculate the most optimal charger
            let connector: Connector | undefined;
            let doneCharging = Number.MAX_SAFE_INTEGER;
            for (let _connector of chargingStation.connectors) {
              let _doneCharging = findXForArea(
                _connector.output,
                u.time!,
                energyNeeded
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
              const traverseTime = await getTimeToTraverse(edge);
              cost = traverseTime + doneCharging - u.time!;
              batteryState = 0;
            }
          }
        }
      }

      const alt = dist.get(u)! + cost;
      if (alt < dist.get(v)!) {
        v.batteryState = batteryState;
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

  console.log("Algorithm finished with a total visits of ", total_visits)

  return S.reverse();
}
