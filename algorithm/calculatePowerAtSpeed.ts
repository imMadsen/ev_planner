const speedyfactor = 1.0;    // Cannot be zero!

// EV Physical model
const ev_mass = 1785;  // 1715+70
const ev_fronsurfacearea = 2.4384;  // 2.54*0.96, --3.0, 1.791*(1.565-0.15)*0.95
const ev_airdragcoef = 0.28;
const ev_rolldragcoef = 0.01;
const ev_constantpowerintake = 1000;   // 1500;
const ev_propulsioneficiency = 0.7;    // 0.9; --0.9;



function energyPerKilometer(speed: number): number {
    const distance = 1; // 1 kilometer

    let energy = 0.0;

    // kinetic energy difference of vehicle --energyDiff += 0.5 * mass * (v * v - lastV * lastV);
    energy += 0.5 * ev_mass * speed;

    // Energy loss through air resistance
    energy += 0.5 * 1.2466 * ev_fronsurfacearea * ev_airdragcoef * speed * speed * distance;

    // Energy loss through roll resistance
    energy += ev_rolldragcoef * 9.81 * ev_mass * distance;

    // Energy loss through constant loads (assuming 1 second duration)
    const time_s = 3600 / speed; // time to travel 1 km at given speed
    energy += ev_constantpowerintake * time_s;

    // Adjust for propulsion efficiency
    energy /= ev_propulsioneficiency;

    // Convert from [Ws], i.e. [J] to [Wh] (3600s / 1h)
    energy /= 3600;

    return energy;
}

// Example usage
const speed = 100; // Speed in km/h
const energyConsumed = energyPerKilometer(speed);