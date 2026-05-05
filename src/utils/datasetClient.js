import {
  INVENTORY_STORAGE_KEY,
  SENSOR_STORAGE_KEY,
  SITE_ALERT_STORAGE_KEY,
  buildSensorsFromInventory,
  getSiteAlertLevel,
  mapDatasetRowToInventoryItem,
} from "@/utils/supplyLogic";

export async function fetchDatasetRows() {
  const response = await fetch("/api/dataset", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch dataset rows");
  }
  const data = await response.json();
  return data.rows ?? [];
}

export async function initializeInventoryFromDataset() {
  const rows = await fetchDatasetRows();
  const items = rows.map(mapDatasetRowToInventoryItem);
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  return items;
}

export function hydrateSensorsFromInventory(items) {
  const sensors = buildSensorsFromInventory(items);
  const alertLevel = getSiteAlertLevel(sensors);
  localStorage.setItem(SENSOR_STORAGE_KEY, JSON.stringify(sensors));
  localStorage.setItem(SITE_ALERT_STORAGE_KEY, alertLevel);
  window.dispatchEvent(new Event("site-alert-level-change"));
  return sensors;
}
