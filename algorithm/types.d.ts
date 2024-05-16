type Vertex = {
    nickname?: string;
}

type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost: number;
}

type Graph = {
    edges: Edge[],
    vertices: Vertex[]
}

type Path = {
    edges: Edge[];
    batteryState: number;
}

type Vehicle = {
    batteryState: number;
    batteryCapacity: number;
}

type Connector = {
    expectedOutput: [number, number][]
}

type ChargingStation = {
    vertex: Vertex;
    connectors: Connector[];
}
