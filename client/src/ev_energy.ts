const speedyfactor = 1.0; // Cannot be zero!

// EV Physical model
const ev_mass = 1785; // 1715+70
const ev_internalmomentofinertia = 0.01;
const ev_fronsurfacearea = 2.4384; // 2.54*0.96, --3.0, 1.791*(1.565-0.15)*0.95
const ev_airdragcoef = 0.28;
const ev_rolldragcoef = 0.01;
const ev_radialdragcoef = 0.3;
const ev_constantpowerintake = 1000; // 1500;
const ev_propulsioneficiency = 0.7; // 0.9; --0.9;
const ev_recuperationeficiency = 0.7; // 0.8;

type Charge = number;
type Speed = number;
type Height = number;
type Distance = number;

export function ev_energy(
    ms: Speed,
    last_ms: Speed,
    delta_h: Height,
    edge_dist: Distance,
    edge_radius: number
): Charge {
    let energy: Charge = 0.0;

    // Calculate time in seconds to traverse the distance
    const time_s: number = edge_dist / ms;

    // calculate potential energy difference
    energy += ev_mass * 9.81 * delta_h;
    // kinetic energy difference of vehicle
    energy += 0.5 * ev_mass * (ms * ms - last_ms * last_ms);
    // add rotational energy diff of internal rotating elements
    energy += ev_internalmomentofinertia * (ms * ms - last_ms * last_ms);
    // Energy loss through Air resistance [Ws]
    energy += 0.5 * 1.2466 * ev_fronsurfacearea * ev_airdragcoef * ms * ms * edge_dist;
    // Energy loss through Roll resistance [Ws]
    energy += ev_rolldragcoef * 9.81 * ev_mass * edge_dist;
    // Energy loss through friction by radial force [Ws]
    if (edge_radius !== 0.0) {
        energy += ev_radialdragcoef * ev_mass * ms * ms / edge_radius;
    }
    // Energy loss through constant loads (e.g. A/C) [Ws]
    energy += ev_constantpowerintake * time_s;

    if (energy > 0) {
        // Assumption: Efficiency of myPropulsionEfficiency when accelerating
        energy /= ev_propulsioneficiency;
    } else {
        // Assumption: Efficiency of myRecuperationEfficiency when recuperating
        energy *= ev_recuperationeficiency;
    }

    // convert from [Ws], i.e. [J] to [Wh] (3600s / 1h)
    energy /= 3600;

    return energy;
}

// Example usage
const ms: Speed = 30; // Example speed in meters per second
const last_ms: Speed = 30; // Example last speed in meters per second
const delta_h: Height = 0; // Example height change in meters
const edge_dist: Distance = 5000; // Example distance in meters
const edge_radius: number = 50; // Example edge radius in meters

const energyConsumed = ev_energy(ms, last_ms, delta_h, edge_dist, edge_radius);