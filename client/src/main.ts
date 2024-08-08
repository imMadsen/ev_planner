import {
  chargeMapChargingStations,
} from "data";
import {
  coordsToLatLngs,
} from "./utilities";
import { circleMarker, geoJson, map, tileLayer, GeoJSON, CircleMarker, circle } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";

const myMap = map("map").setView([56.511984, 10.067244], 13); // Set initial view

tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(myMap);

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

const next_btn = document.querySelector("#next-btn")! as HTMLButtonElement;

const origin = [56.531221, 8.306049]
const destination = [55.485505, 8.505668]

let circle_markers: CircleMarker<any>[] = []
let geojson: GeoJSON<any, any> | undefined; 

const parameters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

let i = 0;
next_btn.addEventListener("click", async () => {
  const parameter = parameters[i];

  if (!parameter) return console.error("No more parameters to be checked!");
  

  if (geojson) geojson.remove(); 
  circle_markers.forEach((circle_markers) => circle_markers.remove())

  const start_time = new Date().getTime();
  console.log("Started experiment! Parameter is", parameter)

  const response = await fetch(`http://localhost:3000?olat=${origin[0]}&olng=${origin[1]}&dlat=${destination[0]}&dlng=${destination[1]}&parameter=${parameter}`);

  
  const data = await response.json() as {
    ordered_vertices: string[],
    vertices: number[][],
    charging_stations_count: number,
    total_visits: number
  };
    
  const { vertices, ordered_vertices, total_visits, charging_stations_count } = data;
  
  const end_time = new Date().getTime();
  console.log("Experiment finished duration was ", end_time - start_time, ", parameter was", parameter, ", charging_station_count was", charging_stations_count,  ", total_visits was ", total_visits)

  // Draw Route
  const json = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: vertices,
        },
        properties: {},
      },
    ],
  };

  geojson = geoJson(json as any, {
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

  circle_markers = chargeMapChargingStations.filter(chargingStation => ordered_vertices.includes(chargingStation.pool.id.toString())).map(({ lat, lng }) => {
    const circle_marker = circleMarker([lat, lng], {
      color: "blue",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 3
    })

    circle_marker.addTo(myMap);

    return circle_marker
  })

  myMap.fitBounds(coordsToLatLngs(vertices));

  i++;
})
