import React, { useState, useEffect, useRef } from 'react';
import Chart from 'react-apexcharts';
import html2canvas from 'html2canvas';
import InjuryForm from './InjuryForm';
import ImportCSV from './ImportCSV';

const bodyPartEmojis = {
  'Hand': '✋', 'Head': '🧠', 'Feet': '🦶', 'Arm': '💪', 'Leg': '🦵', 'Trunk': '🫀'
};

function Injuries({ selectedYear, selectedMonth, settings }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null); // null | 'project' | 'department' | 'body'
  const captureRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    const url = `/api/injuries/list?year=${selectedYear}&month=${encodeURIComponent(selectedMonth || 'Tous')}`;
    fetch(url)
      .then(res => res.json())
      .then(res => { setData(res.injuries || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedYear, selectedMonth, refreshKey]);

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setExpandedChart(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Aggregate per chart type
  const aggregate = (chartType) => {
    const rows = data.filter(d => d.chart_type === chartType);
    const totals = {};
    rows.forEach(item => { totals[item.category] = (totals[item.category] || 0) + item.value; });
    return totals;
  };

  const projectAgg = aggregate('Project');
  const deptAgg = aggregate('Department');
  const bodyAgg = aggregate('BodyPart');

  const projectCategories = Object.keys(projectAgg);
  const projectValues = Object.values(projectAgg);

  const deptCategories = Object.keys(deptAgg);
  const deptValues = Object.values(deptAgg);

  const bodyCategories = Object.keys(bodyAgg);
  const bodyValues = Object.values(bodyAgg);

  const totalIncidents =
    projectValues.reduce((a, b) => a + b, 0) +
    deptValues.reduce((a, b) => a + b, 0) +
    bodyValues.reduce((a, b) => a + b, 0);

  const bodyTotal = bodyValues.reduce((a, b) => a + b, 0);
  const monthLabel = selectedMonth === 'Tous' ? 'YTD' : selectedMonth;

  // ---- CHART CONFIGS (accept a size for the modal) ----
  const commonChart = (h) => ({
    fontFamily: 'Inter, sans-serif',
    toolbar: { show: false },
    height: h,
    animations: { enabled: true, easing: 'easeinout', speed: 1000 }
  });

  // 1. PROJECT
  const buildProjectOptions = (height = 320) => ({
    chart: { ...commonChart(height), type: 'bar', id: 'proj-chart' },
    colors: ['#E31837'],
    plotOptions: {
      bar: { columnWidth: '55%', borderRadius: 10, borderRadiusApplication: 'end' }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark', type: 'vertical', shadeIntensity: 0.4,
        gradientToColors: ['#F87171'], opacityFrom: 1, opacityTo: 0.9, stops: [0, 100]
      }
    },
    xaxis: {
      categories: projectCategories,
      labels: { style: { fontSize: '10px', colors: '#6B7280', fontWeight: 600 }, rotate: -45, rotateAlways: true }
    },
    yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '10px' } } },
    dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 800, colors: ['#fff'] }, offsetY: -4 },
    grid: { borderColor: '#F3F4F6', strokeDashArray: 3 },
    title: {
      text: `🏭 Incident by Project — ${monthLabel}`,
      align: 'left',
      style: { fontSize: '15px', fontWeight: 800, color: '#111827' }
    },
    tooltip: { theme: 'light' }
  });

  // 2. DEPARTMENT
  const buildDepartmentOptions = (height = 320) => ({
    chart: { ...commonChart(height), type: 'bar', id: 'dept-chart' },
    colors: ['#10B981'],
    plotOptions: {
      bar: { horizontal: true, borderRadius: 8, borderRadiusApplication: 'end', barHeight: '55%' }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark', type: 'horizontal', shadeIntensity: 0.3,
        gradientToColors: ['#34D399'], opacityFrom: 1, opacityTo: 0.9, stops: [0, 100]
      }
    },
    xaxis: { categories: deptCategories, labels: { style: { colors: '#9CA3AF', fontSize: '10px' } } },
    yaxis: { labels: { style: { fontSize: '12px', colors: '#111827', fontWeight: 700 } } },
    dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 800, colors: ['#fff'] }, offsetX: 20 },
    grid: { borderColor: '#F3F4F6', strokeDashArray: 3 },
    title: {
      text: `👥 Incident by Department — ${monthLabel}`,
      align: 'left',
      style: { fontSize: '15px', fontWeight: 800, color: '#111827' }
    },
    tooltip: { theme: 'light' }
  });

  // 3. BODY PART
  const prettyBodyLabels = bodyCategories.map(c => `${bodyPartEmojis[c] || ''} ${c}`.trim());
  const buildBodyPartOptions = (height = 320) => ({
    chart: { ...commonChart(height), type: 'donut', id: 'body-chart' },
    labels: prettyBodyLabels,
    colors: ['#E31837', '#F59E0B', '#10B981', '#0284C7', '#7C3AED', '#84CC16'],
    legend: {
      position: 'bottom', fontSize: '13px', fontWeight: 700,
      markers: { size: 8 }, itemMargin: { horizontal: 8, vertical: 3 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '66%',
          labels: {
            show: true,
            name: { fontSize: '12px', color: '#6B7280', offsetY: -4 },
            value: { fontSize: '28px', fontWeight: 800, color: '#111827', offsetY: 6, formatter: (val) => `${val}` },
            total: { show: true, label: 'Total', fontSize: '13px', color: '#6B7280', formatter: () => `${bodyTotal}` }
          }
        }
      }
    },
    stroke: { width: 3, colors: ['#fff'] },
    dataLabels: {
      enabled: true, formatter: (val) => `${val.toFixed(0)}%`,
      style: { fontSize: '12px', fontWeight: 800, colors: ['#fff'] }
    },
    title: {
      text: `🦴 Injured Body Parts — ${monthLabel}`,
      align: 'left',
      style: { fontSize: '15px', fontWeight: 800, color: '#111827' }
    },
    tooltip: { theme: 'light' }
  });

  // ---- CAPTURE ALL ----
  const captureAll = async () => {
    setCapturing(true);
    try {
      const element = captureRef.current;
      if (!element) throw new Error('No capture area');
      const canvas = await html2canvas(element, {
        backgroundColor: settings.theme === 'dark' ? '#111827' : '#F3F4F6',
        scale: 2, useCORS: true, logging: false
      });
      const link = document.createElement('a');
      link.download = `Injuries_${monthLabel}_${selectedYear}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to capture. Please try again.');
    }
    setCapturing(false);
  };

  // ---- EXPORT CSV ----
  const exportCSV = () => {
    const lines = [`Chart Type,Category,Value`];
    projectCategories.forEach((c) => lines.push(`Project,"${c}",${projectAgg[c]}`));
    deptCategories.forEach((c) => lines.push(`Department,"${c}",${deptAgg[c]}`));
    bodyCategories.forEach((c) => lines.push(`BodyPart,"${c}",${bodyAgg[c]}`));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Injuries_${monthLabel}_${selectedYear}.csv`;
    link.click();
  };

  return (
    <div className="injuries-wrapper">
      {/* HEADER */}
      <div className="injuries-header">
        <div className="injuries-header-left">
          <h1>🩹 First Aid Cases - Injuries</h1>
          <p>
            {settings.plantLocation} • {selectedYear}
            <span className="month-pill" style={{ background: settings.themeColor }}>
              {monthLabel}
            </span>
          </p>
        </div>
        <div className="injuries-header-right">
          <button className="capture-btn" onClick={captureAll} disabled={capturing}>
            {capturing ? '⏳ Capturing...' : '📷 Capture All'}
          </button>
          <button className="injuries-add-btn" onClick={() => setShowForm(true)}>➕ Add Data</button>
          <button className="injuries-export-btn" onClick={() => setShowImport(true)}>📥 Import</button>
          <button className="injuries-export-btn" onClick={exportCSV}>📤 Export</button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="injuries-kpi-row">
        <div className="injury-kpi">
          <span className="injury-kpi-label">Total Incidents</span>
          <span className="injury-kpi-value" style={{ color: settings.themeColor }}>{totalIncidents}</span>
        </div>
        <div className="injury-kpi">
          <span className="injury-kpi-label">Projects affected</span>
          <span className="injury-kpi-value">{projectCategories.length}</span>
        </div>
        <div className="injury-kpi">
          <span className="injury-kpi-label">Departments affected</span>
          <span className="injury-kpi-value">{deptCategories.length}</span>
        </div>
        <div className="injury-kpi">
          <span className="injury-kpi-label">Body parts affected</span>
          <span className="injury-kpi-value">{bodyCategories.length}</span>
        </div>
      </div>

      {/* ALL 3 CHARTS AT ONCE */}
      {loading ? (
        <div className="injuries-loading">Loading injury data...</div>
      ) : (
        <div ref={captureRef} className="injuries-capture-area">
          <div className="injuries-all-charts">

            {/* Chart 1: Project */}
            <div
              className="injury-chart-card clickable"
              style={{ borderTop: '4px solid #E31837' }}
              onClick={() => setExpandedChart('project')}
            >
              {projectCategories.length === 0 ? (
                <div className="injury-chart-empty">No project data for {monthLabel}</div>
              ) : (
                <>
                  <Chart options={buildProjectOptions(320)} series={[{ name: 'Incidents', data: projectValues }]} type="bar" height={320} />
                  <p className="click-hint">Click to expand</p>
                </>
              )}
            </div>

            {/* Chart 2: Department */}
            <div
              className="injury-chart-card clickable"
              style={{ borderTop: '4px solid #10B981' }}
              onClick={() => setExpandedChart('department')}
            >
              {deptCategories.length === 0 ? (
                <div className="injury-chart-empty">No department data for {monthLabel}</div>
              ) : (
                <>
                  <Chart options={buildDepartmentOptions(320)} series={[{ name: 'Incidents', data: deptValues }]} type="bar" height={320} />
                  <p className="click-hint">Click to expand</p>
                </>
              )}
            </div>

            {/* Chart 3: BodyPart */}
            <div
              className="injury-chart-card clickable"
              style={{ borderTop: '4px solid #7C3AED' }}
              onClick={() => setExpandedChart('body')}
            >
              {bodyCategories.length === 0 ? (
                <div className="injury-chart-empty">No body part data for {monthLabel}</div>
              ) : (
                <>
                  <div className="bodypart-compact">
                    <div className="body-silhouette-mini">
                      <svg viewBox="0 0 100 200" width="70" height="140">
                        <circle cx="50" cy="18" r="12" fill="#111827" />
                        <rect x="38" y="32" width="24" height="60" rx="8" fill="#111827" />
                        <rect x="14" y="34" width="12" height="55" rx="6" fill="#111827" />
                        <rect x="74" y="34" width="12" height="55" rx="6" fill="#111827" />
                        <rect x="40" y="92" width="10" height="70" rx="5" fill="#111827" />
                        <rect x="50" y="92" width="10" height="70" rx="5" fill="#111827" />
                        <rect x="35" y="160" width="14" height="12" rx="4" fill="#111827" />
                        <rect x="51" y="160" width="14" height="12" rx="4" fill="#111827" />
                      </svg>
                    </div>
                    <div className="bodypart-donut-mini">
                      <Chart options={buildBodyPartOptions(320)} series={bodyValues} type="donut" height={320} />
                    </div>
                  </div>
                  <p className="click-hint">Click to expand</p>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ---- EXPANDED MODALS ---- */}
      {expandedChart === 'project' && (
        <div className="modal-overlay" onClick={() => setExpandedChart(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="chart-emoji" style={{ fontSize: '40px' }}>🏭</span>
                <div>
                  <h2>Incident by Project</h2>
                  <p>{monthLabel} • {selectedYear}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setExpandedChart(null)}>✖ Close</button>
            </div>
            <Chart options={buildProjectOptions(520)} series={[{ name: 'Incidents', data: projectValues }]} type="bar" height={520} width="100%" />
          </div>
        </div>
      )}

      {expandedChart === 'department' && (
        <div className="modal-overlay" onClick={() => setExpandedChart(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="chart-emoji" style={{ fontSize: '40px' }}>👥</span>
                <div>
                  <h2>Incident by Department</h2>
                  <p>{monthLabel} • {selectedYear}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setExpandedChart(null)}>✖ Close</button>
            </div>
            <Chart options={buildDepartmentOptions(520)} series={[{ name: 'Incidents', data: deptValues }]} type="bar" height={520} width="100%" />
          </div>
        </div>
      )}

      {expandedChart === 'body' && (
        <div className="modal-overlay" onClick={() => setExpandedChart(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="chart-emoji" style={{ fontSize: '40px' }}>🦴</span>
                <div>
                  <h2>Injured Body Parts</h2>
                  <p>{monthLabel} • {selectedYear}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setExpandedChart(null)}>✖ Close</button>
            </div>
            <div className="bodypart-modal-container">
              <div className="body-silhouette-large">
                <svg viewBox="0 0 100 200" width="180" height="360">
                  <circle cx="50" cy="18" r="12" fill="#111827" />
                  <rect x="38" y="32" width="24" height="60" rx="8" fill="#111827" />
                  <rect x="14" y="34" width="12" height="55" rx="6" fill="#111827" />
                  <rect x="74" y="34" width="12" height="55" rx="6" fill="#111827" />
                  <rect x="40" y="92" width="10" height="70" rx="5" fill="#111827" />
                  <rect x="50" y="92" width="10" height="70" rx="5" fill="#111827" />
                  <rect x="35" y="160" width="14" height="12" rx="4" fill="#111827" />
                  <rect x="51" y="160" width="14" height="12" rx="4" fill="#111827" />
                </svg>
              </div>
              <div className="bodypart-donut-large">
                <Chart options={buildBodyPartOptions(520)} series={bodyValues} type="donut" height={520} width="100%" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <InjuryForm
          year={selectedYear}
          defaultMonth={selectedMonth}
          onClose={() => setShowForm(false)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}

      {showImport && (
        <ImportCSV
          onClose={() => setShowImport(false)}
          onImported={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}

export default Injuries;