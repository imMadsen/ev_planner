import { myAlgorithm, type ChargingStation, type Connector, type Edge, type Vehicle, type Vertex } from "algorithm";
import { decode_osm } from "./utilities/decode_osm";
import { get_route_data } from "./utilities/get_route_data";
import { tesla_model_3 } from "./vehicle_models/tesla";
import { ev_energy } from "./utilities/ev_energy";
import { prune_distance } from "./prune/prune_distance";
import { chargeMapChargingStations, distances } from "data";
import { debug_scale } from "./debug"

type LatLng = {
    lat: number;
    lng: number;
};

// Create a generic Connector (Note: Output is constant over time)
function createGenericConnector(outputkWs: number) {
    const genericConnector = {
        output_time_kw: new Array(10000)
            .fill(null)
            .map((_, i) => [i, outputkWs]),
    } as Connector;

    return genericConnector;
}

async function getEnergyConsumptionOfTraversel(edge: Edge) {
    const ms = 36; // 130 km/h
    const last_ms = 0;
    const delta_h = 0;
    const edge_dist = await get_shortest_path(edge.start_vertex, edge.end_vertex)
    const edge_radius = 0;

    return ev_energy(ms, last_ms, delta_h, edge_dist, edge_radius);
}

async function getTimeToTraverse(edge: Edge) {
    return (
        (await get_shortest_path(edge.start_vertex, edge.end_vertex)) /
        36 /* 130 km/h */
    );
}

const vertexToLatLng = new Map<Vertex, LatLng>();
async function get_shortest_path(
    origin: Vertex,
    destination: Vertex
): number {
    const hash = `${origin.nickname}_${destination.nickname}`;

    const cachedDistance = distances[hash];
    if (cachedDistance) {
        return cachedDistance
    }

    const { lat: latOrigin, lng: lngOrigin } = vertexToLatLng.get(origin);
    const { lat: latDestination, lng: lngDestination } = vertexToLatLng.get(destination);

    const data = await get_route_data(
        latOrigin,
        lngOrigin,
        latDestination,
        lngDestination
    );

    const distance = data.routes.length > 0
        ? data.routes[0].distance
        : Number.MAX_SAFE_INTEGER;

    distances[hash] = distance;

    return distance;
}



const origin = { lat: 57.72374620954098, lng: 10.559437867072692 }
const destination = { lat: 53.95479334684554, lng: 9.719076450821097 }

let verticies: number[][] = [];

// If they want 6 digits of precision
const mul = false ? 1e6 : 1e5;

// Initialize Route
const data = await get_route_data(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
);

data.routes.forEach((route) => {
    verticies = [...verticies, ...decode_osm(route.geometry, mul)];
});

// Setting up the HTTP endpoint
const server = Bun.serve({
    async fetch(req) {
        // Create an Instance of a Vehicle
        const vehicle: Vehicle = {
            model: tesla_model_3,
            battery_state_kw: 60 * 1000 * debug_scale, // 60 kWh,
        };

        // Create the Origin and Destination
        const originVertex = { nickname: "Origin" } as Vertex;
        const destinationVertex = { nickname: "Destination" } as Vertex;

        vertexToLatLng.set(originVertex, { lat: origin.lat, lng: origin.lng });
        vertexToLatLng.set(destinationVertex, { lat: destination.lat, lng: destination.lng });

        // Prune the charging stations
        const prunedChargingStations = prune_distance(chargeMapChargingStations, verticies, 1)

        // Map the ChargeMap Charging Stations to Algorithm ChargingStation Interface
        const chargingStations = prunedChargingStations.map(
            (chargingStation, i) => {
                const vertex = { nickname: chargingStation.pool.id.toString() } as Vertex;
                vertexToLatLng.set(vertex, {
                    lat: chargingStation.lat,
                    lng: chargingStation.lng,
                });

                return {
                    connectors: chargingStation.pool.charging_connectors.map((output) => createGenericConnector(output.power_max)),
                    vertex: vertex,
                };
            }
        );

        const finalPath = await myAlgorithm(
            getEnergyConsumptionOfTraversel,
            getTimeToTraverse,
            originVertex,
            destinationVertex,
            vehicle,
            chargingStations,
            0
        )

        return new Response("Bun!");
    },
});

console.log(distances["332168_321173"])

// server.port is the randomly selected port
console.log(server.port);
