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

export function decodeOSMGeometry(encoded: string, mul: number) {
  //precision
  const inv = 1.0 / mul;
  const decoded = [];
  const previous = [0, 0];
  let i = 0;
  //for each byte
  while (i < encoded.length) {
    //for each coord (lat, lon)
    const ll = [0, 0];
    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let byte = 0x20;
      //keep decoding bytes until you have this coord
      while (byte >= 0x20) {
        byte = encoded.charCodeAt(i++) - 63;
        ll[j] |= (byte & 0x1f) << shift;
        shift += 5;
      }
      //add previous offset to get final value and remember for next one
      ll[j] = previous[j] + (ll[j] & 1 ? ~(ll[j] >> 1) : ll[j] >> 1);
      previous[j] = ll[j];
    }
    //scale by precision and chop off long coords also flip the positions so
    //its the far more standard lon,lat instead of lat,lon
    decoded.push([ll[1] * inv, ll[0] * inv]);
  }
  //hand back the list of coordinates
  return decoded;
}

export function euclideanDistance(x0: number, y0: number, x1: number, y1: number) {
  return Math.hypot(x1 - x0, y1 - y0);
}

// https://www.webmatematik.dk/lektioner/matematik-b/geometri/distanceformlen
export function distancePointToLineSegment(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number) {
  const dx = lx2 - lx1;
  const dy = ly2 - ly1;
  const l2 = dx * dx + dy * dy; // squared length of the line segment

  if (l2 === 0) {
    // If the line segment has zero length (the start and end points are the same),
    // calculate the distance to one of the endpoints instead.
    return Math.sqrt((x - lx1) * (x - lx1) + (y - ly1) * (y - ly1));
  }

  // Calculate the parameterized position of the projection along the line segment
  const t = Math.max(0, Math.min(1, ((x - lx1) * dx + (y - ly1) * dy) / l2));
  
  // Calculate the coordinates of the projected point
  const px = lx1 + t * dx;
  const py = ly1 + t * dy;

  // Calculate the distance between the original point and the projected point
  const distance = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));

  return distance;
}

export function distancePointToLineSegmentInKM(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number) {
  return distancePointToLineSegment(x, y, lx1, ly1, lx2, ly2) * 113.32;
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

export async function getRouteData(latStart:number, lngStart: number, latEnd:number, lngEnd:number) {
  const coordinates = `${lngStart},${latStart};${lngEnd},${latEnd}`;
  const url = `http://127.0.0.1:5000/route/v1/driving/${coordinates}?exclude=ferry`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data)
    // Check if the route is valid
    if (data.code !== 'Ok') {
      throw new Error(`Error in route response: ${data.message}`);
    }
    return data as OSRMResponse
  } catch (error) {
    throw new Error(`Error fetching the route:${error}`);
  }
}