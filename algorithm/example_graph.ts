import {
  myAlgorithm,
  type ChargingStation,
  type Connector,
  type Edge,
  type Graph,
  type Vehicle,
  type Vertex,
} from ".";
import { dijkstra } from "./dijkstra";

const vertices: Vertex[] = [
  { nickname: "A" },
  { nickname: "B" },
  { nickname: "C" },
  { nickname: "D" },
  { nickname: "E" },
];

const myGraph: Graph = {
  vertices,
  edges: [
    { cost: 1, startVertex: vertices[0], endVertex: vertices[1] },
    { cost: 5, startVertex: vertices[0], endVertex: vertices[2] },
    { cost: 10, startVertex: vertices[1], endVertex: vertices[2] },
    { cost: 1, startVertex: vertices[2], endVertex: vertices[3] },
    { cost: 10, startVertex: vertices[3], endVertex: vertices[4] },
    { cost: 1, startVertex: vertices[2], endVertex: vertices[4] },
  ],
};

function getShortestPath(origin: Vertex, destination: Vertex) {
  const edges: Edge[] = [];
  const vertices = dijkstra(myGraph, origin, destination);
  for (let i = 1; i < vertices.length; i++) {
    edges.push(
      myGraph.edges.find(
        (v) => v.startVertex === vertices[i - 1] && v.endVertex === vertices[i]
      )!
    );
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

function getTimeConsumptionOfCharging(
  vehicle: Vehicle,
  connector: Connector,
  batteryState: number
) {
  return 0;
}

const vehicle: Vehicle = {
  batteryCapacity: 20,
  batteryState: 3,
};

const origin = myGraph.vertices.find((vertex) => vertex.nickname === "A")!;
const destination = myGraph.vertices.find((vertex) => vertex.nickname === "E")!;

const chargingStations: ChargingStation[] = [
  {
    connectors: [],
    vertex: myGraph.vertices.find((vertex) => vertex.nickname === "B")!,
  },
  {
    connectors: [],
    vertex: myGraph.vertices.find((vertex) => vertex.nickname === "D")!,
  },
];

console.log(
  myAlgorithm(
    getShortestPath,
    getEnergyConsumptionOfTraversel,
    origin,
    destination,
    vehicle,
    chargingStations
  )
);
