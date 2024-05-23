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

      sum += h * ((b_1 + b_2) / 2);

      if (targetSum < sum) return l1_x;
    }
  }

  return;
}
