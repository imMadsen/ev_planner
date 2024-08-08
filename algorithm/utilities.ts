import type { Vehicle, Vertex } from ".";

export function findXForArea(
  points: [number, number][],
  start: number,
  targetSum: number
) {
  let sum = 0;

  for (let i = 1; i <= points.length - 1; i++) {
    if (start < points[i][0]) {
      const l1_x = Math.max(start, points[i - 1][0]);
      const l2_x = points[i][0];

      const delta =
        (points[i - 1][1] - points[i][1]) / (points[i - 1][0] - points[i][0]);
      const b_1 = points[i - 1][1] + (l1_x - points[i - 1][0]) * delta;
      const b_2 = points[i - 1][1] + (l2_x - points[i - 1][0]) * delta;

      const h = l2_x - l1_x;

      sum += h * ((b_1 + b_2) / 2 / 3600); // Convert from Ws to Wh

      if (targetSum < sum) return l1_x;
    }
  }

  return;
}

export function findDynamicXForArea(
  points: [number, number][],
  start: number,
  targetSum: number,
  vehicle: Vehicle,
  vertex: Vertex
) {
  let sum = 0;
  let SoC = vertex.battery_state_wh!;
  let increments = 1;
  let iterations = 0;

  for (let i = 1; i <= points.length - 1; i += increments) {
    if (start < points[i][0]) {
      let batteryPercentage = Math.floor(Math.min(SoC, vehicle.model.battery_capacity_wh)* 100 / vehicle.model.battery_capacity_wh )

      let xPoint = i - increments >= 0 ? i - increments : 0;
      const l1_x = Math.max(start, points[xPoint][0]);
      const l2_x = points[i][0];

      const delta =
        (points[xPoint][1] - points[i][1]) / (points[xPoint][0] - points[i][0]);
      let b_1 = points[i - 1][1] + (l1_x - points[i - 1][0]) * delta;

      b_1 = Math.min(b_1, vehicle.model.charging_curve_kw[batteryPercentage][1] * 1000)

      let b_2 = points[xPoint][1] + (l2_x - points[xPoint][0]) * delta;
      b_2 = Math.min(b_2, vehicle.model.charging_curve_kw[batteryPercentage][1] * 1000)


      const h = l2_x - l1_x;

      sum += h * ((b_1 + b_2) / 2 / 3600); // Convert from Ws to Wh
      if (targetSum < sum) return l1_x;
      iterations += 1;
    }
  }

  return;
}