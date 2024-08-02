import {
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

import { circleMarker, geoJson, map, tileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";

type LatLng = {
  lat: number;
  lng: number;
};

async function getEnergyConsumptionOfTraversel(edge: Edge) {
  const ms = 36; // 130 km/h
  const last_ms = 0;
  const delta_h = 0;
  const edge_dist = (await getShortestPath(edge.startVertex, edge.endVertex))
    .cost!;
  const edge_radius = 0;

  return ev_energy(ms, last_ms, delta_h, edge_dist, edge_radius);
}

async function getTimeToTraverse(edge: Edge) {
  return (
    (await getShortestPath(edge.startVertex, edge.endVertex)).cost! /
    36 /* 130 km/h */
  );
}

const vertexToLatLng = new Map<Vertex, LatLng>();
const routeCache = new Map<string, Edge>();
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
    startVertex: origin,
    endVertex: destination,
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

// Prune the charging stations
const prunedChargingStations = prune_distance(chargeMapChargingStations, verticies, 1)

// Map the ChargeMap Charging Stations to ChargingStation Interface

// Create a generic Connector (since charge map does not contian data)

const genericConnector = {
  output: new Array(10000)
    .fill(null)
    .map((_, i) => [i, 300 /* 300 kWs */]),
} as Connector;


const chargingStations = prunedChargingStations.map(
  (chargingStation, i) => {
    const vertex = { nickname: "Charging Station " + i } as Vertex;
    vertexToLatLng.set(vertex, {
      lat: chargingStation.lat,
      lng: chargingStation.lng,
    });

    return {
      connectors: [genericConnector],
      vertex: vertex,
    };
  }
);

// Draw pruned Charging Stations
chargeMapChargingStations.forEach((chargingStation) => {
  const { lng, lat } = chargingStation;
  const isMarked = prunedChargingStations.includes(chargingStation);

  circleMarker([lat, lng], {
    color: isMarked ? "red" : "blue",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: isMarked ? 5 : 1, // radius of the circle in pixels
  })
    .addTo(myMap)
    .on("click", () => console.log(chargingStation.pool.charging_connectors));
});

myMap.fitBounds(coordsToLatLngs(verticies));

// Create the Origin and Destination
const originVertex = { nickname: "Origin" } as Vertex;
const destinationVertex = { nickname: "Destination" } as Vertex;

vertexToLatLng.set(originVertex, { lat: origin.lat, lng: origin.lng });
vertexToLatLng.set(destinationVertex, { lat: destination.lat, lng: destination.lng });

// Create the Initialization for the algorithm
// Tesla Model 3
const debug_scale = .5;

const tesla_model_3: VehicleModel = {
  batteryCapacity: 60 * 1000 * debug_scale, // 60 kWh
}

const vehicle: Vehicle = {
  model: tesla_model_3,
  batteryState: 60 * 1000 * debug_scale, // 60 kWh,
};

async function exe() {
  const startTime = new Date();
  
  const result = await myAlgorithm(
      getEnergyConsumptionOfTraversel,
      getTimeToTraverse,
      originVertex,
      destinationVertex,
      vehicle,
      chargingStations,
      0
    )
  
  const endTime = new Date();
  
  console.log("Calcuations took", endTime.getTime() - startTime.getTime())


  console.log(result)
}

await exe();
await exe();

// result.forEach(a => {
//   const { lat, lng } = vertexToLatLng.get(a)!
//   circleMarker([lat, lng], {
//     color: "green",
//     fillColor: "#f03",
//     fillOpacity: 0.5,
//     radius: 5, // radius of the circle in pixels
//   })
//     .addTo(myMap)
//     .on("click", () => console.log(a));
// })

// console.log(result)