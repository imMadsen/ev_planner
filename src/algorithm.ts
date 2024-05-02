type Vertice = {

}

type Edge = {
    startNode: Node;
    endNode: Node;
    cost: number;
}

type EdgeWithMetadata = Edge & {
    speedLimit: number;

}

type Vehicle = {
    stateOfCharge: number;
}

type ChargingStation = {
    vertice: Vertice;
    connections: (x: number) => number[];
}

function getShortestPath(start: Vertice, target: Vertice): Edge[] {
    const shortestPath: Edge[] = [];
    return shortestPath;
}

function getPowerUsagesOfTraversel(vehicle: Vehicle, path: Edge[]) {
    return {
        energyUsage: 0,
        timeUsage: 0,
    }
}

type MyAlgorithmOutput = { path: Edge[] };

function myAlgorithm(
    vertices: Vertice[],
    edges: Edge[],
    start: Vertice,
    target: Vertice,
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
    startingTime: number,
): MyAlgorithmOutput {
    // Check if already at destination
    if (start === target)
        return { path: [] } 
    
    // Get shortest path to destination
    const path = getShortestPath(start, target);
    const cost = getPowerUsagesOfTraversel(vehicle, path);

    // Check if path can be traversed without visiting any chargingStation
    if (vehicle.stateOfCharge - cost.energyUsage >= 0)
        return { path } 

    // Iterate over all chargingStaions and find the ideal one
    for (const chargingStation of chargingStations) {
        const path = getShortestPath(start, chargingStation.vertice);
        const cost = getPowerUsagesOfTraversel(vehicle, path);

        const timeOfArrival = startingTime + cost.timeUsage;

    }

    return { path: [] } 
}