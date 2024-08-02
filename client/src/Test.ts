// // Constants
// const P_A = 4; // kW (charging station A power)
// const P_B = 50;  // kW (charging station B power)
// const energy_per_km = 250 / 1000; // kWh/km
// const distance = 100; // km
// const E_travel = energy_per_km * distance; // kWh
// const battery_capacity = 100; // kWh (assumed battery capacity)

// // Numerical integration using the trapezoidal rule
// function integrate(f: (x: number) => number, a: number, b: number, n = 1000): number {
//     const h = (b - a) / n;
//     let sum = 0.5 * (f(a) + f(b));
//     for (let i = 1; i < n; i++) {
//         sum += f(a + i * h);
//     }
//     return sum * h;
// }

// // Charging time at station A
// function time_at_A(x: number): number {
//     return integrate(y => battery_capacity / ((1 - y / 100) * P_A), 0, x);
// }

// // Charging time at station B
// function time_at_B(x: number): number {
//     const required_percentage = (E_travel / battery_capacity) * 100;
//     const end_percentage = Math.min(x + required_percentage, 100);
//     return integrate(y => battery_capacity / ((1 - y / 100) * P_B), x, end_percentage);
// }

// // Total charging time
// function total_charging_time(x: number): number {
//     return time_at_A(x) + time_at_B(x);
// }

// // Nelder-Mead optimization
// function nelderMead(f: (x: number[]) => number, start: number[], options: any) {
//     const { maxIterations = 1000, minErrorDelta = 1e-6, minTolerance = 1e-5 } = options;
//     const alpha = 1;
//     const gamma = 2;
//     const rho = 0.5;
//     const sigma = 0.5;

//     // Initial simplex
//     let simplex = [start, ...start.map((_, i) => start.map((v, j) => (i === j ? v + 1 : v)))];
//     simplex = simplex.map(x => ({ x, fx: f(x) }));
//     simplex.sort((a, b) => a.fx - b.fx);

//     for (let iteration = 0; iteration < maxIterations; iteration++) {
//         // Centroid of all but the worst point
//         const centroid = simplex.slice(0, -1).reduce((acc, val) => acc.map((v, i) => v + val.x[i]), Array(start.length).fill(0)).map(v => v / start.length);

//         // Reflection
//         const xr = centroid.map((v, i) => v + alpha * (v - simplex[simplex.length - 1].x[i]));
//         const fxr = f(xr);
//         if (fxr < simplex[0].fx) {
//             // Expansion
//             const xe = centroid.map((v, i) => v + gamma * (xr[i] - v));
//             const fxe = f(xe);
//             if (fxr < fxe) {
//                 simplex[simplex.length - 1] = { x: xr, fx: fxr };
//             } else {
//                 simplex[simplex.length - 1] = { x: xe, fx: fxe };
//             }
//         } else if (fxr < simplex[simplex.length - 2].fx) {
//             simplex[simplex.length - 1] = { x: xr, fx: fxr };
//         } else {
//             // Contraction
//             const xc = centroid.map((v, i) => v + rho * (simplex[simplex.length - 1].x[i] - v));
//             const fxc = f(xc);
//             if (fxc < simplex[simplex.length - 1].fx) {
//                 simplex[simplex.length - 1] = { x: xc, fx: fxc };
//             } else {
//                 // Shrink
//                 for (let i = 1; i < simplex.length; i++) {
//                     simplex[i].x = simplex[0].x.map((v, j) => v + sigma * (simplex[i].x[j] - v));
//                     simplex[i].fx = f(simplex[i].x);
//                 }
//             }
//         }

//         simplex.sort((a, b) => a.fx - b.fx);

//         if (Math.abs(simplex[0].fx - simplex[simplex.length - 1].fx) < minErrorDelta) break;

//         const maxDistance = Math.max(...simplex.slice(1).map(s => Math.sqrt(s.x.reduce((acc, v, i) => acc + (v - simplex[0].x[i]) ** 2, 0))));
//         if (maxDistance < minTolerance) break;
//     }

//     return simplex[0];
// }

// // Optimize the total charging time using Nelder-Mead
// function optimizeCharging(): number {
//     const result = nelderMead(
//         x => total_charging_time(x),
//         [50],
//         { maxIterations: 1000, minErrorDelta: 1e-6, minTolerance: 1e-5 }
//     );

//     return result.x[0];
// }

// // const optimal_x = optimizeCharging();
// // console.log(`Optimal charging percentage at station A: ${optimal_x.toFixed(2)}%`);