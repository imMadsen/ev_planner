export type Vertex = {
    nickname?: string;
    batteryState?: number;
    time?: number;
}

export type Edge = {
    startVertex: Vertex;
    endVertex: Vertex;
    cost: number;
}

export type Graph = {
    edges: Edge[],
    vertices: Vertex[]
}

export type Path = {
    edges: Edge[];
    batteryState: number;
}

export type VehicleModel = {
    chargingCurve: [number, number][];
    batteryCapacity: number;
    KWHConsumedEachKilometer: (speed: number) => number;
}

export type Connector = {
    expectedOutput: [number, number][]
}

export type ChargingStation = {
    vertex: Vertex;
    connectors: Connector[];
}


export async function myAlgorithm(
    getShortestPath: (origin: Vertex, destination: Vertex) => Promise<Edge[]>,
    getEnergyConsumptionOfTraversel: (vehicle: VehicleModel, edge: Edge) => number,
    timeToTraverse: (edge: Edge) => number,
    origin: Vertex,
    destination: Vertex,
    vehicle: VehicleModel,
    chargingStations: ChargingStation[],
    batteryState: number,
) {

    function costBetween(u: Vertex, v: Vertex, graph: Graph) {
        const edge = graph.edges.find(edge => edge.startVertex === u && edge.endVertex === v)!

        const capacityNeeded = getEnergyConsumptionOfTraversel(vehicle, edge)

        if(capacityNeeded > u.batteryState!)
            return capacityNeeded

        const chargingStation = chargingStations.find(chargingStation => chargingStation.vertex === u)

        if(chargingStation !== undefined) {
            const fastestConnector = getFastestConnector(chargingStation, vehicle, u.batteryState!, capacityNeeded)
            const timeToCharge = getTimeToCharge(vehicle, fastestConnector!, u.batteryState || 0, capacityNeeded, 0);

            if(timeToCharge == undefined)
                return Number.MAX_SAFE_INTEGER

            return timeToTraverse(edge) + timeToCharge
        }
        
        return Number.MAX_SAFE_INTEGER;
    }

    function getNeighbours(u: Vertex, graph: Graph): Vertex[] {
        return [...new Set(graph.edges.filter(edge => edge.startVertex === u).map((edge) => edge.endVertex))]
    }

    function getFastestConnector(station: ChargingStation, vehicle: VehicleModel, startCapacity: number, endCapacity: number): Connector | undefined {
        let fastestConnector: Connector | undefined;
        let minTime = Infinity;
    
        for (let connector of station.connectors) {
            let chargeTime = getTimeToCharge(vehicle, connector, startCapacity, endCapacity, 0);
            if(chargeTime === undefined){
                return;
            }
            if (chargeTime < minTime) {
                minTime = chargeTime;
                fastestConnector = connector;
            }
        }
    
        return fastestConnector;
    }

    function getTimeToCharge(vehicle: VehicleModel, connector: Connector, startCapacity: number, targetCapacity: number, timeOfDay: number) {
        let sum = 0;
        
        for (let i=1; i<=connector.expectedOutput.length - 1; i++) {
            if(timeOfDay < connector.expectedOutput[i][0]) {
                   const l1_x = Math.max(timeOfDay, connector.expectedOutput[i - 1][0])
              const l2_x = connector.expectedOutput[i][0]
            
                const delta = (connector.expectedOutput[i - 1][1] - connector.expectedOutput[i][1]) / (connector.expectedOutput[i - 1][0] - connector.expectedOutput[i][0])
              const b_1 = connector.expectedOutput[i - 1][1] + (l1_x - connector.expectedOutput[i - 1][0]) * delta
              const b_2 = connector.expectedOutput[i - 1][1] + (l2_x - connector.expectedOutput[i - 1][0]) * delta
              
              const h = l2_x - l1_x
    
              sum += h * ((b_1 + b_2) / 2)
                  
                 if (targetCapacity < sum + startCapacity)
                  return l1_x;
          }
                
        }
    
        return;
    }

    const mainPath = await getShortestPath(origin, destination);





















    // Create a new Graph that only represents distances between chargingStations, origin & destination
    const vertices = [origin, destination, ...chargingStations.map(chargingStation => chargingStation.vertex)]
    const edges: Edge[] = []; 

    const graph: Graph = {
        vertices,
        edges
    }
    for (const v1 of vertices)
        for (const v2 of vertices)
            if (v1 !== v2) {
                try { // This try catch is needed since if a path is impossible getShortestPath->dijkstra will throw an error
                    edges.push({
                        startVertex: v1,
                        endVertex: v2,
                        cost: 0
                    })
                } catch(e) { /* Invalid Path */}
            }
            const dist = new Map<Vertex, number>();
            const previous = new Map<Vertex, Vertex | undefined>();
        
            for (const vertex of graph.vertices) {
                dist.set(vertex, Number.MAX_SAFE_INTEGER);
                previous.set(vertex, undefined);
            }   
        
            origin.batteryState = 10;
            origin.time = 0;

    dist.set(origin, 0);

    // Create a copy of verticies
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
        console.log(u.nickname, dist.get(u))

        for (const v of getNeighbours(u, graph)) {
            const cost = costBetween(u, v, graph)
            const alt = dist.get(u)! + cost
            console.log("Checking", v.nickname, alt, "Subtracting", cost)
            if (alt < dist.get(v)!) {
                v.batteryState = u.batteryState! - cost
                console.log("Visited", v.nickname, alt)

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