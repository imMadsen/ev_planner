import {get_shortest_path} from "../index"


export async function prune_backwards_edges(graph: Graph, destination: Vertex) : Graph {

  for (let i = graph.edges.length - 1; i >= 0; i--) {
    const edge = graph.edges[i];
    const startVertex = edge.start_vertex;
    const endVertex = edge.end_vertex;


    const startVertexDistance = await get_shortest_path(startVertex, destination);
    const endVertexDistance = await get_shortest_path(endVertex, destination);

    // Remove the edge if the end vertex has a longer path to the destination than the start vertex
    if (endVertexDistance >= startVertexDistance) {
      graph.edges.splice(i, 1);
    }
  }

  return graph;
}