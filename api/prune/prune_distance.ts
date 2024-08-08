import { type ChargingStation } from "../chargemap";
import {
  distance_point_to_line_segment_km,
} from "../utilities/distance_point_to_line_segment";

export function prune_distance(chargingStations: ChargingStation[], vertices: number[][], maxRange: number) {
  const prunedChargingStations: ChargingStation[] = [];
  let previousNode: number[] | undefined;

  vertices.forEach((node, index) => {
    const [lng1, lat1] = node;

    if (previousNode !== undefined && index > 0) {
      const [lng2, lat2] = previousNode;
      chargingStations.forEach((chargingStation) => {
        const dist = distance_point_to_line_segment_km(
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

