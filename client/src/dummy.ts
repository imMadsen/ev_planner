import { Connector } from "algorithm";
import { createDummyConnector } from "algorithm/dummy";
import { ChargingConnector } from "./chargemap";

export function createDummyChargeMapConnectors(connectors: ChargingConnector[]): Connector[] {
    return connectors.map(connector => ({ expectedOutput: createDummyConnector(connector.power_max) } as Connector))
}