import { dijkstra } from "./dijkstra";
import { myGraph } from "./example_graph";


function myAlgorithm(
    graph: Graph,
    origin: Vertex,
    destination: Vertex,
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
) {
    function getShortestPath(origin: Vertex, destination: Vertex) {
        const edges: Edge[] = []
        const vertices = dijkstra(graph, origin, destination)
        for (let i = 1; i < vertices.length; i++) {
            edges.push(myGraph.edges.find(v => v.startVertex === vertices[i - 1] && v.endVertex === vertices[i])!)
        }

        return edges;
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

    const mainPath = getShortestPath(origin, destination);
    const mainPathEnergyConsumption = getEnergyConsumptionOfTraversel(vehicle, mainPath)

    // Check if we can traverse the main path given current state
    if (mainPathEnergyConsumption < vehicle.batteryState) {
        return "We can run this shit in one.";
    }

    // Find charging station that may be most relevant
    
}

// Sandbox

const vehicle: Vehicle = {
    batteryCapacity: 20,
    batteryState: 3,
}

const origin = myGraph.vertices.find(vertex => vertex.nickname === "A")!;
const destination = myGraph.vertices.find(vertex => vertex.nickname === "E")!;

const chargingStations: ChargingStation[] = [
    {
        connectors: [],
        vertex: myGraph.vertices.find(vertex => vertex.nickname === "B")!,
    },
    {
        connectors: [],
        vertex: myGraph.vertices.find(vertex => vertex.nickname === "D")!,
    }
]

console.log(myAlgorithm(myGraph, origin, destination, vehicle, chargingStations))