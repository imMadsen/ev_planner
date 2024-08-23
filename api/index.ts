import { myAlgorithm, type Connector, type Edge, type Vehicle, type Vertex } from "algorithm";
import { get_route_data } from "./utilities/get_route_data";
import { tesla_model_3 } from "./vehicle_models/tesla";
import { ev_energy } from "./utilities/ev_energy";
import { distances } from "data";
import { debug_scale } from "./debug"
import { new_prune_distance } from "./prune/new_prune_distance";
import { prune_backwards_edges } from "./prune/prune_backwards_edges";
import { prune_edges_by_threshold } from "./prune/prune_edges_by_threshold";
import { prune_k_nearest_smart } from "./prune/prune_k_nearest_smart";

type LatLng = {
    lat: number;
    lng: number;
};

// Create a generic Connector (Note: Output is constant over time)
export function createGenericConnector(outputkW: number) {
    const genericConnector = {
        output_time_kw: new Array(100000)
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

    const energyConsumed = ev_energy(ms, last_ms, delta_h, edge_dist, edge_radius);

    return energyConsumed;
}

async function getTimeToTraverse(edge: Edge) {
    const distance = await get_shortest_path(edge.start_vertex, edge.end_vertex);
    const speed = 36 /* 130 km/h */
    const time = distance / speed

    return time;
}

export const vertexToLatLng = new Map<Vertex, LatLng>();

export async function get_shortest_path(
    origin: Vertex,
    destination: Vertex
) {
    const hash = `${origin.id}_${destination.id}`;

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

        // Create the Origin and Destination
        const originVertex = {
            id: "Origin",
            debug_data: {
                amountCharged: 0,
                chargeTime: 0,
                timeOfArrival: 0
            }
        } as Vertex;

        const destinationVertex = {
            id: "Destination",
            debug_data: {
                amountCharged: 0,
                chargeTime: 0,
                timeOfArrival: 0
            }
        } as Vertex;

        vertexToLatLng.set(originVertex, { lat: origin.lat, lng: origin.lng });
        vertexToLatLng.set(destinationVertex, { lat: destination.lat, lng: destination.lng });

        // Create an Instance of a Vehicle
        const vehicle: Vehicle = {
            model: tesla_model_3,
            battery_state_wh: 60 * 1000 * debug_scale, // 60 kWh,
        };


        // Prune the charging stations
        let { graph, mainpath_vertices, mappedChargingStations } = await new_prune_distance(originVertex, destinationVertex, parameter)

        graph = await prune_backwards_edges(graph, destinationVertex);


        const { destination_time, ordered_vertices, total_visits, relevant_edges } = await myAlgorithm(
            getEnergyConsumptionOfTraversel,
            getTimeToTraverse,
            originVertex,
            destinationVertex,
            graph,
            vehicle,
            mappedChargingStations,
            0,
        )

        const response = Response.json({
            ordered_vertices,
            charging_stations_count: mappedChargingStations.length,
            destination_time,
            total_visits,
            relevant_edges,
            vertices: mainpath_vertices
        });

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        return response;
    },
});

// server.port is the randomly selected port
console.log(server.port);