const verticies: Vertex[] = [
    { nickname: "A" },
    { nickname: "B" },
    { nickname: "C" },
  ];
  const edges: Edge[] = [
    {
      startVertex: verticies[0],
      endVertex: verticies[1],
      cost: 1,
    },
    {
      startVertex: verticies[1],
      endVertex: verticies[2],
      cost: 20,
    },
  ];
  
  function getShortestPath(startVertex: Vertex, targetVertex: Vertex): Edge[] {
    // Note: Gider ikke til at implementere <!> Virker kun med linær veje <!>
  
    // Find the edge that has the startNode
    const traversedEdges = [
      edges.find((edge) => edge.startVertex === startVertex)!,
    ];
  
    while (traversedEdges[traversedEdges.length - 1].endVertex !== targetVertex) {
      traversedEdges.push(
        edges.find(
          (edge) =>
            edge.startVertex ===
            traversedEdges[traversedEdges.length - 1].endVertex
        )!
      );
    }
  
    return traversedEdges;
  }
  
  function getEnergyConsumptionOfTraversel(vehicle: Vehicle, path: Edge[]) {
    let accumulated = 0;
    for (const edge of path) {
      accumulated += edge.cost;
    }
  
    return accumulated;
  }
  
  function getTimeConsumptionOfTraversal(vehicle: Vehicle, path: Edge[]) {
    let accumulated = 0;
    for (const edge of path) {
      accumulated += edge.cost;
    }
  
    return accumulated;
  }
  
  function getTimeConsumptionOfCharging(
    vehicle: Vehicle,
    connector: Connector,
    batteryState: number
  ) {
    return 0;
  }
  
  function myAlgorithm(
    vehicle: Vehicle,
    chargingStations: ChargingStation[],
    start: Vertex,
    target: Vertex
  ) {
    function recurse(newStart: Vertex, newChargingStations: ChargingStation[]) {
      const mainPath = getShortestPath(newStart, target);
      const mainPathTime = getTimeConsumptionOfTraversal(vehicle, mainPath);
      const mainPathEnergyUsage = getEnergyConsumptionOfTraversel(
        vehicle,
        mainPath
      );
  
      if (mainPathEnergyUsage <= vehicle.batteryState) {
        return;
      }
  
      let candidateChargingStation: ChargingStation | undefined = undefined;
      let candidateChargingStationX = 0;
  
      for (const chargingStation of newChargingStations) {
        const chargingStationPath = getShortestPath(newStart, target);
        const targetPath = getShortestPath(chargingStation.vertex, target);
  
        if (
          getEnergyConsumptionOfTraversel(vehicle, chargingStationPath) >
          vehicle.batteryCapacity
        )
          return;
  
        const timeConsumptionChargingStation = getTimeConsumptionOfTraversal(
          vehicle,
          chargingStationPath
        );
        const timeConsumptionTarget = getTimeConsumptionOfTraversal(
          vehicle,
          targetPath
        );
  
        let candidateConnector = undefined;
        let candidateConnectorTime = Number.MAX_SAFE_INTEGER;
        for (const connector of chargingStation.connectors) {
          const time = getTimeConsumptionOfCharging(
            vehicle,
            connector,
            vehicle.batteryCapacity
          );
  
          if (time <= candidateConnectorTime) {
            candidateConnector = connector;
            candidateConnectorTime = time;
          }
        }
  
        const batteryDiff = vehicle.batteryCapacity - vehicle.batteryState;
        const x =
          batteryDiff /
          (timeConsumptionChargingStation +
            timeConsumptionTarget -
            mainPathTime +
            candidateConnectorTime);
  
        if (x > candidateChargingStationX) {
          candidateChargingStationX = x;
          candidateChargingStation = chargingStation;
        }
  
        newChargingStations.filter(
          (chargingStation) => candidateChargingStation !== chargingStation
        );
      }
  
      recurse(candidateChargingStation!.vertex, newChargingStations);
    }
  
    recurse(start, chargingStations);
  }
  
  
  // Sandbox
  
  const chargingStations: ChargingStation[] = [
    {
      vertex: verticies[1],
      connectors: [
        {
          expectedOutput: [
            [0, 0],
            [0, 0],
          ],
        },
      ],
    },
  ];
  
  const vehicle: Vehicle = {
    batteryState: 5,
    batteryCapacity: 100,
  };
  
  const start = verticies[0];
  const target = verticies[2];
  
  const path = myAlgorithm(vehicle, chargingStations, start, target);
  