"use client";

import { useEffect, useMemo, useState } from "react";
import SensorTable from "@/components/SensorTable";
import { hydrateSensorsFromInventory, initializeInventoryFromDataset } from "@/utils/datasetClient";
import { SENSOR_STORAGE_KEY } from "@/utils/supplyLogic";

export default function AnalyticsPage() {
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    async function loadSensors() {
      const inventory = await initializeInventoryFromDataset();
      const computedSensors = hydrateSensorsFromInventory(inventory);
      setSensors(computedSensors);
      localStorage.setItem(SENSOR_STORAGE_KEY, JSON.stringify(computedSensors));
    }

    loadSensors();
  }, []);

  const criticalCount = useMemo(
    () => sensors.filter((sensor) => sensor.outOfRange).length,
    [sensors]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Live sensor feed for temperature, pressure and humidity tracking.
        </p>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
          criticalCount
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-yellow-200 bg-yellow-50 text-yellow-700"
        }`}
      >
        {criticalCount
          ? `${criticalCount} sensor(s) are out of temperature range. Critical alert active.`
          : "No critical sensor alerts. All monitored temperatures are in range."}
      </div>

      <SensorTable sensors={sensors} />
    </div>
  );
}
