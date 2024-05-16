type Vertex = {
    nickname?: string;
}

type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost: number;
}

type Path = {
    edges: Edge[];
    batteryState: number;
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

function getTimeConsumptionOfCharging(vehicle: Vehicle, connector: Connector, batteryState: number) {
    return 0;
}

function myAlgorithm(
    start: Vertex,
    target: Vertex,
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
    startingTime: number,
): Edge[] {
    function recurse(accumulatedEdges: Edge[], start: Vertex) {
        console.log("Recursion, starting from", start.nickname, "end destination", target.nickname)
        

        let candidate: ChargingStation | undefined;
        let candidateTimeOfDeparture = 999999;
        let candidatePath: Edge[] | undefined;
        
        // Iterate over all chargingStaions and find one
        for (const chargingStation of chargingStations) {
            // Calculate the path to the charger
            const chargingPath = getShortestPath(start, chargingStation.vertex);
            const chargingEnergyUsage = getEnergyConsumptionOfTraversel(vehicle, chargingPath);

            // Check if possible reach chargingStation given batteryState
            if (chargingEnergyUsage >= vehicle.batteryState) {
                // Charging station is not a valid candidate since it can't be reached
                break;
            }

            // Calculate the path from charger to target
            const targetPath = getShortestPath(chargingStation.vertex, target);
            const targetEnergyUsage = getEnergyConsumptionOfTraversel(vehicle, targetPath);
            
            // Calculate if charger can provide the given amount to reach target
            if (targetEnergyUsage >= vehicle.batteryCapacity) {
                // Target can still not be reached, look for paths to chargingStations
                break;
            }
            
            // If it is possible, let's set the score of this chargingStation the be the estimated time of arrival
            
        }

        if (!candidate) {
            throw new Error("No Charging Station Candidate could be found making the route impossible 😭")
        }
        
        accumulatedEdges = [...accumulatedEdges, ...candidatePath!]
        vehicle.batteryState = 100;

        return recurse(accumulatedEdges, candidate.vertex);
    }

    let accumulatedEdges: Edge[] = [];

    // Get shortest path to destination
    const path = getShortestPath(start, target);
    const energyUsage = getEnergyConsumptionOfTraversel(vehicle, path);
    
    // Check if path can be traversed without visiting any chargingStation
    if (vehicle.batteryState - energyUsage >= 0) {
        accumulatedEdges = [...accumulatedEdges, ...path]
        return accumulatedEdges;
    }
    
    // Start looking for chargingStations that could potentially help!
    return recurse(accumulatedEdges, start)
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
