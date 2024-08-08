import { myAlgorithm, type Connector, type Edge, type Vehicle, type Vertex } from "algorithm";
import { decode_osm } from "./utilities/decode_osm";
import { get_route_data } from "./utilities/get_route_data";
import { tesla_model_3 } from "./vehicle_models/tesla";
import { ev_energy } from "./utilities/ev_energy";
import { prune_distance } from "./prune/prune_distance";
import { chargeMapChargingStations, distances } from "data";
import { debug_scale } from "./debug"

import { findXForArea, findDynamicXForArea } from "algorithm/utilities";

type LatLng = {
    lat: number;
    lng: number;
};

// Create a generic Connector (Note: Output is constant over time)
function createGenericConnector(outputkW: number) {
    const genericConnector = {
        output_time_kw: new Array(10000)
            .fill(null)
            .map((_, i) => [i, outputkW * 1000]), // Convert from kW to W
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
    const distance = await get_shortest_path(edge.start_vertex, edge.end_vertex);
    const speed = 36 /* 130 km/h */
    const time = distance / speed

    return time;
}

const vertexToLatLng = new Map<Vertex, LatLng>();
async function get_shortest_path(
    origin: Vertex,
    destination: Vertex
) {
    const hash = `${origin.nickname}_${destination.nickname}`;

    const cachedDistance = distances[hash];
    if (cachedDistance) {
        return cachedDistance
    }

    const { lat: latOrigin, lng: lngOrigin } = vertexToLatLng.get(origin)!;
    const { lat: latDestination, lng: lngDestination } = vertexToLatLng.get(destination)!;

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

// Setting up the HTTP endpoint
const server = Bun.serve({
    async fetch(req) {
        // receive JSON data to a POST request
        if (req.method !== "GET") return new Response("Page not found", { status: 404 });


        const url_search_params = new URLSearchParams(req.url.split("?")[1]);

        const olat_search_param = url_search_params.get("olat")
        const olng_search_param = url_search_params.get("olng")

        const dlat_search_param = url_search_params.get("dlat")
        const dlng_search_param = url_search_params.get("dlng")

        const origin = {
            lat: olat_search_param ? Number(olat_search_param) : 57.738167,
            lng: olng_search_param ? Number(olng_search_param) : 10.633207
        }

        const destination = {
            lat: olat_search_param ? Number(dlat_search_param) : 57.738167,
            lng: olng_search_param ? Number(dlng_search_param) : 10.633207
        }

        const parameter_search_param = url_search_params.get("parameter");
        const parameter = parameter_search_param ? Number(parameter_search_param) : 1;

        let vertices: number[][] = [];

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
            vertices = [...vertices, ...decode_osm(route.geometry, mul)];
        });

        // Create the Origin and Destination
        const originVertex = { nickname: "Origin" } as Vertex;
        const destinationVertex = { nickname: "Destination" } as Vertex;

        vertexToLatLng.set(originVertex, { lat: origin.lat, lng: origin.lng });
        vertexToLatLng.set(destinationVertex, { lat: destination.lat, lng: destination.lng });

        // Create an Instance of a Vehicle
        const vehicle: Vehicle = {
            model: tesla_model_3,
            battery_state_wh: 60 * 1000 * debug_scale, // 60 kWh,
        };


        // Prune the charging stations
        const prunedChargingStations = prune_distance(chargeMapChargingStations, vertices, parameter)

        // Map the ChargeMap Charging Stations to Algorithm ChargingStation Interface
        const chargingStations = prunedChargingStations.map(
            (chargingStation, i) => {
                const vertex = { nickname: chargingStation.pool.id.toString() } as Vertex;
                vertexToLatLng.set(vertex, {
                    lat: chargingStation.lat,
                    lng: chargingStation.lng,
                });

                return {
                    //@ts-ignore
                    connectors: chargingStation.pool.charging_connectors.map((output) => createGenericConnector(output.power_max)),
                    vertex: vertex,
                };
            }
        );

        const { destination_time, ordered_vertices, total_visits } = await myAlgorithm(
            getEnergyConsumptionOfTraversel,
            getTimeToTraverse,
            originVertex,
            destinationVertex,
            vehicle,
            chargingStations,
            0
        )

        /*
        Distance kørt i alt
        Mænge laderstationer besøgt
        Tid brugt og mængde ladet ved hver station

        */

        const response = Response.json({
            ordered_vertices: ordered_vertices.map(vertex => vertex.nickname),
            charging_stations_count: prunedChargingStations.length,
            destination_time,
            total_visits,
            vertices
        });

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        return response;
    },
});

// server.port is the randomly selected port
console.log(server.port);


/*
const genericConnector = {
    output_time_kw: new Array(10000)
        .fill(null)
        .map((_, i) => [i, 300 * 1000]), // Convert from kW to W
} as Connector;


const timeToChargeDynamic = findDynamicXForArea(genericConnector.output_time_kw, 0, 60000, vehicle, originVertex);
const timeToCharge = findXForArea(genericConnector.output_time_kw, 0, 60000);
console.log("TimeDynamic: " + timeToChargeDynamic);
console.log("Time: " + timeToCharge);
*/