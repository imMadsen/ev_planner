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
  };
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
  graph: Graph,
  vehicle: Vehicle,
  charging_stations: ChargingStation[],
  startTime: number,
) {

  async function getNeighbours(u: Vertex, graph: Graph): Promise<Vertex[]> {  
    const neighbours = graph.edges
      .filter((edge) => edge.start_vertex === u)
      .map((edge) => edge.end_vertex);

    // Removing duplicates using Set
    return [...new Set(neighbours)];
  }
  
  let total_visits = 0;
  const dist = new Map<Vertex, number>();
  const previous = new Map<Vertex, Vertex | undefined>();
  async function getTimeToChargeCandidate(
    vertex: Vertex,
    targetSoC: number,
    chargingStation: ChargingStation,
    vehicle: Vehicle
  ) {
    let connector: Connector | undefined;
    let chargeFinishTime = Number.MAX_SAFE_INTEGER;

    for (let _connector of chargingStation.connectors) {
      let _chargingMetrics = getChargingMetricsByVehicleModel(
        _connector.output_time_kw,
        vertex.time!,
        targetSoC,
        vehicle.model,
        vertex.battery_state_wh!
      );
      if (_chargingMetrics === undefined) {
        continue;
      }

      if (_chargingMetrics.chargeFinishTime < chargeFinishTime) {
        chargeFinishTime = _chargingMetrics.chargeFinishTime;
        connector = _connector;
      }
    }

    // Check if a connector was found, if so use it
    if (connector !== undefined) {
      return {
        timeSpentCharging: chargeFinishTime - vertex.time!,
        targetSoC: targetSoC,
      };
    }
  }

  for (const vertex of graph.vertices) {
    dist.set(vertex, Number.MAX_SAFE_INTEGER);
    previous.set(vertex, undefined);
  }

  origin.battery_state_wh = vehicle.battery_state_wh;
  origin.time = startTime;

  dist.set(origin, 0);

  // Create a copy of vertices
  let Q = [...graph.vertices];

  let shouldBreakFlag = false;

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
    if (u === destination || shouldBreakFlag) break;
    
    // Remove u from Q
    Q = Q.filter((i) => i !== u);

    for (const v of await getNeighbours(u, graph)) {
      total_visits++;

      // Get the edge between our current node (u) and neighbour (v)
      const edge = graph.edges.find(
        (edge) => edge.start_vertex === u && edge.end_vertex === v
      )!;

      let cost = Number.MAX_SAFE_INTEGER; // Set cost to infinity aka. assuming we are stuck.
      let batteryState;

      // Calculate the consumption of the edge
      const energyConsumption = await getEnergyConsumptionOfTraversel(edge);

      // Check if edge can be traversed without charging
      if (energyConsumption <= u.battery_state_wh!) {
        cost = await getTimeToTraverse(edge);

        batteryState = u.battery_state_wh! - energyConsumption;
      } else {
        // Check if at a charging staiton
        const chargingStation = charging_stations.find(
          (chargingStation) => chargingStation.vertex === u
        );

        if (chargingStation !== undefined) {
          // Make sure the vehicle can store that much energy
          if (energyConsumption <= vehicle.model.battery_capacity_wh) {
            // Try to calculate the most optimal charger
            let timeToChargeCandidate = await getTimeToChargeCandidate(
              u,
              energyConsumption, // Calculcate missing amount of energy for traversal
              chargingStation,
              vehicle
            );

            if (timeToChargeCandidate) {
              const {
                timeSpentCharging: timeSpentCharging,
                targetSoC: targetSoc,
              } = timeToChargeCandidate;
              const traverseTime = await getTimeToTraverse(edge);
              batteryState = targetSoc - energyConsumption;
              cost = timeSpentCharging + traverseTime;
            }
          }
        }
      }
      const alt = dist.get(u)! + cost;
      if (alt < dist.get(v)!) {
        v.battery_state_wh = batteryState;
        v.energy_consumption = energyConsumption;
        v.time = u.time! + cost;

        dist.set(v, alt);
        previous.set(v, u);
        if (v === destination) shouldBreakFlag = true;
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

  let relevant_edges: Edge[] = [];
  // Return all "relevant" edges for debugging purposes

  let totalDistanceTraveled = 0;
  let totalTimeSpent = 0;
  let totalEnergySpent = 0;
  let totalEnergyCharged = 0;
  let totalTimeSpentCharging = 0;

  let totalLegTime = 0;
  for (let i = 0; i < ordered_vertices.length - 1; i++) {
    totalEnergyCharged += ordered_vertices[i].debug_data.amountCharged;
    totalTimeSpentCharging += ordered_vertices[i].debug_data.chargeTime;

    const edge = graph.edges.find(
      ({ start_vertex, end_vertex }) =>
        (start_vertex === ordered_vertices[i] &&
          end_vertex === ordered_vertices[i + 1]) ||
        (start_vertex === ordered_vertices[i + 1] &&
          end_vertex === ordered_vertices[i])
    ) as Edge;
    if (edge) {
      totalDistanceTraveled += edge.debug_data.distance;
      totalTimeSpent += edge.debug_data.timeToTraverse;
      totalEnergySpent += edge.debug_data.energyConsumedOnTraversal;

      relevant_edges.push(edge);

      totalLegTime += await getTimeToTraverse(edge);
    }
  }

  return {
    ordered_vertices: ordered_vertices.map(({ id, debug_data }) => ({
      id,
      debug_data,
    })),
    relevant_edges: relevant_edges.map(
      ({ debug_data, end_vertex, start_vertex }) => ({
        end_vertex: end_vertex.id,
        start_vertex: start_vertex.id,
        debug_data,
      })
    ),
    destination_time: destination.time,
    total_visits,
  };
}
