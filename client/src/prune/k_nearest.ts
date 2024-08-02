import { type ChargingStation } from "../chargemap";
import {
  distancePointToLineSegmentInKM,
} from "../utilities";

export function k_nearest(chargingStations: ChargingStation[], verticies: number[][], maxRange: number) {
  const prunedChargingStations: ChargingStation[] = [];
  let previousNode: number[] | undefined;

  verticies.forEach((node, index) => {
    const [lng1, lat1] = node;

    if (previousNode !== undefined && index > 0) {
      const [lng2, lat2] = previousNode;
      chargingStations.forEach((chargingStation) => {
        const dist = distancePointToLineSegmentInKM(
          chargingStation.lat,
          chargingStation.lng,
          lat1,
          lng1,
          lat2,
          lng2
        );

        if (dist <= maxRange) {
          prunedChargingStations.push(chargingStation);
        }
      });
    }

    previousNode = node;
  });

  return prunedChargingStations;
}

