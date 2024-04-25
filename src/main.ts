import { geoJson, map, tileLayer, circleMarker } from "leaflet";
import { ChargingStation, chargingStations as allChargingStations } from "./chargemap";
import 'leaflet/dist/leaflet.css';
import './index.css'
import { coordsToLatLngs, decodeOSMGeometry, distancePointToLineSegment } from "./utilities";

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
const nodes = decodeOSMGeometry("y}c{Igqs{@fgY`gRzkOxpU|uLbeDtd[q`HvpPgji@`~JicEl}MejWz`\\q~@lqLzaNnzJ`cA`fLzv\\`_Z~sMpg]|yk@p{LtbDveNc`E~}Pv|^r_YyyDdd]jhN`|XdArnBjxG", mul);

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

// Using a Subset for dev purposes
const chargingStations = allChargingStations.slice(0);

const closestChargingStations: ChargingStation[][] = []; // How many charging stations to evaluate for each segment (A segment consists of the distance between two nodes)
const k = 5; // For example, set k to 3 for evaluating the 3 closest charging stations for each segment

// Gets the nearest charging stations by projecting to the Edges
let previousNode: number[] | undefined;
nodes.forEach((node, index) => {
  const [lng1, lat1] = node;
  if (previousNode !== undefined && index > 0) {
    const [lng2, lat2] = previousNode;
    const nearestChargingStations: { distance: number, chargingStation: ChargingStation }[] = [];

    chargingStations.forEach((chargingStation) => {
      const dist = distancePointToLineSegment(chargingStation.lat, chargingStation.lng, lat1, lng1, lat2, lng2);
      nearestChargingStations.push({ distance: dist, chargingStation });
    });

    // Sort the nearest charging stations by distance
    nearestChargingStations.sort((a, b) => a.distance - b.distance);

    // Get the first k closest charging stations
    const closestStationsForSegment = nearestChargingStations.slice(0, k).map(entry => entry.chargingStation);

    closestChargingStations.push(closestStationsForSegment);
  }

  previousNode = node;
});

// Gets the nearest charging stations based on Nodes Distance
// mainPath.forEach((pathCoordinate) => {
//   const [lng, lat] = pathCoordinate;
  
//   const shortestDistance: { distance: number, chargingStation: ChargingStation | null } = { distance: Number.MAX_SAFE_INTEGER, chargingStation: null }
//   chargingStations.forEach((chargingStation) => {
//     const dist = euclideanDistance(lng, lat, chargingStation.lng, chargingStation.lat);
//     if (dist < shortestDistance.distance) {
//       shortestDistance.distance = dist;
//       shortestDistance.chargingStation = chargingStation;
//     }
//   })

//   if (shortestDistance.chargingStation)
//     closestChargingStations.push(shortestDistance.chargingStation)
// })


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

