import type { Edge, Graph, Vertex } from "algorithm";
import { type ChargingStation, chargeMapChargingStations } from "data";
import {
  distance_point_to_line_segment,
} from "../utilities/distance_point_to_line_segment";
import { get_route_data } from "../utilities/get_route_data";
import { vertexToLatLng, createGenericConnector } from "..";
import { decode_osm } from "../utilities/decode_osm";

export async function new_k_nearest(originVertex: Vertex, destinationVertex: Vertex, k: number) {
  let prunedChargingStations: ChargingStation[] = [];

  let mainpath_vertices: number[][] = []

  const originVertexLatLng = vertexToLatLng.get(originVertex)!
  const destinationVertexLatLng = vertexToLatLng.get(destinationVertex)!

  const data = await get_route_data(
    originVertexLatLng.lat,
    originVertexLatLng.lng,
    destinationVertexLatLng.lat,
    destinationVertexLatLng.lng
  );

  // If they want 6 digits of precision
  const mul = false ? 1e6 : 1e5;

  data.routes.forEach((route) => {
    mainpath_vertices = [...mainpath_vertices, ...decode_osm(route.geometry, mul)];
  });

  // Get the k-nearest to the line segment
  let previous_mainpath_vertex: number[] | undefined;
  let previousNode: number[] | undefined;
  mainpath_vertices.forEach((vertex, index) => {
    const [lng1, lat1] = vertex;
    if (previousNode !== undefined && index > 0) {
      const [lng2, lat2] = previousNode;
      const nearestChargingStations: { distance: number, chargingStation: ChargingStation }[] = [];

      chargeMapChargingStations.forEach((chargingStation) => {
        const dist = distance_point_to_line_segment(chargingStation.lat, chargingStation.lng, lat1, lng1, lat2, lng2);
        nearestChargingStations.push({ distance: dist, chargingStation });
      });

      // Sort the nearest charging stations by distance
      nearestChargingStations.sort((a, b) => a.distance - b.distance);

      // Get the first k closest charging stations
      const closestStationsForSegment = nearestChargingStations.slice(0, k).map(entry => entry.chargingStation);

      prunedChargingStations = [...prunedChargingStations, ...closestStationsForSegment];
    }

    previous_mainpath_vertex = vertex;
  });


  // Map the Pruned ChargeMap Charging Stations to Algorithm ChargingStation Interface
  const mappedChargingStations = prunedChargingStations.map(
    (chargingStation, i) => {
      const vertex = {
        id: chargingStation.pool.id.toString(),
        debug_data: {
          amountCharged: 0,
          chargeTime: 0,
          timeOfArrival: Number.MAX_SAFE_INTEGER
        }
      } as Vertex;
      vertexToLatLng.set(vertex, {
        lat: chargingStation.lat,
        lng: chargingStation.lng,
      });

      return {
        connectors: chargingStation.pool.charging_connectors.map((output) => createGenericConnector(output.power_max)),
        vertex: vertex,
      };
    }
  );

  // Create a new Graph that only represents distances between chargingStations, origin & destination
  const _vertices: Vertex[] = [
    originVertex,
    destinationVertex,
    ...mappedChargingStations.map((chargingStation) => {
      chargingStation.vertex.charging_station = chargingStation;
      return chargingStation.vertex;
    }),
  ];

  const edges: Edge[] = [];
  const graph: Graph = {
    vertices: _vertices,
    edges,
  };

  for (const v1 of _vertices)
    for (const v2 of _vertices)
      if (v1 !== v2) {
        edges.push({
          start_vertex: v1,
          end_vertex: v2,
          debug_data: {
            distance: Number.MAX_SAFE_INTEGER,
            speed: Number.MAX_SAFE_INTEGER,
            timeToTraverse: Number.MAX_SAFE_INTEGER,
            energyConsumedOnTraversal: Number.MAX_SAFE_INTEGER,
          },
        });
      }



  return { graph, mainpath_vertices, mappedChargingStations };
}

