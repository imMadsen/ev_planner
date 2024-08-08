import { LatLng, LatLngTuple } from "leaflet";

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