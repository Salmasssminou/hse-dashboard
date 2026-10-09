import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import ChartCard from './ChartCard';
import KpiCard from './KpiCard';
import DataEntryForm from './DataEntryForm';
import Settings from './Settings';
import ActionPlan from './ActionPlan';
import Injuries from './Injuries';
import './App.css';

function App() {
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const dashboardRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('hseSettings');
    return saved ? JSON.parse(saved) : {
      companyName: 'COMPANY', plantLocation: 'Main Plant',
      dashboardTitle: 'HSE Dashboard', themeColor: '#E31837',
      theme: 'light', language: 'en', defaultYear: '2026', defaultPage: 'Dashboard'
    };
  });

  const [selectedYear, setSelectedYear] = useState(settings.defaultYear);
  const [selectedMonth, setSelectedMonth] = useState('Tous');
  const [activePage, setActivePage] = useState(settings.defaultPage);

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('hseSettings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-red', settings.themeColor);
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.themeColor, settings.theme]);

  const indicators = [
    { title: 'TRIR', sheetName: 'TRIR' },
    { title: 'LTIR', sheetName: 'LTIR' },
    { title: 'Energy', sheetName: 'Kwh' },
    { title: 'Water', sheetName: 'm3' },
    { title: 'Waste', sheetName: 'Kg' },
    { title: 'Recycling Rate', sheetName: '%' }
  ];

  const monthsList = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const yearsList = ['2024', '2025', '2026', '2027'];

  const handleDataAdded = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const fetchAllData = async () => {
      const promises = indicators.map(ind =>
        fetch(`/api/indicator/${ind.sheetName}`)
          .then(res => res.json())
          .then(data => ({ [ind.sheetName]: data }))
          .catch(() => ({ [ind.sheetName]: null }))
      );
      const results = await Promise.all(promises);
      setAllData(Object.assign({}, ...results));
      setLoading(false);
    };
    fetchAllData();
  }, [refreshKey]);

  const getFilteredData = (sheetName) => {
    const data = allData[sheetName];
    if (!data || !data.datasets) return null;
    if (selectedMonth === 'Tous') return data.datasets;
    const monthIndex = monthsList.indexOf(selectedMonth);
    if (monthIndex === -1) return data.datasets;
    return {
      reel: [data.datasets.reel[monthIndex]],
      objectif: [data.datasets.objectif[monthIndex]]
    };
  };

  // ---- Capture the entire dashboard as one image ----
  const captureDashboard = async () => {
    setCapturing(true);
    try {
      const element = dashboardRef.current;
      if (!element) throw new Error('Dashboard not found');

      const canvas = await html2canvas(element, {
        backgroundColor: settings.theme === 'dark' ? '#111827' : '#F3F4F6',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const link = document.createElement('a');
      link.download = `HSE_Dashboard_${selectedYear}_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to capture dashboard. Please try again.');
    }
    setCapturing(false);
  };

  const downloadCSV = () => {
    let csv = "Year,Month";
    indicators.forEach(ind => csv += `,${ind.title} (Reel),${ind.title} (Target)`);
    csv += "\n";
    monthsList.forEach((month, idx) => {
      let row = `${selectedYear},${month}`;
      indicators.forEach(ind => {
        const data = allData[ind.sheetName];
        if (data && data.datasets) {
          const r = data.datasets.reel[idx] !== null && data.datasets.reel[idx] !== undefined
            ? Number(data.datasets.reel[idx]).toFixed(4) : "";
          const t = data.datasets.objectif[idx] !== null && data.datasets.objectif[idx] !== undefined
            ? Number(data.datasets.objectif[idx]).toFixed(4) : "";
          row += `,${r},${t}`;
        } else {
          row += ",,";
        }
      });
      csv += row + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `HSE_Report_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="logo">{settings.companyName}</div>
        <div className="nav-links">
          {[
            { id: 'Dashboard', icon: '📊' },
            { id: 'Injuries', icon: '🩹' },
            { id: 'Action Plan', icon: '📋' },
            { id: 'Reports', icon: '📄' },
            { id: 'Settings', icon: '⚙️' }
          ].map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span> {item.id}
            </div>
          ))}
        </div>
      </nav>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="logo-area">
            <h1>{activePage === 'Dashboard' ? settings.dashboardTitle : activePage}</h1>
            <p>{settings.plantLocation} • {selectedYear}</p>
          </div>
          <div className="filters">
            {activePage === 'Dashboard' && (
              <button
                className="capture-btn"
                onClick={captureDashboard}
                disabled={capturing}
              >
                {capturing ? '⏳ Capturing...' : '📷 Capture Dashboard'}
              </button>
            )}
            <button className="add-data-btn" onClick={() => setShowForm(true)}>
              ➕ Manage Data
            </button>
            <div className="filter-group">
              <label>Year:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Month:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="Tous">Tous les mois</option>
                {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </header>

        {activePage === 'Dashboard' && (
          <div ref={dashboardRef} className="dashboard-capture-area">
            {/* 6 KPI CARDS */}
            <div className="kpi-grid">
              {indicators.slice(0, 6).map((ind, index) => {
                const filtered = getFilteredData(ind.sheetName);
                const filterLabel = selectedMonth === 'Tous' ? 'YTD' : selectedMonth;
                return (
                  <KpiCard
                    key={index}
                    title={ind.title}
                    reelData={filtered?.reel}
                    targetData={filtered?.objectif}
                    filterLabel={filterLabel}
                  />
                );
              })}
            </div>

            {/* 6 CHARTS - 3 per row */}
            <div className="charts-grid">
              {indicators.map((ind, index) => (
                <ChartCard
                  key={index}
                  title={ind.title}
                  sheetName={ind.sheetName}
                  selectedMonth={selectedMonth}
                  monthsList={monthsList}
                  selectedYear={parseInt(selectedYear) || 2026}
                />
              ))}
            </div>
          </div>
        )}

        {activePage === 'Injuries' && <Injuries selectedYear={selectedYear} selectedMonth={selectedMonth} settings={settings} />}
        {activePage === 'Action Plan' && <ActionPlan selectedYear={selectedYear} selectedMonth={selectedMonth} settings={settings} />}
        {activePage === 'Reports' && (
          <div className="reports-container">
            <div className="reports-header">
              <h2>Pivot Data Report ({selectedYear})</h2>
              <button className="export-btn" onClick={downloadCSV}>📥 Download Pivot CSV</button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    {indicators.map(ind => <th key={ind.sheetName} colSpan="2">{ind.title}</th>)}
                  </tr>
                  <tr>
                    <th></th>
                    {indicators.map(ind => (
                      <React.Fragment key={`sub-${ind.sheetName}`}>
                        <th>Reel</th>
                        <th>Target</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthsList.map((month, idx) => (
                    <tr key={month}>
                      <td><strong>{month}</strong></td>
                      {indicators.map(ind => {
                        const data = allData[ind.sheetName];
                        const r = data?.datasets?.reel[idx] !== undefined && data.datasets.reel[idx] !== null
                          ? Number(data.datasets.reel[idx]).toFixed(4) : "—";
                        const t = data?.datasets?.objectif[idx] !== undefined && data.datasets.objectif[idx] !== null
                          ? Number(data.datasets.objectif[idx]).toFixed(4) : "—";
                        return (
                          <React.Fragment key={`${ind.sheetName}-${idx}`}>
                            <td>{r}</td>
                            <td>{t}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activePage === 'Settings' && <Settings settings={settings} onSave={handleSettingsSave} />}
      </main>

      {showForm && (
        <DataEntryForm 
        onDataAdded={handleDataAdded} 
        onClose={() => setShowForm(false)} 
        allData={allData} 
        selectedYear={parseInt(selectedYear) || 2026}/>
      )}
    </div>
  );
}

export default App;