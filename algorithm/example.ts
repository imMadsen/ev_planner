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
          (v) => v.startVertex === vertices[i - 1] && v.endVertex === vertices[i]
        )!
      );
    }
  
    return {
      startVertex: origin,
      endVertex: destination,
      cost: edges.reduce((acc, edge) => edge.cost! + acc, 0)
    };
  } catch(e) {/* Legendary error handling */}

  return {
    startVertex: origin,
    endVertex: destination,
    cost: Number.MAX_SAFE_INTEGER
  }; 
}

async function getEnergyConsumptionOfTraversel(edge: Edge) {
  return getTimeToTraverse(getShortestPath(edge.startVertex, edge.endVertex))
}

async function getTimeToTraverse(edge: Edge) {
  return getShortestPath(edge.startVertex, edge.endVertex).cost!
}

const vertices: Vertex[] = [
  { nickname: "A" },
  { nickname: "B" },
  { nickname: "C" },
  { nickname: "D" },
];

const myGraph: Graph = {
  vertices,
  edges: [
    { cost: 10, startVertex: vertices[0], endVertex: vertices[1] },
    { cost: 20, startVertex: vertices[0], endVertex: vertices[3] },
    { cost: 30, startVertex: vertices[1], endVertex: vertices[2] },
    { cost: 200, startVertex: vertices[3], endVertex: vertices[2] },
    { cost: 10, startVertex: vertices[3], endVertex: vertices[1] },
  ],
};


const vehicle: VehicleModel = {
  batteryCapacity: 100
};

const origin = myGraph.vertices.find((vertex) => vertex.nickname === "A")!;
const destination = myGraph.vertices.find((vertex) => vertex.nickname === "C")!;

const chargingStations: ChargingStation[] = [
  {
    vertex: myGraph.vertices.find((vertex) => vertex.nickname === "D")!,
    connectors: [{
      output: new Array(100).fill(null).map((_, i) => ([i, 2]))
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
