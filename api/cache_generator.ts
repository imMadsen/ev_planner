import { get_route_data } from "./utilities/get_route_data";
import { appendFile } from "node:fs/promises";
import { prune_distance } from "./prune/prune_distance";
import { chargeMapChargingStations } from "data";
import { decode_osm } from "./utilities/decode_osm";

type LatLng = {
    lat: number;
    lng: number;
};

const stupidCache = new Map<string, number>();

async function createCacheSet(originLat: number, originLng: number, destinationLat: number, destinationLng: number) {
    let verticies: number[][] = [];

    // If they want 6 digits of precision
    const mul = false ? 1e6 : 1e5;

    // Initialize Route
    const data = await get_route_data(
        originLat,
        originLng,
        destinationLat,
        destinationLng
    );

    data.routes.forEach((route) => {
        verticies = [...verticies, ...decode_osm(route.geometry, mul)];
    });

    // Prune the charging stations
    let prunedChargingStations = prune_distance(chargeMapChargingStations, verticies, 11)
    prunedChargingStations = [...new Set(prunedChargingStations)]

    console.log(chargeMapChargingStations.length, prunedChargingStations.length)

    for (const chargingStation1 of prunedChargingStations)
        for (const chargingStation2 of prunedChargingStations) {
            if (!stupidCache.has(`${chargingStation1.pool.id}_${chargingStation2.pool.id}`)) {
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

                    stupidCache.set(`${chargingStation1.pool.id}_${chargingStation2.pool.id}`, distance)!;
                    stupidCache.set(`${chargingStation2.pool.id}_${chargingStation1.pool.id}`, distance)!;
                } catch (e) {

                }
            }
        }
}

await appendFile("distances.ts", `export const distances: Record<string, number> =  {\n`);

await createCacheSet(57.738167, 10.633207, 55.618545, 12.605794);
await createCacheSet(56.531221, 8.306049, 55.485505, 8.505668);
await createCacheSet(56.277915, 8.322469, 56.405929, 10.890853);

await appendFile("distances.ts", "};");