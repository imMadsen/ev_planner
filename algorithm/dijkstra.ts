export function Dijkstra(graph: Graph, origin: Vertex, destination: Vertex) {
    function cost_between(u: Vertex, v: Vertex) {
        const edge = graph.edges.find(edge => edge.startVertex === u && edge.endVertex === v)
        return edge ? edge.cost : Number.MAX_SAFE_INTEGER
    }

    const dist = new Map<Vertex, number>();
    const previous = new Map<Vertex, Vertex | undefined>();

    for (const vertex of graph.vertices) {
        dist.set(vertex, Number.MAX_SAFE_INTEGER);
        previous.set(vertex, undefined);
    }   

    dist.set(origin, 0);

    // Create a copy of verticies
    const Q = [...graph.vertices];

    while (Q.length > 0) {
        const u = Q[0];

        if (dist.get(u)! >= Number.MAX_SAFE_INTEGER) break;
        if (u === destination) break;
        
        // Remove u from Q
        Q.filter(i => i !== u)

        const neighbours = Q.filter(i => i);
        for (const v of neighbours) {
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

    return S;
}

const myGraph: Graph = {
    vertices: [],
    edges: []
}