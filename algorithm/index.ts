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

type ChargingStation = {
    vertex: Vertex;
    connections: ((x: number) => number)[];
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
        console.log("Recursion, starting from", start.nickname, "end destination", target.nickname)
        
        // Check if already at destination
        if (start === target) {
            throw new Error("We have arrived!")
        }
        
        // Get shortest path to destination
        const path = getShortestPath(start, target);
        const energyUsage = getEnergyConsumptionOfTraversel(vehicle, path);

        // Check if path can be traversed without visiting any chargingStation
        console.log("Traversel Cost", energyUsage, "BatteryState (Without chargers)", vehicle.batteryState - energyUsage)

        if (vehicle.batteryState - energyUsage >= 0)
            return { path } 

        // Iterate over all chargingStaions and find the ideal one
        let candidate: ChargingStation | undefined;
        let candidateTimeOfDeparture = 9999;

        for (const chargingStation of chargingStations) {
            const path = getShortestPath(start, chargingStation.vertex);
            const timeOfArrival = startingTime + getTimeConsumptionOfTraversal(vehicle, path);
            
            for (const func of chargingStation.connections) {
                // const connectorOutput = func(timeOfArrival);
                const chargingDelay = 5; // We need da maths here.
                const timeOfDepareture = timeOfArrival + chargingDelay
                if (timeOfDepareture < candidateTimeOfDeparture) {
                    candidate = chargingStation;
                    candidateTimeOfDeparture = timeOfDepareture
                }
            }
        }

        if (!candidate) {
            throw new Error("No Charging Station Candidate could be found making the route impossible 😭")
        } else {
            vehicle.batteryState = 100;
        }


        return recursion(candidate.vertex);
    }

    return recursion(start)
}

// Sandbox

const chargingStations: ChargingStation[] = [{
    vertex: verticies[1],
    connections: [(x: number) => x]
}]

const vehicle: Vehicle = {
    batteryState: 5,
    batteryCapacity: 100,
}

const start = verticies[0];
const target = verticies[2]

const path = myAlgorithm(start, target, vehicle, chargingStations, 0);
console.log("Final Path", JSON.stringify(path))

// Problemattiker
// Hvad nu hvis connectorens output pludselig blev større senere hen, aka. du er ved Tesla charger, og så er der en der springer fra.