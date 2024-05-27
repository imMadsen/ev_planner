import { findXForArea } from "./utilities";
import type { Connector } from ".";
import {ev_energy} from "../client/src/ev_energy"

// Function to calculate the total time for a given driving speed
function totalTime(drivingSpeed: number, distance: number, connector: Connector, time: number): number {
    const drivingTime = distance / drivingSpeed;
    const energyRequired = ev_energy(drivingSpeed, drivingSpeed, 0, distance, 0);
    const chargingTime = findXForArea(connector.output, 0, energyRequired)!
    return drivingTime + chargingTime;
}

// Function to find the optimal driving speed considering two charging stations
function findOptimalSpeed(distance: number, connectorA: Connector, connectorB: Connector, startTime: number): number {
    // Setting up the precision and the range for the driving speed
    const precision = 0.01;
    let lowSpeed = 0.01;
    let highSpeed = 100;
    let optimalSpeed = lowSpeed;

    while (highSpeed - lowSpeed > precision) {
        const midSpeed1 = lowSpeed + (highSpeed - lowSpeed) / 3;
        const midSpeed2 = highSpeed - (highSpeed - lowSpeed) / 3;

        const timeOneLegOne = totalTime(midSpeed1, distance, connectorA, startTime);
        const timeOneLegTwo = totalTime(midSpeed1, distance, connectorB, startTime + timeOneLegOne);
        const timeOne = timeOneLegOne + timeOneLegTwo;
        const timeTwoLegOne = totalTime(midSpeed2, distance, connectorA, startTime)
        const timeTwoLegTwo =  totalTime(midSpeed2, distance, connectorB, startTime + timeTwoLegOne);
        const timeTwo = timeTwoLegOne + timeTwoLegTwo;

        if (timeOne < timeTwo) {
            highSpeed = midSpeed2;
            optimalSpeed = midSpeed1;
        } else {
            lowSpeed = midSpeed1;
            optimalSpeed = midSpeed2;
        }
    }

    return optimalSpeed;
}

const connectors: Connector[] = [{
        output: new Array(100).fill(null).map((_, i) => ([i, 2]))
    }
  ];

// Variables
const distance = 100; // km
// Find and print the optimal driving speed
const optimalSpeed = findOptimalSpeed(distance, connectors[0], connectors[0], 0);
console.log(`The optimal driving speed is approximately ${optimalSpeed.toFixed(2)} ms/s`);