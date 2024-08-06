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
  distances
} from "./distances";
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

// Draw all Charging Stations for visual purposes
chargeMapChargingStations.forEach(({ lat, lng }) => {
  circleMarker([lat, lng], {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: 1
  })
  .addTo(myMap) 
})

// Create the Initialization for the algorithm
// Tesla Model 3
const debug_scale = 1.2;

const tesla_model_3: VehicleModel = {

  battery_capacity_kw: 60 * 1000 * debug_scale, // 60 kWh
  charging_curve: [
    //kwh, max kW received
    [0, 50],   // 0 kWh
    [0.6, 62], // 0.6 kWh
    [1.2, 74], // 1.2 kWh
    [1.8, 86], // 1.8 kWh
    [2.4, 98], // 2.4 kWh
    [3.0, 110], // 3.0 kWh
    [3.5, 121], // 3.5 kWh
    [4.1, 133], // 4.1 kWh
    [4.7, 145], // 4.7 kWh
    [5.3, 157], // 5.3 kWh
    [5.9, 169], // 5.9 kWh
    [6.5, 168], // 6.5 kWh
    [7.1, 160], // 7.1 kWh
    [7.7, 151], // 7.7 kWh
    [8.3, 146], // 8.3 kWh
    [8.8, 141], // 8.8 kWh
    [9.4, 138], // 9.4 kWh
    [10.0, 135], // 10.0 kWh
    [10.6, 133], // 10.6 kWh
    [11.2, 130], // 11.2 kWh
    [11.8, 129], // 11.8 kWh
    [12.4, 128], // 12.4 kWh
    [13.0, 127], // 13.0 kWh
    [13.6, 126], // 13.6 kWh
    [14.2, 125], // 14.2 kWh
    [14.8, 124], // 14.8 kWh
    [15.3, 124], // 15.3 kWh
    [15.9, 123], // 15.9 kWh
    [16.5, 122], // 16.5 kWh
    [17.1, 121], // 17.1 kWh
    [17.7, 120], // 17.7 kWh
    [18.3, 119], // 18.3 kWh
    [18.9, 116], // 18.9 kWh
    [19.5, 115], // 19.5 kWh
    [20.1, 114], // 20.1 kWh
    [20.6, 112], // 20.6 kWh
    [21.2, 110], // 21.2 kWh
    [21.8, 109], // 21.8 kWh
    [22.4, 108], // 22.4 kWh
    [23.0, 106], // 23.0 kWh
    [23.6, 104], // 23.6 kWh
    [24.2, 103], // 24.2 kWh
    [24.8, 101], // 24.8 kWh
    [25.4, 100], // 25.4 kWh
    [26.0, 97], // 26.0 kWh
    [26.6, 95], // 26.6 kWh
    [27.1, 94], // 27.1 kWh
    [27.7, 92], // 27.7 kWh
    [28.3, 90], // 28.3 kWh
    [28.9, 88], // 28.9 kWh
    [29.5, 86], // 29.5 kWh
    [30.1, 84], // 30.1 kWh
    [30.7, 82], // 30.7 kWh
    [31.3, 80], // 31.3 kWh
    [31.9, 79], // 31.9 kWh
    [32.4, 77], // 32.4 kWh
    [33.0, 75], // 33.0 kWh
    [33.6, 73], // 33.6 kWh
    [34.2, 71], // 34.2 kWh
    [34.8, 70], // 34.8 kWh
    [35.4, 68], // 35.4 kWh
    [36.0, 66], // 36.0 kWh
    [36.6, 65], // 36.6 kWh
    [37.2, 64], // 37.2 kWh
    [37.8, 62], // 37.8 kWh
    [38.4, 60], // 38.4 kWh
    [38.9, 58], // 38.9 kWh
    [39.5, 57], // 39.5 kWh
    [40.1, 56], // 40.1 kWh
    [40.7, 55], // 40.7 kWh
    [41.3, 53], // 41.3 kWh
    [41.9, 52], // 41.9 kWh
    [42.5, 51], // 42.5 kWh
    [43.1, 50], // 43.1 kWh
    [43.7, 48], // 43.7 kWh
    [44.2, 47], // 44.2 kWh
    [44.8, 46], // 44.8 kWh
    [45.4, 46], // 45.4 kWh
    [46.0, 45], // 46.0 kWh
    [46.6, 44], // 46.6 kWh
    [47.2, 43], // 47.2 kWh
    [47.8, 43], // 47.8 kWh
    [48.4, 42], // 48.4 kWh
    [49.0, 41], // 49.0 kWh
    [49.6, 40], // 49.6 kWh
    [50.2, 39], // 50.2 kWh
    [50.7, 38], // 50.7 kWh
    [51.3, 37], // 51.3 kWh
    [51.9, 37], // 51.9 kWh
    [52.5, 35], // 52.5 kWh
    [53.1, 34], // 53.1 kWh
    [53.7, 31], // 53.7 kWh
    [54.3, 28], // 54.3 kWh
    [54.9, 25], // 54.9 kWh
    [55.5, 22], // 55.5 kWh
    [56.0, 20], // 56.0 kWh
    [56.6, 17], // 56.6 kWh
    [57.2, 14], // 57.2 kWh
    [57.8, 11], // 57.8 kWh
    [58.4, 8],  // 58.4 kWh
    [59.0, 5]   // 59.0 kWh
  ]
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

  const finalPath = await myAlgorithm(
    getEnergyConsumptionOfTraversel,
    getTimeToTraverse,
    originVertex,
    destinationVertex,
    vehicle,
    chargingStations,
    0
  )

  // Draw Charging Stations

  finalPath.forEach((vertex) => {
    const { lng, lat } = vertexToLatLng.get(vertex)!;
    const isMarked = finalPath;

    circleMarker([lat, lng], {
      color: isMarked ? "red" : "blue",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: isMarked ? 5 : 1, // radius of the circle in pixels
    })
    .addTo(myMap)
  });


  const endTime = new Date();

  console.log("Experiment ended at", startTime.getTime())

  console.log("Calcuations took", endTime.getTime() - startTime.getTime())
}

// Experiment "prune_distance"

for (const d of [2]) {

  // Prune the charging stations
  const prunedChargingStations = prune_distance(chargeMapChargingStations, verticies, d)
  prunedChargingStations.forEach((chargingStation) => {
    circleMarker([chargingStation.lat, chargingStation.lng], {
      color: "blue",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 1
    })
    .addEventListener("click", () => console.log(chargingStation))
    .addTo(myMap) 
  });


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

  console.log("Running experiment with prune_distance (cache = no), d = ", d)

  routeCache = new Map<string, Edge>();

  await experiment(chargingStations)

  console.log(chargingStations)

  // console.log("Running experiment with prune_distance (cache = yes), d = ", d)

  // await experiment(chargingStations)
}



























