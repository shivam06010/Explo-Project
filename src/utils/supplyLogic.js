const LOW_STOCK_COLOR = "red";
const WARNING_COLOR = "yellow";
const ADVISORY_COLOR = "blue";
const NORMAL_COLOR = "green";

export const EXPIRY_THRESHOLDS_DAYS = {
  critical: 30,
  warning: 90,
  advisory: 180,
};

export const INVENTORY_STORAGE_KEY = "inventory";
export const SENSOR_STORAGE_KEY = "sensorReadings";
export const SITE_ALERT_STORAGE_KEY = "siteAlertLevel";

export function getDaysToExpiry(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  if (Number.isNaN(expiry.getTime())) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((expiry - today) / msPerDay);
}

export function getExpiryAlertLevel(expiryDate) {
  const daysToExpiry = getDaysToExpiry(expiryDate);
  if (daysToExpiry === null) return { level: "none", daysToExpiry };
  if (daysToExpiry <= EXPIRY_THRESHOLDS_DAYS.critical) return { level: "critical", daysToExpiry };
  if (daysToExpiry <= EXPIRY_THRESHOLDS_DAYS.warning) return { level: "warning", daysToExpiry };
  if (daysToExpiry <= EXPIRY_THRESHOLDS_DAYS.advisory) return { level: "advisory", daysToExpiry };
  return { level: "none", daysToExpiry };
}

export function calculateDemandPerDay(row) {
  const usageKeys = ["Usage_M1", "Usage_M2", "Usage_M3", "Usage_M4", "Usage_M5", "Usage_M6"];
  const total = usageKeys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);
  const averageMonthlyUsage = total / usageKeys.length;
  return averageMonthlyUsage / 30;
}

export function calculateRop(row) {
  const demandPerDay = calculateDemandPerDay(row);
  const leadTime = Number(row.Lead_Time ?? 0);
  return demandPerDay * leadTime;
}

export function calculateSimulatedQuantity(row) {
  const safetyStock = Number(row.Safety_Stock ?? 0);
  const usageM6 = Number(row.Usage_M6 ?? 0);
  const usageM1 = Number(row.Usage_M1 ?? 0);
  return Math.max(0, Math.round(safetyStock + usageM6 * 0.25 - usageM1 * 0.2));
}

export function isExpiringWithinDays(expiryDate, days = 7) {
  if (!expiryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + days);
  const expiry = new Date(expiryDate);
  return expiry >= today && expiry <= cutoff;
}

export function mapDatasetRowToInventoryItem(row, index) {
  const demandPerDay = calculateDemandPerDay(row);
  const rop = calculateRop(row);
  const quantity = calculateSimulatedQuantity(row);
  const lowStock = quantity <= rop;
  const { level: expiryAlertLevel, daysToExpiry } = getExpiryAlertLevel(row.Expiry_Date);
  const expirySoon = expiryAlertLevel !== "none";
  const highRisk = expiryAlertLevel === "critical";

  let alertColor = NORMAL_COLOR;
  if (lowStock) alertColor = LOW_STOCK_COLOR;
  else if (expiryAlertLevel === "critical") alertColor = LOW_STOCK_COLOR;
  else if (expiryAlertLevel === "warning") alertColor = WARNING_COLOR;
  else if (expiryAlertLevel === "advisory") alertColor = ADVISORY_COLOR;

  return {
    id: index + 1,
    name: row.Medicine,
    category: "Medicine",
    batchNumber: row.Batch,
    stock: quantity,
    expiryDate: row.Expiry_Date,
    supplier: row.Supplier,
    leadTime: Number(row.Lead_Time ?? 0),
    demandPerDay: Number(demandPerDay.toFixed(2)),
    rop: Number(rop.toFixed(2)),
    lowStock,
    expirySoon,
    highRisk,
    daysToExpiry,
    expiryAlertLevel,
    alertColor,
    tempMin: Number(row.Temp_Min ?? 0),
    tempMax: Number(row.Temp_Max ?? 0),
  };
}

export function getInventoryAlerts(items) {
  const lowStockAlerts = items
    .filter((item) => item.lowStock)
    .map((item) => ({
      type: "low-stock",
      color: LOW_STOCK_COLOR,
      message: `${item.name} (${item.batchNumber}) is low in stock: ${item.stock} <= ROP ${item.rop}`,
    }));

  const criticalExpiryAlerts = items
    .filter((item) => item.expiryAlertLevel === "critical")
    .sort((a, b) => (a.daysToExpiry ?? Infinity) - (b.daysToExpiry ?? Infinity))
    .map((item) => ({
      type: "expiry-critical",
      color: LOW_STOCK_COLOR,
      message: `${item.name} (${item.batchNumber}) expires in ${item.daysToExpiry} day(s). Immediate reorder review and urgent dispensing prioritization required.`,
    }));

  const warningExpiryAlerts = items
    .filter((item) => item.expiryAlertLevel === "warning")
    .sort((a, b) => (a.daysToExpiry ?? Infinity) - (b.daysToExpiry ?? Infinity))
    .map((item) => {
      const projectedUsage = Math.ceil(Number(item.demandPerDay ?? 0) * Number(item.daysToExpiry ?? 0));
      const projectedShortfall = Math.max(0, projectedUsage - Number(item.stock ?? 0));
      return {
        type: "expiry-warning",
        color: WARNING_COLOR,
        message: `${item.name} (${item.batchNumber}) expires in ${item.daysToExpiry} day(s). Reorder recommendation: projected usage ${projectedUsage}, estimated shortfall ${projectedShortfall}.`,
      };
    });

  const advisoryExpiryAlerts = items
    .filter((item) => item.expiryAlertLevel === "advisory")
    .sort((a, b) => (a.daysToExpiry ?? Infinity) - (b.daysToExpiry ?? Infinity))
    .map((item) => ({
      type: "expiry-advisory",
      color: ADVISORY_COLOR,
      message: `${item.name} (${item.batchNumber}) expires in ${item.daysToExpiry} day(s). Logged for monthly procurement planning.`,
    }));

  const expiryAlerts = items
    .filter((item) => item.expirySoon)
    .sort((a, b) => (a.daysToExpiry ?? Infinity) - (b.daysToExpiry ?? Infinity))
    .map((item) => ({
      type: `expiry-${item.expiryAlertLevel}`,
      color:
        item.expiryAlertLevel === "critical"
          ? LOW_STOCK_COLOR
          : item.expiryAlertLevel === "warning"
            ? WARNING_COLOR
            : ADVISORY_COLOR,
      message: `${item.name} (${item.batchNumber}) expires on ${item.expiryDate}. FEFO: use first.`,
    }));

  return {
    lowStockAlerts,
    expiryAlerts,
    expiryTierAlerts: {
      critical: criticalExpiryAlerts,
      warning: warningExpiryAlerts,
      advisory: advisoryExpiryAlerts,
    },
  };
}

export function buildSensorsFromInventory(items) {
  return items.slice(0, 8).map((item, index) => {
    const midpoint = (item.tempMin + item.tempMax) / 2;
    const delta = (index % 3 === 0 ? 4 : index % 3 === 1 ? -3 : 1);
    const currentTemp = Number((midpoint + delta).toFixed(1));
    const outOfRange = currentTemp < item.tempMin || currentTemp > item.tempMax;

    return {
      id: `S-${100 + index}`,
      medicine: item.name,
      batchNumber: item.batchNumber,
      tempMin: item.tempMin,
      tempMax: item.tempMax,
      temperature: currentTemp,
      pressure: Number((98 + (index % 5) * 2.7).toFixed(1)),
      humidity: Number((50 + (index % 4) * 7.5).toFixed(1)),
      outOfRange,
      alertColor: outOfRange ? LOW_STOCK_COLOR : "green",
    };
  });
}

export function getSiteAlertLevel(sensors) {
  const hasCritical = sensors.some((sensor) => sensor.outOfRange);
  if (hasCritical) return "critical";
  return "normal";
}
