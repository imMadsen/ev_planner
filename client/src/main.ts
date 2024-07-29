                          import { circleMarker, geoJson, map, tileLayer } from "leaflet";
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
  ChargingStation as ChargeMapStation,
} from "./chargemap";
import {
  coordsToLatLngs,
  decodeOSMGeometry,
  distancePointToLineSegmentInKM,
  getRouteData,
} from "./utilities";
import { OSRMResponse } from "./osrm.types";
import { ev_energy } from "./ev_energy";
import "leaflet/dist/leaflet.css";
import "./index.css";

async function getEnergyConsumptionOfTraversel(edge: Edge) {
  const ms = 36; // 130 km/h
  const last_ms = 0;
  const delta_h = 0;
  const edge_dist = (await getShortestPath(edge.startVertex, edge.endVertex))
    .cost!;
  const edge_radius = 0;

  return ev_energy(ms, last_ms, delta_h, edge_dist, edge_radius);
}

type LatLng = {
  lat: number;
  lng: number;
};

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

async function getTimeToTraverse(edge: Edge) {
  return (
    (await getShortestPath(edge.startVertex, edge.endVertex)).cost! /
    36 /* 130 km/h */
  );
}

// Initialize Map
const myMap = map("map").setView([56.511984, 10.067244], 13); // Set initial view

tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(myMap);

// Initialize Route
const data: OSRMResponse = await getRouteData(
  57.732561,
  10.582929,
  56.41570689232712,
  10.074417477174261
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

// Prune Charging Stations
// Gets the nearest charging stations by projecting to the Edges
const prunedChargingStations: ChargeMapStation[] = [];

let previousNode: number[] | undefined;
const maxRange = 1; // Maximum distance from the line segment in km
verticies.forEach((node, index) => {
  const [lng1, lat1] = node;

  if (previousNode !== undefined && index > 0) {
    const [lng2, lat2] = previousNode;
    chargeMapChargingStations.forEach((chargingStation) => {
      const dist = distancePointToLineSegmentInKM(
        chargingStation.lat,
        chargingStation.lng,
        lat1,
        lng1,
        lat2,
        lng2
      );
      if (dist <= maxRange) {
        prunedChargingStations.push(chargingStation);
      }
    });
  }

  previousNode = node;
});

console.log("Prunded", prunedChargingStations.length, "charging stations");

// Add Pruned Charging Stations to map
const genericConnector = {
  output: new Array(10000)
    .fill(null)
    .map((_, i) => [i, 300 /* 300 kWs */]),
} as Connector;

const chargingStations: ChargingStation[] = prunedChargingStations.map(
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
const origin = { nickname: "Origin" } as Vertex;
const destination = { nickname: "Destination" } as Vertex;

vertexToLatLng.set(origin, { lat: 57.732561, lng: 10.582929 });
vertexToLatLng.set(destination, { lat: 56.41570689232712, lng: 10.074417477174261 });

// Create the Initialization for the algorithm
// Tesla Model 3
const tesla_model_3: VehicleModel = {
  batteryCapacity: 60 * 1000, // 60 kWh
}

const vehicle: Vehicle = {
  model: tesla_model_3,
  batteryState: 60 * 1000, // 50 kWh,
};

const result = await myAlgorithm(
    getEnergyConsumptionOfTraversel,
    getTimeToTraverse,
    origin,
    destination,
    vehicle,
    chargingStations,
    0
  )

result.forEach(a => {
  const { lat, lng } = vertexToLatLng.get(a)!
  circleMarker([lat, lng], {
    color: "green",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: 5, // radius of the circle in pixels
  })
    .addTo(myMap)
    .on("click", () => console.log(a));
})

console.log(result)