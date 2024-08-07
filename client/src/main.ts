import {
  ChargingStation,
  Edge,
  Vertex,
} from "algorithm";
import {
  chargingStations as chargeMapChargingStations,
} from "./chargemap";
import {
  coordsToLatLngs,
} from "./utilities";
import { prune_distance } from "./prune/prune_distance";

import { circleMarker, geoJson, map, tileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";



// Initialize Map

const myMap = map("map").setView([56.511984, 10.067244], 13); // Set initial view

tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(myMap);

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

async function experiment(chargingStations: ChargingStation[]) {

  // vertexToLatLng.set(originVertex, { lat: origin.lat, lng: origin.lng });
  // vertexToLatLng.set(destinationVertex, { lat: destination.lat, lng: destination.lng });


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


  console.log("Running experiment with prune_distance (cache = no), d = ", d)

  routeCache = new Map<string, Edge>();

  await experiment(chargingStations)

  console.log(chargingStations)

  // console.log("Running experiment with prune_distance (cache = yes), d = ", d)

  // await experiment(chargingStations)
}



























