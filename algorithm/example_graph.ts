import { Dijkstra } from "./dijkstra";

const vertices: Vertex[] = [{ nickname: "A" }, { nickname: "B" }, { nickname: "C" }, { nickname: "D" }, { nickname: "E" }];

const myGraph: Graph = {
    vertices,
    edges: [
        { cost: 1, startVertex: vertices[0], endVertex: vertices[1] },
        { cost: 5, startVertex: vertices[0], endVertex: vertices[2] },
        { cost: 10, startVertex: vertices[1], endVertex: vertices[2] },
        { cost: 1, startVertex: vertices[2], endVertex: vertices[3] },
        { cost: 10, startVertex: vertices[3], endVertex: vertices[4] },
        { cost: 1, startVertex: vertices[2], endVertex: vertices[4] },
    ]
}

console.log(Dijkstra(myGraph, vertices[0], vertices[1]))