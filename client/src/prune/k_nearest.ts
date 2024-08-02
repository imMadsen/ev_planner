import { type ChargingStation } from "../chargemap";
import {
  distancePointToLineSegment,
} from "../utilities";

export function k_nearest(chargingStations: ChargingStation[], verticies: number[][], k: number) {
  let prunedChargingStations: ChargingStation[] = [];
  // Using a Subset for dev purposes

  let previousNode: number[] | undefined;
  verticies.forEach((node, index) => {
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

      prunedChargingStations = [...prunedChargingStations, ...closestStationsForSegment];
    }

    previousNode = node;
  });

  return prunedChargingStations;
}

