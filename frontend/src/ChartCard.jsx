import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';

function ChartCard({ title, sheetName, selectedMonth, monthsList, selectedYear }) {
  const [data, setData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const uniqueId = `chart-${sheetName}-${reloadKey}`;

  const fetchData = () => {
    fetch(`/api/indicator/${sheetName}?year=${selectedYear || 2026}`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error("Error fetching", sheetName, err));
  };

useEffect(() => {
  fetchData();
}, [sheetName, selectedYear]);

  if (!data || !data.datasets) {
    return <div className="chart-card loading">Loading {title}...</div>;
  }

  const labels = data.labels;
  const reel = data.datasets.reel;
  const objectif = data.datasets.objectif;

  const validPoints = labels.map((lbl, i) => ({
    label: lbl, reel: reel[i], objectif: objectif[i],
    hasData: reel[i] !== null || objectif[i] !== null
  }));
  const lastValidIndex = validPoints.reduce((max, p, i) => (p.hasData ? i : max), -1);
  const displayPoints = lastValidIndex >= 0 ? validPoints.slice(0, lastValidIndex + 1) : validPoints;

  const displayLabels = displayPoints.map(p => p.label);
  const displayReel = displayPoints.map(p => p.reel);
  const displayObjectif = displayPoints.map(p => p.objectif);

  let highlightIndex = -1;
  if (selectedMonth && selectedMonth !== 'Tous') {
    highlightIndex = displayLabels.indexOf(selectedMonth);
  }

  const validNumbers = displayReel.filter(v => v !== null && !isNaN(v));
  const meta = {
    TRIR: { emoji: '🚨', accent: '#E31837', subtitle: 'Recordable Incident Rate',
      stat: validNumbers.length ? `MAX: ${Math.max(...validNumbers).toFixed(2)}` : '—' },
    LTIR: { emoji: '⏱️', accent: '#F59E0B', subtitle: 'Lost Time Injury Rate',
      stat: validNumbers.length ? `MAX: ${Math.max(...validNumbers).toFixed(2)}` : '—' },
    Kwh: { emoji: '⚡', accent: '#F97316', subtitle: 'Energy Consumption',
      stat: validNumbers.length ? `AVG: ${(validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length).toFixed(2)}` : '—' },
    m3: { emoji: '💧', accent: '#0284C7', subtitle: 'Water Consumption',
      stat: validNumbers.length ? `AVG: ${(validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length).toFixed(4)}` : '—' },
    Kg: { emoji: '🗑️', accent: '#7C3AED', subtitle: 'Waste Generation',
      stat: validNumbers.length ? `AVG: ${(validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length).toFixed(3)}` : '—' },
    '%': { emoji: '♻️', accent: '#10B981', subtitle: 'Waste Recycling Rate',
      stat: validNumbers.length ? `AVG: ${((validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length) * 100).toFixed(1)}%` : '—' }
  };
  const currentMeta = meta[sheetName] || { emoji: '📊', accent: '#E31837', subtitle: title, stat: '' };

  const chartOptions = {
    chart: {
      id: uniqueId,
      type: sheetName === 'Kwh' ? 'line' : sheetName === 'Kg' || sheetName === '%' ? 'bar' : 'area',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    colors: [currentMeta.accent],
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.05, stops: [0, 95, 100] } },
    markers: { size: 5, hover: { size: 8 }, strokeColors: '#fff', strokeWidth: 2 },
    xaxis: {
      categories: displayLabels,
      labels: { style: { fontSize: '10px', colors: '#9CA3AF' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: '10px', colors: '#9CA3AF' },
        formatter: (val) => {
          if (val === null || isNaN(val)) return '';
          if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(1);
          if (Math.abs(val) > 100) return val.toFixed(0);
          return val.toFixed(2);
        }
      }
    },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '10px' },
    grid: { borderColor: '#F3F4F6', strokeDashArray: 3, padding: { left: 5, right: 5 } },
    tooltip: { theme: 'light' },
    dataLabels: { enabled: false }
  };

  if (sheetName === 'LTIR') {
    chartOptions.chart.type = 'line';
    chartOptions.stroke = { curve: 'stepline', width: 3 };
    chartOptions.colors = ['#F59E0B', '#10B981'];
  } else if (sheetName === 'Kwh') {
    chartOptions.stroke = { width: [0, 3], curve: 'smooth', dashArray: [0, 6] };
    chartOptions.plotOptions = { bar: { columnWidth: '55%', borderRadius: 6, borderRadiusApplication: 'end' } };
    chartOptions.colors = ['#F97316', '#9CA3AF'];
    chartOptions.markers = { size: 0 };
  } else if (sheetName === 'm3') {
    chartOptions.colors = ['#0284C7'];
    chartOptions.stroke = { curve: 'smooth', width: 3.5 };
  } else if (sheetName === 'Kg') {
    chartOptions.chart.type = 'bar';
    chartOptions.colors = ['#7C3AED'];
    chartOptions.plotOptions = { bar: { columnWidth: '50%', borderRadius: 8, borderRadiusApplication: 'end' } };
    chartOptions.markers = { size: 0 };
    chartOptions.fill = { type: 'solid' };
  } else if (sheetName === '%') {
    chartOptions.chart.type = 'bar';
    chartOptions.colors = ['#10B981'];
    chartOptions.plotOptions = { bar: { columnWidth: '50%', borderRadius: 8, borderRadiusApplication: 'end' } };
    chartOptions.markers = { size: 0 };
    chartOptions.fill = { type: 'solid' };
    chartOptions.yaxis = { ...chartOptions.yaxis, min: 0, max: 100,
      labels: { style: { fontSize: '10px', colors: '#9CA3AF' }, formatter: (val) => `${val.toFixed(0)}%` } };
  }

  if (highlightIndex !== -1 && displayReel[highlightIndex] !== null) {
    chartOptions.annotations = {
      points: [{
        x: displayLabels[highlightIndex],
        y: sheetName === '%' ? displayReel[highlightIndex] * 100 : displayReel[highlightIndex],
        marker: { size: 10, fillColor: '#111827', strokeColor: '#fff', strokeWidth: 3, shape: 'circle' }
      }]
    };
  }

  let seriesData;
  if (sheetName === 'LTIR') {
    seriesData = [{ name: 'Réel', data: displayReel }, { name: 'Objectif', data: displayObjectif }];
  } else if (sheetName === 'Kwh') {
    seriesData = [{ name: 'Énergie', type: 'column', data: displayReel }, { name: 'Objectif', type: 'line', data: displayObjectif }];
  } else if (sheetName === '%') {
    seriesData = [{ name: 'Réel (%)', data: displayReel.map(v => (v === null ? 0 : v * 100)) }];
  } else {
    seriesData = [{ name: sheetName, data: displayReel }];
  }

  const handleRefresh = () => {
    setReloadKey(k => k + 1);
    fetchData();
  };

  return (
    <>
      <div className="chart-card" style={{ borderTop: `4px solid ${currentMeta.accent}` }}>
        <div className="chart-card-header">
          <div className="chart-card-title" onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer' }}>
            <span className="chart-emoji animated-pulse">{currentMeta.emoji}</span>
            <div>
              <h4>{title}</h4>
              <span className="chart-subtitle">{currentMeta.subtitle}</span>
            </div>
          </div>
          <div className="chart-actions">
            <span className="chart-stat-badge" style={{ backgroundColor: `${currentMeta.accent}15`, color: currentMeta.accent }}>
              {currentMeta.stat}
            </span>
            <button className="chart-icon-btn" onClick={handleRefresh} title="Refresh">🔄</button>
          </div>
        </div>

        <div style={{ width: '100%', minWidth: 0 }} onClick={() => setIsExpanded(true)}>
          <Chart
            key={uniqueId}
            options={chartOptions}
            series={seriesData}
            type={chartOptions.chart.type}
            height={260}
            width="100%"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="modal-overlay" onClick={() => setIsExpanded(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="chart-emoji" style={{ fontSize: '40px' }}>{currentMeta.emoji}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{currentMeta.subtitle}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsExpanded(false)}>✖ Close</button>
            </div>
            <Chart options={chartOptions} series={seriesData} type={chartOptions.chart.type} height={500} width="100%" />
          </div>
        </div>
      )}
    </>
  );
}

export default ChartCard;