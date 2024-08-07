import { LatLng, LatLngTuple } from "leaflet";
import { ChargingStation } from "./chargemap";
import { OSRMResponse } from "./osrm.types";
function coordsToLatLng(coords: number[]) {
	return new LatLng(coords[1], coords[0], coords[2]);
}

export function coordsToLatLngs(coords: number[][], levelsDeep = 0, _coordsToLatLng?: (coords: number[]) => LatLng) {
	const latlngs: LatLngTuple[] = [];

	for (let i = 0, len = coords.length, latlng; i < len; i++) {
		latlng = levelsDeep ?
      // @ts-ignore
			coordsToLatLngs(coords[i], levelsDeep - 1, _coordsToLatLng) :
			(_coordsToLatLng || coordsToLatLng)(coords[i]);

    // @ts-ignore
		latlngs.push(latlng);
	}

	return latlngs;
}

export function euclideanDistance(x0: number, y0: number, x1: number, y1: number) {
  return Math.hypot(x1 - x0, y1 - y0);
}

// Should be used to generate the available outputs for the connectors
export function binarySinusWave(x: number, scale = 1, offset = 0) {
  return Math.abs(Math.round(Math.sin(x * scale + offset)))
}

export function filterChargingStations(stations: ChargingStation[]): ChargingStation[] {
  return stations.filter(station => {
      return station.pool.charging_connectors.every(connector => connector.power_max >= 0);
  });
}