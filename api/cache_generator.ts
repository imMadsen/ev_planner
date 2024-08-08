import { chargeMapChargingStations } from "data/chargemap";
import { get_route_data } from "./utilities/get_route_data";
import { appendFile } from "node:fs/promises";

const startIndex = 611690

// await appendFile("distances.ts", "export const distances: Record<string, number> =  {\n");


let i = 0;
for (const chargingStation1 of chargeMapChargingStations)
    for (const chargingStation2 of chargeMapChargingStations) {
        if (i < startIndex) {

            try {
                const data = await get_route_data(
                    chargingStation1.lat,
                    chargingStation1.lng,
                    chargingStation2.lat,
                    chargingStation2.lng
                );

                const distance = data.routes.length > 0
                    ? data.routes[0].distance
                    : Number.MAX_SAFE_INTEGER;

                await appendFile("distances.ts", `"${chargingStation1.pool.id}_${chargingStation2.pool.id}": ${distance},\n`);
                await appendFile("distances.ts", `"${chargingStation2.pool.id}_${chargingStation1.pool.id}": ${distance},\n`);
            } catch (e) {

            }
        };

        i++;
    }

await appendFile("distances.ts", "};");