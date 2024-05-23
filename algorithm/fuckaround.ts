import { myAlgorithm } from ".";
import type { Vertex, Edge, VehicleModel, Connector } from ".";
import type { BidirectionalMap } from "./BidirectionalMap";
import { chargingStations as chargeMapChargingStations } from "./chargemap";
import { coordsToLatLngs, decodeOSMGeometry } from "./utilities";


async function getShortestPath (origin: Vertex, destination: Vertex) {

}

function getEnergyConsumptionOfTraversel (vehicle: VehicleModel, edges: Edge[]) {

}

function timeToTraverse (edges: Edge[]) {

}

function timeToCharge (vehicle: VehicleModel, connector: Connector, startCapacity: number, endCapacity: number) {

}
