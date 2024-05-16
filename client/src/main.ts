import { geoJson, map, tileLayer, circleMarker } from "leaflet";
import { ChargingStation, chargingStations as allChargingStations } from "./chargemap";
import 'leaflet/dist/leaflet.css';
import './index.css'
import { coordsToLatLngs, decodeOSMGeometry, distancePointToLineSegmentInKM, filterChargingStations, getRouteData } from "./utilities";
import { OSRMResponse } from "./osrm.types";

type Vehicle = {
  stateOfCharge: number;
  chargingCurve: (x: number) => number;
  efficiencyCurve: (x: number) => number;
}

type Connector = (x: number) => number;

const myMap = map("map").setView([56.511984, 10.067244], 13); // Set initial view

tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(myMap);

// If they want 6 digits of precision
const mul = false ? 1e6 : 1e5;

//Gets data for route
const journeyData: OSRMResponse = await getRouteData(57.732561, 10.582929, 55.677060, 12.573666)

let nodes: number[][] = [];
// Loop through each step within each leg and concatenate each geometry to the nodes array
journeyData.routes.forEach(route => {
  nodes = [...nodes, ...decodeOSMGeometry(route.geometry, mul)];
});

//turn this into geojson
const json = {
    type:'FeatureCollection',
    features: [{
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: nodes
    },
    properties: {}
    }]
};

const geojson = geoJson(json as any, { style: function(feature) { 
    return {
    fillColor: feature?.properties.fill,
    color: '#9900CC',
    opacity: 0.75,
    weight: 7,
    };
}});

// Render the geojson
geojson.addTo(myMap);

const vehicle: Vehicle = {
  stateOfCharge: 1,
  chargingCurve(x) {
      return x;
  },
  efficiencyCurve(x) {
    return x * 2;
  },
}

const connectors: Connector[] = []; 

// Using a Subset for dev purposes
const chargingStations = filterChargingStations(allChargingStations);

const closestChargingStations: ChargingStation[][] = []; // How many charging stations to evaluate for each segment (A segment consists of the distance between two nodes)

// Gets the nearest charging stations by projecting to the Edges
let previousNode: number[] | undefined;
const maxRange = 5; // Maximum distance from the line segment in km
nodes.forEach((node, index) => {
    const [lng1, lat1] = node;

    if (previousNode !== undefined && index > 0) {
        const [lng2, lat2] = previousNode;
        const chargingStationsInRange: ChargingStation[] = [];

        chargingStations.forEach((chargingStation) => {
            const dist = distancePointToLineSegmentInKM(chargingStation.lat, chargingStation.lng, lat1, lng1, lat2, lng2);
            if (dist <= maxRange) {
                chargingStationsInRange.push(chargingStation);
            }
        });

        closestChargingStations.push(chargingStationsInRange);
    }

    previousNode = node;
});

chargingStations.forEach((chargingStation) => {
    const { lng, lat } = chargingStation;
    const isMarked = closestChargingStations.flat().includes(chargingStation);

    circleMarker([lat, lng], {
        color: isMarked ? 'red' : 'blue',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: isMarked ? 5 : 1 // radius of the circle in pixels
    }).addTo(myMap).on("click", () => console.log(chargingStation.pool.charging_connectors));
})

myMap.fitBounds(coordsToLatLngs(nodes));

