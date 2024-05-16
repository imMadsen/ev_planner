import { ChargingStation, Edge, Vertex, myAlgorithm, type Vehicle } from "algorithm";
import { map, tileLayer } from "leaflet";
import { chargingStations as chargeMapChargingStations } from "./chargemap";
import { coordsToLatLngs, decodeOSMGeometry } from "./utilities";
import 'leaflet/dist/leaflet.css';
import './index.css'
import { OSRMResponse } from "./osrm.types";

const myMap = map("map").setView([56.511984, 10.067244], 13); // Set initial view

tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(myMap);

// If they want 6 digits of precision
const mul = false ? 1e6 : 1e5;
const nodes = decodeOSMGeometry("y}c{Igqs{@fgY`gRzkOxpU|uLbeDtd[q`HvpPgji@`~JicEl}MejWz`\\q~@lqLzaNnzJ`cA`fLzv\\`_Z~sMpg]|yk@p{LtbDveNc`E~}Pv|^r_YyyDdd]jhN`|XdArnBjxG", mul);

// //turn this into geojson
// const json = {
//     type:'FeatureCollection',
//     features: [{
//     type: 'Feature',
//     geometry: {
//         type: 'LineString',
//         coordinates: nodes
//     },
//     properties: {}
//     }]
// };

// const geojson = geoJson(json as any, { style: function(feature) { 
//     return {
//     fillColor: feature?.properties.fill,
//     color: '#9900CC',
//     opacity: 0.75,
//     weight: 7,
//     };
// }});

const vehicle: Vehicle = {
    batteryCapacity: 100,
    batteryState: 10
}

async function getShortestPath(origin: Vertex, destination: Vertex) {
    const lngStart = 1;
    const latStart = 1;

    const lngEnd = 1;
    const latEnd = 1;

    const coordinates = `${lngStart},${latStart};${lngEnd},${latEnd}`;
    const url = `http://127.0.0.1:5000/route/v1/driving/${coordinates}?exclude=ferry`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as OSRMResponse;
      // Check if the route is valid
      if (data.code !== 'Ok') {
        throw new Error(`Error in route response`);
      }

      return []; 
    } catch (error) {
      throw new Error(`Error fetching the route:${error}`);
    }
}

async function getTimeConsumptionOfTraversal(vehicle: Vehicle, path: Edge[]) {
    return 1;
}

const origin = {} as Vertex;
const destination = {} as Vertex;

const chargingStations: ChargingStation[] = chargeMapChargingStations.map(() => ({
    connectors: [],
    vertex: {} as Vertex
}))

myAlgorithm(
    getShortestPath,
    getTimeConsumptionOfTraversal,
    origin,
    destination,
    vehicle,
    chargingStations
)


// chargingStations.forEach((chargingStation) => {
//     const { lng, lat } = chargingStation;
//     const isMarked = false;

//     circleMarker([lat, lng], {
//         color: isMarked ? 'red' : 'blue',
//         fillColor: '#f03',
//         fillOpacity: 0.5,
//         radius: isMarked ? 5 : 1 // radius of the circle in pixels
//     }).addTo(myMap).on("click", () => console.log(chargingStation.pool.charging_connectors));
// })

myMap.fitBounds(coordsToLatLngs(nodes));

