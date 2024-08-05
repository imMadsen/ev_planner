import { type Vertex as GenericVertex } from "./index"

type Vertex = GenericVertex & {
    x: number;
    y: number;
}

export type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost?: number;
};

export type Graph = {
    edges: Edge[];
    vertices: Vertex[];
};

export function astar(graph: Graph, origin: Vertex, destination: Vertex, heuristic_func: (vertex: Vertex) => number) {
    function reconstruct_path(cameFrom: Map<Vertex, Vertex>, current: Vertex) {

        const total_path: Vertex[] = [current];
        
        // while current in cameFrom.Keys:
        //     current:= cameFrom[current]
        // total_path.prepend(current)

        return total_path
    }    
    
    function neighbours(u: Vertex): Vertex[] {
        return [...new Set(graph.edges.filter(edge => edge.startVertex === u).map((edge) => edge.endVertex))]
    }

    function d(current: Vertex, neighbour: Vertex) {
        return 1;
    }

    const openSet = new Set<Vertex>([origin]);
    const cameFrom = new Map();

    const gScore = new Map<Vertex, number>();
    for (const vertex of graph.vertices) {
        gScore.set(vertex, Number.MAX_SAFE_INTEGER);
    }

    gScore.set(origin, 0);

    const fScore = new Map<Vertex, number>();
    for (const vertex of graph.vertices) {
        fScore.set(vertex, Number.MAX_SAFE_INTEGER);
    }

    fScore.set(origin, 0);

    while (openSet.size > 0) {
        let current: Vertex | undefined;
        let lowest_fScore = Number.MAX_SAFE_INTEGER;
        openSet.forEach((vertex) => {
            const vertex_fScore = fScore.get(vertex)!;
            if (vertex_fScore < lowest_fScore) {
                lowest_fScore = vertex_fScore;
                current = vertex;
            }
        })

        if (!current) throw new Error("Unable to find a Vertex with lowest fScore");

        if (current == destination) {
            return reconstruct_path(cameFrom, current)
        }

        openSet.delete(current);

        for (const neighbour of neighbours(current)) {
            const tentative_gScore = gScore.get(current)! + d(current, neighbour);
            if (tentative_gScore < gScore.get(neighbour)!) {
                cameFrom.set(neighbour, current);
                gScore.set(neighbour, tentative_gScore);
                fScore.set(neighbour, tentative_gScore + heuristic_func(neighbour));
                openSet.add(neighbour);
            }
        }
    }

    throw new Error("A* could not find a valid path to the given destination")
}