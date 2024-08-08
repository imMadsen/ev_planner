import {
  myAlgorithm,
  type ChargingStation,
  type Edge,
  type Graph,
  type VehicleModel,
  type Vertex,
} from ".";
import { dijkstra } from "./dijkstra";

function getShortestPath(origin: Vertex, destination: Vertex): Edge {
  const edges: Edge[] = [];

  try {
    const vertices = dijkstra(myGraph, origin, destination);
    for (let i = 1; i < vertices.length; i++) {
      edges.push(
        myGraph.edges.find(
          (v) => v.start_vertex === vertices[i - 1] && v.end_vertex === vertices[i]
        )!
      );
    }
  
    return {
      start_vertex: origin,
      end_vertex: destination,
      cost: edges.reduce((acc, edge) => edge.cost! + acc, 0)
    };
  } catch(e) {/* Legendary error handling */}

  return {
    start_vertex: origin,
    end_vertex: destination,
    cost: Number.MAX_SAFE_INTEGER
  }; 
}

async function getEnergyConsumptionOfTraversel(edge: Edge) {
  return getTimeToTraverse(getShortestPath(edge.start_vertex, edge.end_vertex))
}

async function getTimeToTraverse(edge: Edge) {
  return getShortestPath(edge.start_vertex, edge.end_vertex).cost!
}

const vertices: Vertex[] = [
  { id: "A" },
  { id: "B" },
  { id: "C" },
  { id: "D" },
];

const myGraph: Graph = {
  vertices,
  edges: [
    { cost: 10, start_vertex: vertices[0], end_vertex: vertices[1] },
    { cost: 20, start_vertex: vertices[0], end_vertex: vertices[3] },
    { cost: 30, start_vertex: vertices[1], end_vertex: vertices[2] },
    { cost: 200, start_vertex: vertices[3], end_vertex: vertices[2] },
    { cost: 10, start_vertex: vertices[3], end_vertex: vertices[1] },
  ],
};


const vehicle: VehicleModel = {
  battery_capacity_wh: 100
};

const origin = myGraph.vertices.find((vertex) => vertex.id === "A")!;
const destination = myGraph.vertices.find((vertex) => vertex.id === "C")!;

const chargingStations: ChargingStation[] = [
  {
    vertex: myGraph.vertices.find((vertex) => vertex.id === "D")!,
    connectors: [{
      output_time_kw: new Array(100).fill(null).map((_, i) => ([i, 2]))
    }],
  }
];

// console.log(await myAlgorithm(
//   getEnergyConsumptionOfTraversel,
//   getTimeToTraverse,
//   origin,
//   destination,
//   vehicle,
//   chargingStations,
//   30,
//   0
// ));
