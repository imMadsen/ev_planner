import { dijkstra } from "./dijkstra";

export type Vertex = {
    nickname?: string;
}

export type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost: number;
}

export type Graph = {
    edges: Edge[],
    vertices: Vertex[]
}

export type Path = {
    edges: Edge[];
    batteryState: number;
}

export type Vehicle = {
    batteryState: number;
    batteryCapacity: number;
}

export type Connector = {
    expectedOutput: [number, number][]
}

export type ChargingStation = {
    vertex: Vertex;
    connectors: Connector[];
}

export async function myAlgorithm(
    getShortestPath: (origin: Vertex, destination: Vertex) => Promise<Edge[]>,
    getEnergyConsumptionOfTraversel: (vehicle: Vehicle, edges: Edge[]) => Promise<number>,
    origin: Vertex,
    destination: Vertex,
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
) {
    const mainPath = await getShortestPath(origin, destination);
    const mainPathEnergyConsumption = await getEnergyConsumptionOfTraversel(vehicle, mainPath)

    // Check if we can traverse the main path given current state
    if (mainPathEnergyConsumption < vehicle.batteryState) {
        return "We can run this shit in one.";
    }

    // Create a new Graph that only represents distances between chargingStations, origin & destination
    const vertices = [origin, destination, ...chargingStations.map(chargingStation => chargingStation.vertex)]
    const edges: Edge[] = []; 

    for (const v1 of vertices)
        for (const v2 of vertices)
            if (v1 !== v2) {
                try { // This try catch is needed since if a path is impossible getShortestPath->dijkstra will throw an error
                    edges.push({
                        startVertex: v1,
                        endVertex: v2,
                        cost: await getEnergyConsumptionOfTraversel(vehicle, await getShortestPath(v1, v2))
                    })
                } catch(e) { /* Invalid Path */}
            }

    const newGraph: Graph = {
        vertices,
        edges
    }

    return dijkstra(newGraph, origin, destination)
}
