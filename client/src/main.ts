import {
  ChargingStation,
  Connector,
  Edge,
  Vehicle,
  Vertex,
  myAlgorithm,
  type VehicleModel,
} from "algorithm";
import {
  chargingStations as chargeMapChargingStations,
} from "./chargemap";
import {
  coordsToLatLngs,
  decodeOSMGeometry,
  getRouteData,
} from "./utilities";
import { OSRMResponse } from "./osrm.types";
import { ev_energy } from "./ev_energy";
import { prune_distance } from "./prune/prune_distance";

import { geoJson, map, tileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";

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
  const edge_dist = (await getShortestPath(edge.start_vertex, edge.end_vertex))
    .cost!;
  const edge_radius = 0;

  return ev_energy(ms, last_ms, delta_h, edge_dist, edge_radius);
}

async function getTimeToTraverse(edge: Edge) {
  return (
    (await getShortestPath(edge.start_vertex, edge.end_vertex)).cost! /
    36 /* 130 km/h */
  );
}

const vertexToLatLng = new Map<Vertex, LatLng>();
let routeCache = new Map<string, Edge>();
async function getShortestPath(
  origin: Vertex,
  destination: Vertex
): Promise<Edge> {
  const hash = `${origin.nickname}->${destination.nickname}`;

  if (routeCache.has(hash)) return routeCache.get(hash)!;

  const { lat: latOrigin, lng: lngOrigin } = vertexToLatLng.get(origin)!;
  const { lat: latDestination, lng: lngDestination } =
    vertexToLatLng.get(destination)!;

  const data: OSRMResponse = await getRouteData(
    latOrigin,
    lngOrigin,
    latDestination,
    lngDestination
  );
  const edge: Edge = {
    start_vertex: origin,
    end_vertex: destination,
    cost:
      data.routes.length > 0
        ? data.routes[0].distance
        : Number.MAX_SAFE_INTEGER,
  };

  routeCache.set(hash, edge);

  return edge;
}


// Initialize Map

const myMap = map("map").setView([56.511984, 10.067244], 13); // Set initial view

tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(myMap);

const origin = { lat: 57.72374620954098, lng: 10.559437867072692 }
const destination = { lat: 53.95479334684554, lng: 9.719076450821097 }

// Initialize Route
const data: OSRMResponse = await getRouteData(
  origin.lat,
  origin.lng,
  destination.lat,
  destination.lng
);

let verticies: number[][] = [];

// If they want 6 digits of precision
const mul = false ? 1e6 : 1e5;

data.routes.forEach((route) => {
  verticies = [...verticies, ...decodeOSMGeometry(route.geometry, mul)];
});

// Draw Route
const json = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: verticies,
      },
      properties: {},
    },
  ],
};

const geojson = geoJson(json as any, {
  style: function (feature) {
    return {
      fillColor: feature?.properties.fill,
      color: "#9900CC",
      opacity: 0.75,
      weight: 7,
    };
  },
});

geojson.addTo(myMap);

myMap.fitBounds(coordsToLatLngs(verticies));

// Create the Initialization for the algorithm
// Tesla Model 3
const debug_scale = 1;

const tesla_model_3: VehicleModel = {
  battery_capacity_kw: 60 * 1000 * debug_scale, // 60 kWh
}

async function experiment(chargingStations: ChargingStation[]) {
  // Create the Origin and Destination
  const originVertex = { nickname: "Origin" } as Vertex;
  const destinationVertex = { nickname: "Destination" } as Vertex;

  vertexToLatLng.set(originVertex, { lat: origin.lat, lng: origin.lng });
  vertexToLatLng.set(destinationVertex, { lat: destination.lat, lng: destination.lng });

  const vehicle: Vehicle = {
    model: tesla_model_3,
    battery_state_kw: 60 * 1000 * debug_scale, // 60 kWh,
  };


  const startTime = new Date();

  console.log("Experiment started at", startTime.getTime())

  await myAlgorithm(
    getEnergyConsumptionOfTraversel,
    getTimeToTraverse,
    originVertex,
    destinationVertex,
    vehicle,
    chargingStations,
    0
  )

  const endTime = new Date();

  console.log("Experiment ended at", startTime.getTime())

  console.log("Calcuations took", endTime.getTime() - startTime.getTime())
}

// Experiment "prune_distance"

for (const d of [0.5, 4]) {

  // Prune the charging stations
  const prunedChargingStations = prune_distance(chargeMapChargingStations, verticies, d)


  // Map the ChargeMap Charging Stations to Algorithm ChargingStation Interface
  const chargingStations = prunedChargingStations.map(
    (chargingStation, i) => {
      const vertex = { nickname: "Charging Station " + chargingStation.pool.id } as Vertex;
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

  console.log("Running experiment with prune_distance (cache = no), d = ", d)

  routeCache = new Map<string, Edge>();

  await experiment(chargingStations)

  console.log(chargingStations)

  // console.log("Running experiment with prune_distance (cache = yes), d = ", d)

  // await experiment(chargingStations)
}



























// Draw Charging Stations

// chargeMapChargingStations.forEach((chargingStation) => {
//   const { lng, lat } = chargingStation;
//   const isMarked = prunedChargingStations.includes(chargingStation);

//   circleMarker([lat, lng], {
//     color: isMarked ? "red" : "blue",
//     fillColor: "#f03",
//     fillOpacity: 0.5,
//     radius: isMarked ? 5 : 1, // radius of the circle in pixels
//   })
//     .addTo(myMap)
// });
