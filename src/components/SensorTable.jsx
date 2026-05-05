"use client";

export default function SensorTable({ sensors }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-5 py-3.5">Sensor</th>
            <th className="px-5 py-3.5">Medicine</th>
            <th className="px-5 py-3.5">Temperature</th>
            <th className="px-5 py-3.5">Pressure</th>
            <th className="px-5 py-3.5">Humidity</th>
            <th className="px-5 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {sensors.map((sensor) => (
            <tr key={sensor.id} className={sensor.outOfRange ? "bg-red-50/40" : ""}>
              <td className="px-5 py-4 font-mono text-xs text-gray-600">{sensor.id}</td>
              <td className="px-5 py-4">
                <p className="font-medium text-gray-900">{sensor.medicine}</p>
                <p className="text-xs text-gray-500">{sensor.batchNumber}</p>
              </td>
              <td className="px-5 py-4">
                <span className={sensor.outOfRange ? "text-red-700 font-semibold" : "text-gray-700"}>
                  {sensor.temperature} C
                </span>
                <p className="text-xs text-gray-500">
                  Range: {sensor.tempMin} C - {sensor.tempMax} C
                </p>
              </td>
              <td className="px-5 py-4 text-gray-700">{sensor.pressure} kPa</td>
              <td className="px-5 py-4 text-gray-700">{sensor.humidity}%</td>
              <td className="px-5 py-4">
                {sensor.outOfRange ? (
                  <span className="inline-block whitespace-nowrap rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    Critical: Temp Out of Range
                  </span>
                ) : (
                  <span className="inline-block whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    Normal
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
