// Spoilage Model based on Arrhenius equation
export const calculateSpoilage = (actualTemp, idealTemp, actualHumidity, idealHumidity) => {
  const alpha = 1.0;
  const beta = 0.5; // temperature sensitivity
  const gamma = 0.1; // humidity sensitivity

  const tempDeviation = Math.max(0, actualTemp - idealTemp);
  const humidityDeviation = Math.max(0, actualHumidity - idealHumidity);

  // Spoilage increases exponentially with temperature deviation, linearly with humidity
  const spoilage = alpha * Math.exp(beta * tempDeviation) + gamma * humidityDeviation;
  return spoilage;
};

// Energy Consumption Model
export const calculateEnergy = (actualTemp, ambientTemp, actualHumidity, idealHumidity) => {
  const k1 = 12.5; // cooling load factor
  const k2 = 3.0; // humidity control factor

  const humidityDeviation = Math.abs(actualHumidity - idealHumidity);

  const energy = k1 * Math.abs(ambientTemp - actualTemp) + k2 * humidityDeviation;
  return energy;
};
