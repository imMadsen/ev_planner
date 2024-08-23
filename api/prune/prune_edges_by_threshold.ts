import {get_shortest_path} from "../index";

export async function prune_edges_by_threshold(graph: Graph, maxDistance: number) : Graph {

    for (let i = graph.edges.length - 1; i >= 0; i--) {
      const edge = graph.edges[i];
  
      const edgeDistance = await get_shortest_path(edge.start_vertex, edge.end_vertex);
  
      // Remove the edge if the distance from start_vertex to the destination is greater than maxDistance
      if (edgeDistance > maxDistance) {
        graph.edges.splice(i, 1);
      }
    }

    return graph;
  }
  