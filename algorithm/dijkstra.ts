import type { Graph, Vertex } from ".";

export function dijkstra(graph: Graph, origin: Vertex, destination: Vertex) {
    function cost_between(u: Vertex, v: Vertex) {
        const edge = graph.edges.find(edge => edge.start_vertex === u && edge.end_vertex === v)
        return edge ? edge.cost! : Number.MAX_SAFE_INTEGER
    }

    function neighbour(u: Vertex): Vertex[] {
        return [...new Set(graph.edges.filter(edge => edge.start_vertex === u).map((edge) => edge.end_vertex))]
    }

    const dist = new Map<Vertex, number>();
    const previous = new Map<Vertex, Vertex | undefined>();

    for (const vertex of graph.vertices) {
        dist.set(vertex, Number.MAX_SAFE_INTEGER);
        previous.set(vertex, undefined);
    }   

    dist.set(origin, 0);

    // Create a copy of vertices
    let Q = [...graph.vertices];

    while (Q.length > 0) {
        // vertex in Q with smallest dist[]
        let u: Vertex | undefined;
        let _dist = Number.MAX_SAFE_INTEGER;
        for (const _u of Q) {
            const _u_dist = dist.get(_u)!;
            if (_u_dist < _dist) {
                u = _u;
                _dist = _u_dist;
            } 
        }

        if (!u) throw "Dijkstra was unable to find a valid path 🤡";

        if (dist.get(u)! >= Number.MAX_SAFE_INTEGER) break;
        if (u === destination) break;
        
        // Remove u from Q
        Q = Q.filter(i => i !== u)

        for (const v of neighbour(u)) {
            const alt = dist.get(u)! + cost_between(u, v)
            if (alt < dist.get(v)!) {
                dist.set(v, alt);
                previous.set(v, u);
            }
        }
    }

    const S: Vertex[] = []
    let u = destination;
    while (previous.get(u)) {
        S.push(u);
        u = previous.get(u)!;
    }   

    S.push(origin)

    return S.reverse();
}