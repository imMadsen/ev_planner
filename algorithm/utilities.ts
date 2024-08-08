import type { Vehicle, Vertex } from ".";

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

      sum += h * ((b_1 + b_2) / 2 / 3600); // Convert from Ws to Wh

      if (targetSum < sum) return l1_x;
    }
  }

  return;
}

export function findDynamicXForArea(
  points: [number, number][],
  start: number,
  targetSum: number,
  vehicle: Vehicle,
  vertex: Vertex
) {
  let sum = 0;
  let SoC = vertex.battery_state_wh!;
  let increments = 1;
  
  for (let i = 1; i <= points.length - 1; i += increments) {
    if (start < points[i][0]) {
      let batteryPercentage = Math.floor(SoC * 100 / vehicle.model.battery_capacity_wh )

      const l1_x = Math.max(start, points[i - increments][0]);
      const l2_x = points[i][0];

      const delta =
        (points[i - increments][1] - points[i][1]) / (points[i - increments][0] - points[i][0]);
      let b_1 = points[i - 1][1] + (l1_x - points[i - 1][0]) * delta;

      b_1 = Math.min(b_1, vehicle.model.charging_curve_kw[batteryPercentage][1] * 1000)

      let b_2 = points[i - increments][1] + (l2_x - points[i - increments][0]) * delta;
      b_2 = Math.min(b_2, vehicle.model.charging_curve_kw[batteryPercentage][1] * 1000)


      const h = l2_x - l1_x;

      sum += h * ((b_1 + b_2) / 2 / 3600); // Convert from Ws to Wh
      if (targetSum < sum) return l1_x;
    }
  }

  return;
}


async function getTimeToChargeAndTraverse(
  vertex: Vertex,
  energyNeeded: number,
  chargingStation: ChargingStation,
  edge: Edge,
  vehicle: Vehicle
) {
  let data: chargeAndTraverseData = {
      traverseTime: Number.MAX_SAFE_INTEGER,
      chargeTime: Number.MAX_SAFE_INTEGER,
      energyCharged: Number.MAX_SAFE_INTEGER,
      chargingFinishedTime: Number.MAX_SAFE_INTEGER
  };

  let connector: Connector | undefined;
  let doneCharging = Number.MAX_SAFE_INTEGER;

  const currentSoCWh = vehicle.batteryState; // Current state of charge in Wh
  const energyNeededWh = energyNeeded * 1000; // Convert kWh to Wh

  for (let _connector of chargingStation.connectors) {
      let _doneCharging = calculateDynamicChargingTime(
          _connector.output_time_kw,
          vertex.time!,
          currentSoCWh,
          energyNeededWh,
          vehicle.model.charging_curve_kw
      );

      if (_doneCharging === undefined) {
          continue;
      }

      if (_doneCharging < doneCharging) {
          doneCharging = _doneCharging;
          connector = _connector;
      }
  }

  // Check if a connector was found, if so use it
  if (connector !== undefined) {
      const traverseTime = await getTimeToTraverse(edge);
      data.traverseTime = traverseTime;
      data.chargeTime = doneCharging - vertex.time!;
      data.chargingFinishedTime = doneCharging;
      data.energyCharged = energyNeeded;
  }

  return data;
}

function calculateDynamicChargingTime(
  outputTimeKw: [number, number][],
  startTime: number,
  currentSoCWh: number,
  energyNeededWh: number,
  chargingCurve: number[][]
): number | undefined {
  let time = startTime;
  let chargedEnergy = 0;

  while (chargedEnergy < energyNeededWh) {
      let socKWh = currentSoCWh / 1000; // Convert Wh to kWh
      let maxChargingPower = getMaxChargingPower(socKWh, chargingCurve); // Get max charging power based on SoC
      if (maxChargingPower === 0) {
          return undefined; // Unable to charge further
      }

      let availablePower = getAvailablePower(time, outputTimeKw);
      if (availablePower === undefined) {
          return undefined; // No more power available
      }

      let effectivePower = Math.min(maxChargingPower, availablePower); // Limit by the lower of vehicle and charger capabilities
      let energyToCharge = Math.min(effectivePower, energyNeededWh - chargedEnergy); // Determine how much energy to charge

      chargedEnergy += energyToCharge;
      time += energyToCharge / effectivePower;
  }

  return time;
}

function getMaxChargingPower(socKWh: number, chargingCurve: number[][]): number {
  for (let i = chargingCurve.length - 1; i >= 0; i--) {
      if (socKWh >= chargingCurve[i][0]) {
          return chargingCurve[i][1];
      }
  }
  return 0; // Default to 0 if SoC is below the lowest point in the curve
}

function getAvailablePower(time: number, outputTimeKw: [number, number][]): number | undefined {
  for (let i = 0; i < outputTimeKw.length; i++) {
      if (outputTimeKw[i][0] >= time) {
          return outputTimeKw[i][1];
      }
  }
  return undefined; // No power available at the specified time
}
