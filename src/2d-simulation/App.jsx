 "use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { calculateSpoilage, calculateEnergy } from './MathModels';
import { createWarehouseGrid, calculateMultiStopPath } from './Pathfinder';
import { Activity, Thermometer, Droplet, Box, Navigation, Leaf } from 'lucide-react';

const ROWS = 22;
const COLS = 26;
// Aisles for Entrance and Dropoff
const ENTRANCE = { row: 20, col: 1 };
const DROP_OFF = { row: 20, col: 24 };

function App() {
  const { grid, racks: initialRacks } = useMemo(() => createWarehouseGrid(ROWS, COLS), []);

  const [ambientTemp, setAmbientTemp] = useState(25);
  const [selectedRacks, setSelectedRacks] = useState([]);
  const [path, setPath] = useState([]);
  const [vehiclePos, setVehiclePos] = useState(null);
  const animationRef = useRef(null);
  
  // Base offset controls
  const [globalTempOffset, setGlobalTempOffset] = useState(0);
  const [globalHumidityOffset, setGlobalHumidityOffset] = useState(0);
  const [categoryOffsets, setCategoryOffsets] = useState({
    'frozen': { temp: 0, humidity: 0 },
    'cold-chain': { temp: 0, humidity: 0 },
    'room-temp': { temp: 0, humidity: 0 }
  });

  const [racks, setRacks] = useState(initialRacks);

  // Update racks with deviations
  useEffect(() => {
    setRacks(prev => initialRacks.map(rack => {
      const catOffset = categoryOffsets[rack.category] || { temp: 0, humidity: 0 };
      const actualTemp = rack.idealTemp + globalTempOffset + catOffset.temp;
      const actualHumidity = rack.idealHumidity + globalHumidityOffset + catOffset.humidity;
      const spoilage = calculateSpoilage(actualTemp, rack.idealTemp, actualHumidity, rack.idealHumidity);
      const energy = calculateEnergy(actualTemp, ambientTemp, actualHumidity, rack.idealHumidity);
      
      let status = 'good';
      if (spoilage > 15) status = 'critical';
      else if (spoilage > 5) status = 'warning';

      return {
        ...rack,
        actualTemp,
        actualHumidity,
        spoilage,
        energy,
        status
      };
    }));
  }, [globalTempOffset, globalHumidityOffset, ambientTemp, categoryOffsets, initialRacks]);

  const totalEnergy = racks.reduce((sum, rack) => sum + rack.energy, 0);
  const avgSpoilage = racks.reduce((sum, rack) => sum + rack.spoilage, 0) / racks.length;

  const getCategoryStats = (categoryName) => {
    const cats = racks.filter(r => r.category === categoryName);
    if(cats.length === 0) return { spoilage: 0, energy: 0 };
    const energy = cats.reduce((sum, r) => sum + r.energy, 0);
    const spoilage = cats.reduce((sum, r) => sum + r.spoilage, 0) / cats.length;
    return { spoilage, energy };
  };

  const frozenStats = getCategoryStats('frozen');
  const coldChainStats = getCategoryStats('cold-chain');
  const roomTempStats = getCategoryStats('room-temp');

  const toggleRackSelection = (rack) => {
    setSelectedRacks(prev => {
      const isSelected = prev.find(r => r.id === rack.id);
      if (isSelected) {
          const next = prev.filter(r => r.id !== rack.id);
          if (next.length === 0) {
            setPath([]);
            setVehiclePos(null);
            if (animationRef.current) clearInterval(animationRef.current);
          }
          return next;
      }
      return [...prev, rack];
    });
  };

  const handleRackClick = (rack) => {
    toggleRackSelection(rack);
  };

  const calculateRoute = () => {
    if (selectedRacks.length === 0) return;
    const computedPath = calculateMultiStopPath(grid, ENTRANCE, selectedRacks, DROP_OFF);
    setPath(computedPath);
    
    if (animationRef.current) clearInterval(animationRef.current);

    if (computedPath && computedPath.length > 0) {
      setVehiclePos(computedPath[0]);
      let step = 0;
      animationRef.current = setInterval(() => {
        step++;
        if (step < computedPath.length) {
          setVehiclePos(computedPath[step]);
        } else {
          clearInterval(animationRef.current);
        }
      }, 300);
    }
  };

  const clearRoute = () => {
    setSelectedRacks([]);
    setPath([]);
    setVehiclePos(null);
    if (animationRef.current) clearInterval(animationRef.current);
  };

  const isPathCell = (r, c) => path.find(p => p.row === r && p.col === c);

  const frozenRackRep = racks.find(r => r.category === 'frozen');
  const coldChainRackRep = racks.find(r => r.category === 'cold-chain');
  const roomTempRackRep = racks.find(r => r.category === 'room-temp');

  return (
    <div className="simulation-2d-app">
      <div className="dashboard">
      <header className="header">
        <div className="logo"><Activity color="#00e5ff" /> Smart PharmaWarehouse</div>
        <div className="metrics-summary">
          <div className={`metric-badge ${avgSpoilage > 5 ? 'critical' : 'good'}`}>
            <Box size={16} /> Avg Spoilage Risk: {avgSpoilage.toFixed(2)}
          </div>
          <div className="metric-badge warning">
            <Leaf size={16} /> Est. Energy Load: {totalEnergy.toFixed(0)} W
          </div>
        </div>
      </header>
      
      <div className="main-content">
        <div className="warehouse-container">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
            <h2>Virtual Layout Map</h2>
            <div className="live-sensor-readings">
              <div className="sensor-card frozen">
                <h5>Frozen Zone</h5>
                <div className="sensor-value"><Thermometer size={14}/> {frozenRackRep?.actualTemp}°C</div>
                <div className="sensor-value"><Droplet size={14}/> {frozenRackRep?.actualHumidity}%</div>
              </div>
              <div className="sensor-card cold-chain">
                <h5>Cold Chain Zone</h5>
                <div className="sensor-value"><Thermometer size={14}/> {coldChainRackRep?.actualTemp}°C</div>
                <div className="sensor-value"><Droplet size={14}/> {coldChainRackRep?.actualHumidity}%</div>
              </div>
              <div className="sensor-card room-temp">
                <h5>Room Temp Zone</h5>
                <div className="sensor-value"><Thermometer size={14}/> {roomTempRackRep?.actualTemp}°C</div>
                <div className="sensor-value"><Droplet size={14}/> {roomTempRackRep?.actualHumidity}%</div>
              </div>
            </div>
          </div>
          <div className="grid" style={{
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gridTemplateColumns: `repeat(${COLS}, 1fr)`
          }}>
            {grid.map((rowArr, r) => 
              rowArr.map((cell, c) => {
                const isEntrance = r === ENTRANCE.row && c === ENTRANCE.col;
                const isDropOff = r === DROP_OFF.row && c === DROP_OFF.col;
                const isPath = isPathCell(r, c);
                const rack = racks.find(rk => rk.row === r && rk.col === c);
                const isSelected = selectedRacks.find(rk => rk.id === rack?.id);

                let cellClass = "grid-cell ";
                if (isEntrance) cellClass += "entrance ";
                else if (isDropOff) cellClass += "dropoff ";
                else if (rack) {
                  cellClass += `rack ${rack.category} status-${rack.status} `;
                  if (isSelected) cellClass += "selected";
                } else if (isPath) {
                  cellClass += "path ";
                }

                return (
                  <div 
                    key={`${r}-${c}`} 
                    className={cellClass}
                    onClick={() => rack && handleRackClick(rack)}
                    title={rack ? `Rack ${rack.id}\nTemp: ${rack.actualTemp}°C\nHumidity: ${rack.actualHumidity}%` : ''}
                  >
                    {isEntrance && "IN"}
                    {isDropOff && "OUT"}
                    {vehiclePos && vehiclePos.row === r && vehiclePos.col === c && (
                      <div className="vehicle">🚛</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="legend">
            <span className="legend-item"><span className="color frozen"></span> Frozen</span>
            <span className="legend-item"><span className="color cold-chain"></span> Cold Chain</span>
            <span className="legend-item"><span className="color room-temp"></span> Room Temp</span>
            <span className="legend-item"><span className="color warning"></span> Warning (Yellow)</span>
            <span className="legend-item"><span className="color critical"></span> Critical (Red)</span>
          </div>
        </div>
        
        <div className="side-panel">
          <div className="panel simulation-panel">
            <h3><Thermometer size={18}/> Environment Simulator</h3>
            <p className="subtitle">Simulate facility HVAC deviations manually.</p>
            
            <div className="simulation-section">
              <h4>Global Controls</h4>
              <div className="slider-group">
                <label>Ambient Day Temperature (°C): {ambientTemp}</label>
                <input type="range" min="10" max="45" value={ambientTemp} onChange={e => setAmbientTemp(Number(e.target.value))} />
              </div>
              <div className="slider-group">
                <label>Global Temp Offset (°C): {globalTempOffset > 0 ? '+'+globalTempOffset : globalTempOffset}</label>
                <input type="range" min="-10" max="25" step="0.5" value={globalTempOffset} onChange={e => setGlobalTempOffset(Number(e.target.value))} />
              </div>
              <div className="slider-group">
                <label>Global Humidity Offset (%): {globalHumidityOffset > 0 ? '+'+globalHumidityOffset : globalHumidityOffset}</label>
                <input type="range" min="-20" max="30" value={globalHumidityOffset} onChange={e => setGlobalHumidityOffset(Number(e.target.value))} />
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '10px'}}>
                <span>Global Spoilage: <strong style={{color: avgSpoilage > 5 ? '#ff3b30': '#34c759'}}>{avgSpoilage.toFixed(2)}</strong></span>
                <span>Total Energy: <strong>{totalEnergy.toFixed(0)} W</strong></span>
              </div>
            </div>

            {[
              { id: 'frozen', name: 'Frozen Racks (-20°C)', stats: frozenStats },
              { id: 'cold-chain', name: 'Cold Chain Racks (5°C)', stats: coldChainStats },
              { id: 'room-temp', name: 'Room Temp Racks (20°C)', stats: roomTempStats }
            ].map(cat => (
              <div key={cat.id} className="simulation-section">
                <h4>{cat.name}</h4>
                <div className="slider-group">
                  <label>Rack Temp Offset (°C): {categoryOffsets[cat.id].temp}</label>
                  <input type="range" min="-10" max="25" step="0.5" 
                    value={categoryOffsets[cat.id].temp} 
                    onChange={e => setCategoryOffsets({...categoryOffsets, [cat.id]: { ...categoryOffsets[cat.id], temp: Number(e.target.value) }})} 
                  />
                </div>
                <div className="slider-group">
                  <label>Rack Humidity Offset (%): {categoryOffsets[cat.id].humidity}</label>
                  <input type="range" min="-20" max="30" 
                    value={categoryOffsets[cat.id].humidity} 
                    onChange={e => setCategoryOffsets({...categoryOffsets, [cat.id]: { ...categoryOffsets[cat.id], humidity: Number(e.target.value) }})} 
                  />
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem'}}>
                  <span>Category Spoilage: <strong style={{color: cat.stats.spoilage > 5 ? '#ff3b30': '#34c759'}}>{cat.stats.spoilage.toFixed(2)}</strong></span>
                  <span>Category Energy: <strong>{cat.stats.energy.toFixed(0)} W</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel routing-panel">
            <h3><Navigation size={18}/> Intelligent Routing</h3>
            <p className="subtitle">Select racks on the map to pick medicines.</p>
            <p>Selected racks: <strong>{selectedRacks.length}</strong></p>
            
            <div className="button-group">
              <button className="btn primary" onClick={calculateRoute} disabled={selectedRacks.length === 0}>Calculate Route</button>
              <button className="btn secondary" onClick={clearRoute} disabled={selectedRacks.length === 0}>Clear Route</button>
            </div>

            {path.length > 0 && (
              <div className="route-results">
                <p>Path calculated using Dijkstra's Algorithm.</p>
                <p>Total distance: <strong>{path.length} steps</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;
