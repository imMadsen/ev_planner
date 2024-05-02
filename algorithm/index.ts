type Vertex = {
    nickname?: string;
}

type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost: number;
}

type Vehicle = {
    batteryState: number;
    batteryCapacity: number;
}

type Connector = {
    expectedOutput: [number, number][]
}

type ChargingStation = {
    vertex: Vertex;
    connectors: Connector[];
}

const verticies: Vertex[] = [{ nickname: "A"}, { nickname: "B"}, { nickname: "C"}];
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

    while (traversedEdges[traversedEdges.length - 1].endVertex !== targetVertex) {
        traversedEdges.push(edges.find((edge) => edge.startVertex === traversedEdges[traversedEdges.length - 1].endVertex)!)
    }

    return traversedEdges;
}

function getEnergyConsumptionOfTraversel(vehicle: Vehicle, path: Edge[]) {
    let accumulated = 0;
    for (const edge of path) {
        accumulated += edge.cost;
    }
    
    return accumulated;
}

function getTimeConsumptionOfTraversal(vehicle: Vehicle, path: Edge[]) {
    let accumulated = 0;
    for (const edge of path) {
        accumulated += edge.cost;
    }
    
    return accumulated;
}

function myAlgorithm(
    start: Vertex,
    target: Vertex,
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
    startingTime: number,
): Edge[] {
    function recursion(accumulatedEdges: Edge[], start: Vertex) {
        console.log("Recursion, starting from", start.nickname, "end destination", target.nickname)
        
        // Check if already at destination
        if (start === target) {
            throw new Error("We have arrived!")
        }
        
        // Get shortest path to destination
        const path = getShortestPath(start, target);
        const energyUsage = getEnergyConsumptionOfTraversel(vehicle, path);
        console.log("Traversel Cost", energyUsage, "BatteryState (Without chargers)", vehicle.batteryState - energyUsage)
        
        // Check if path can be traversed without visiting any chargingStation
        if (vehicle.batteryState - energyUsage >= 0) {
            accumulatedEdges = [...accumulatedEdges, ...path]
            return accumulatedEdges;
        }

        // Iterate over all chargingStaions and find the ideal one
        let candidate: ChargingStation | undefined;
        let candidateTimeOfDeparture = 999999;
        let candidatePath: Edge[] | undefined;

        for (const chargingStation of chargingStations) {
            const path = getShortestPath(start, chargingStation.vertex);
            const timeOfArrival = startingTime + getTimeConsumptionOfTraversal(vehicle, path);
            
            for (const connector of chargingStation.connectors) {
                const timeOfDepareture = 0; // Need some function that interpolates between outputFunc.expectedOutput, and returns the sum for a given interval... but my brian is fried
                                
                if (timeOfDepareture < candidateTimeOfDeparture) {
                    candidate = chargingStation;
                    candidatePath = path;
                    candidateTimeOfDeparture = timeOfDepareture
                }
            }
        }

        if (!candidate) {
            throw new Error("No Charging Station Candidate could be found making the route impossible 😭")
        }
        
        accumulatedEdges = [...accumulatedEdges, ...candidatePath!]
        vehicle.batteryState = 100;

        return recursion(accumulatedEdges, candidate.vertex);
    }

    return recursion([], start)
}

// Sandbox

const chargingStations: ChargingStation[] = [{
    vertex: verticies[1],
    connectors: [{
        expectedOutput: [[0,0], [0,0]]
    }]
}]

const vehicle: Vehicle = {
    batteryState: 5,
    batteryCapacity: 100,
}

const start = verticies[0];
const target = verticies[2]

const path = myAlgorithm(start, target, vehicle, chargingStations, 0);
console.log("Final Path", path.map((path => `${path.startVertex.nickname}->${path.endVertex.nickname}`)).join('|'))
