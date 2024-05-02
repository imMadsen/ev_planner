type Vertex = {

}

type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost: number;
}

type EdgeWithMetadata = Edge & {
    speedLimit: number;

}

type Vehicle = {
    batteryState: number;
    batteryCapacity: number;
}

type ChargingStation = {
    vertex: Vertex;
    connections: ((x: number) => number)[];
}

const verticies: Vertex[] = Array(3).fill(null).map(() => ({}));
const edges: Edge[] = [
    {
        startVertex: verticies[0],
        endVertex: verticies[1],
        cost: 1,
    },
    {
        startVertex: verticies[1],
        endVertex: verticies[2],
        cost: 20,
    },
]


function getShortestPath(startVertex: Vertex, targetVertex: Vertex): Edge[] {
    // Note: Gider ikke til at implementere <!> Virker kun med linær veje <!>

    // Find the edge that has the startNode
    const traversedEdges = [edges.find((edge) => edge.startVertex === startVertex)!];

    while (traversedEdges[traversedEdges.length].endVertex !== targetVertex) {
        traversedEdges.push(edges.find((edge) => edge.startVertex === traversedEdges[traversedEdges.length].endVertex)!)
    }

    return traversedEdges;
}

function getEnergyUsageOfTraversel(vehicle: Vehicle, path: Edge[]) {
    let accumulated = 0;
    for (const edge of path) {
        accumulated += edge.cost;
    }
    
    return accumulated;
}

// vertices: Vertice[],
// edges: Edge[],

type MyAlgorithmOutput = { path: Edge[] };

function myAlgorithm(
    start: Vertex,
    target: Vertex,
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
    startingTime: number,
): MyAlgorithmOutput {

    function recursion(start: Vertex): any { // Fix type here :)
        // Check if already at destination
        if (start === target)
            return { path: [] } 
        
        // Get shortest path to destination
        const path = getShortestPath(start, target);
        const energyUsage = getEnergyUsageOfTraversel(vehicle, path);

        // Check if path can be traversed without visiting any chargingStation
        if (vehicle.batteryCapacity - energyUsage >= 0)
            return { path } 

        // Iterate over all chargingStaions and find the ideal one
        let candidate: ChargingStation | undefined;
        let candidateTimeOfDeparture = 0;

        for (const chargingStation of chargingStations) {
            const path = getShortestPath(start, chargingStation.vertex);

            // const cost = getPowerUsagesOfTraversel(vehicle, path);
            // const timeOfArrival = startingTime + cost.timeUsage; This is for sure needed

            chargingStation.connections.forEach((func) => {
                // const connectorOutput = func(timeOfArrival);
                const timeOfDepareture = 999 // We need da maths....
                if (timeOfDepareture < candidateTimeOfDeparture) {
                    candidate = chargingStation;
                    candidateTimeOfDeparture = timeOfDepareture
                }
            })
        }

        if (!candidate) {
            throw new Error("No charging station could be found, this is a very sad moment :(")
        }

        recursion(candidate.vertex);
    }

    return recursion(start)
}

// Sandbox

const chargingStations: ChargingStation[] = [{
    vertex: verticies[1],
    connections: []
}]

const vehicle: Vehicle = {
    batteryState: 5,
    batteryCapacity: 100,
}

const start = verticies[0];
const target = verticies[2]

// const path = myAlgorithm(start, target, vehicle, chargingStations, 0);


// Problemattiker
// Hvad nu hvis connectorens output pludselig blev større senere hen, aka. du er ved Tesla charger, og så er der en der springer fra.