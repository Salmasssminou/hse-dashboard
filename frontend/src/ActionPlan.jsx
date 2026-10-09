import React, { useState, useEffect } from 'react';
import ActionPlanForm from './ActionPlanForm';

function ActionPlan({ selectedYear, selectedMonth, settings }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterIndicator, setFilterIndicator] = useState('Tous');
  const [filterMonth, setFilterMonth] = useState(selectedMonth || 'Tous');
  const [filterYear, setFilterYear] = useState(selectedYear || '2026');

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const years = ['2024', '2025', '2026', '2027', '2028'];
  const indicators = ['TRIR', 'LTIR', 'Kwh', 'm3', 'Kg', '%'];

  const fetchActions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterYear && filterYear !== 'Tous') params.append('year', filterYear);
    if (filterMonth && filterMonth !== 'Tous') params.append('month', filterMonth);
    if (filterIndicator && filterIndicator !== 'Tous') params.append('indicator', filterIndicator);

    fetch(`/api/action_plan/list?${params.toString()}`)
      .then(res => res.json())
      .then(res => { setActions(res.actions || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchActions(); }, [filterYear, filterMonth, filterIndicator, refreshKey]);

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge">—</span>;
    const s = status.toLowerCase();
    if (s.includes('clos') || s.includes('termin')) return <span className="badge badge-success">✅ {status}</span>;
    if (s.includes('retard') || s.includes('late')) return <span className="badge badge-danger">⚠️ {status}</span>;
    if (s.includes('cours') || s.includes('progress')) return <span className="badge badge-warning">⏳ {status}</span>;
    if (s.includes('planifi')) return <span className="badge badge-info">📅 {status}</span>;
    return <span className="badge">{status}</span>;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this action?')) return;
    try {
      const res = await fetch(`/api/action_plan/delete/${id}`, { method: 'DELETE' });
      if (res.ok) setRefreshKey(k => k + 1);
      else alert('Failed to delete');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const exportCSV = () => {
    if (actions.length === 0) return;
    const columns = ['month', 'year', 'indicator', 'cause', 'action_corrective', 'action_preventive', 'responsible', 'deadline', 'status'];
    const headers = ['Month', 'Year', 'Indicator', 'Cause', 'Corrective', 'Preventive', 'Responsible', 'Deadline', 'Status'];
    let csv = headers.join(',') + '\n';
    actions.forEach(a => {
      csv += columns.map(c => `"${String(a[c] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ActionPlan_${filterYear}_${filterMonth}.csv`;
    link.click();
  };

  const totalActions = actions.length;
  const closedCount = actions.filter(a => (a.status || '').toLowerCase().includes('clos') || (a.status || '').toLowerCase().includes('termin')).length;
  const inProgressCount = actions.filter(a => (a.status || '').toLowerCase().includes('cours')).length;
  const lateCount = actions.filter(a => (a.status || '').toLowerCase().includes('retard')).length;

  return (
    <div className="injuries-wrapper">
      <div className="injuries-header">
        <div className="injuries-header-left">
          <h1>📋 Plan d'Actions</h1>
          <p>{settings?.plantLocation || 'Main Plant'} • Corrective & Preventive Actions</p>
        </div>
        <div className="injuries-header-right">
          <button className="injuries-add-btn" onClick={() => { setEditingAction(null); setShowForm(true); }}>
            ➕ Add Action
          </button>
          <button className="injuries-export-btn" onClick={exportCSV} disabled={actions.length === 0}>
            📤 Export CSV
          </button>
        </div>
      </div>

      <div className="injuries-kpi-row">
        <div className="injury-kpi">
          <span className="injury-kpi-label">Total Actions</span>
          <span className="injury-kpi-value" style={{ color: settings?.themeColor || '#E31837' }}>{totalActions}</span>
        </div>
        <div className="injury-kpi">
          <span className="injury-kpi-label">Closed</span>
          <span className="injury-kpi-value" style={{ color: '#10B981' }}>{closedCount}</span>
        </div>
        <div className="injury-kpi">
          <span className="injury-kpi-label">In Progress</span>
          <span className="injury-kpi-value" style={{ color: '#F59E0B' }}>{inProgressCount}</span>
        </div>
        <div className="injury-kpi">
          <span className="injury-kpi-label">Late</span>
          <span className="injury-kpi-value" style={{ color: '#E31837' }}>{lateCount}</span>
        </div>
      </div>

      <div className="action-filters">
        <div className="filter-group">
          <label>Year:</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="Tous">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Month:</label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="Tous">All</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Indicator:</label>
          <select value={filterIndicator} onChange={(e) => setFilterIndicator(e.target.value)}>
            <option value="Tous">All</option>
            {indicators.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="injuries-loading">Loading actions...</div>
      ) : actions.length === 0 ? (
        <div className="injuries-empty">
          <div className="empty-icon">📭</div>
          <p>No action plans yet for <strong>{filterYear} — {filterMonth}</strong>.</p>
          <button className="injuries-add-btn" onClick={() => { setEditingAction(null); setShowForm(true); }}>
            ➕ Add First Action
          </button>
        </div>
      ) : (
        <div className="reports-container">
          <div className="table-wrapper">
            <table className="data-table action-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Indicator</th>
                  <th>Status</th>
                  <th>Cause</th>
                  <th>Corrective</th>
                  <th>Responsible</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={a.id || i}>
                    <td><strong>{a.month}</strong></td>
                    <td><span className="indicator-badge">{a.indicator}</span></td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td className="cell-truncate">{a.cause || '—'}</td>
                    <td className="cell-truncate">{a.action_corrective || '—'}</td>
                    <td>{a.responsible || '—'}</td>
                    <td>{a.deadline || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn edit" onClick={() => { setEditingAction(a); setShowForm(true); }} title="Edit">
                          ✏️
                        </button>
                        <button className="row-btn delete" onClick={() => handleDelete(a.id)} title="Delete">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ActionPlanForm
          year={filterYear}
          defaultMonth={filterMonth}
          existingAction={editingAction}
          onClose={() => { setShowForm(false); setEditingAction(null); }}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}

export default ActionPlan;