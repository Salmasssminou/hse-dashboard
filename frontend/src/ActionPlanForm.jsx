import React, { useState } from 'react';

function ActionPlanForm({ year, defaultMonth, existingAction, onClose, onSaved }) {
  const isEdit = !!existingAction;

  const [month, setMonth] = useState(existingAction?.month || (defaultMonth && defaultMonth !== 'Tous' ? defaultMonth : 'Janvier'));
  const [entryYear, setEntryYear] = useState(String(existingAction?.year || year || '2026'));
  const [indicator, setIndicator] = useState(existingAction?.indicator || 'TRIR');
  const [cause, setCause] = useState(existingAction?.cause || '');
  const [actionCorrective, setActionCorrective] = useState(existingAction?.action_corrective || '');
  const [actionPreventive, setActionPreventive] = useState(existingAction?.action_preventive || '');
  const [responsible, setResponsible] = useState(existingAction?.responsible || '');
  const [deadline, setDeadline] = useState(existingAction?.deadline || '');
  const [status, setStatus] = useState(existingAction?.status || 'En cours');
  const [statusMsg, setStatusMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const years = ['2024', '2025', '2026', '2027', '2028'];
  const indicators = ['TRIR', 'LTIR', 'Kwh', 'm3', 'Kg', '%'];
  const statuses = ['En cours', 'Clos', 'En retard', 'Planifié', 'Terminé'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(isEdit ? 'Updating...' : 'Saving...');

    const payload = {
      month,
      year: parseInt(entryYear),
      indicator,
      cause,
      action_corrective: actionCorrective,
      action_preventive: actionPreventive,
      responsible,
      deadline,
      status,
      efficacy: ''
    };

    const url = isEdit
      ? '/api/action_plan/update'
      : '/api/action_plan/save';
    const method = isEdit ? 'PUT' : 'POST';

    if (isEdit) payload.id = existingAction.id;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStatusMsg(isEdit ? '✅ Action updated!' : '✅ Action saved!');
        setTimeout(() => { onSaved(); onClose(); }, 1000);
      } else {
        const err = await res.json();
        setStatusMsg(`❌ ${err.detail || 'Failed'}`);
      }
    } catch (err) {
      setStatusMsg(`❌ ${err.message}`);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close-btn" style={{ position: 'absolute', top: 16, right: 16 }} onClick={onClose}>
          ✖ Close
        </button>

        <div className="injury-form-header">
          <h2>{isEdit ? '✏️ Edit Action Plan' : '📋 Add Action Plan'}</h2>
          <p>{isEdit ? 'Update the details of this action.' : 'Document a corrective or preventive action.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="data-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label>Year:</label>
              <select value={entryYear} onChange={(e) => setEntryYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label>Month:</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label>Indicator:</label>
              <select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
                {indicators.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label>Cause / Root Cause:</label>
            <textarea value={cause} onChange={(e) => setCause(e.target.value)} rows={2}
              placeholder="Describe the root cause of the issue..."
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />
          </div>

          <div>
            <label>Corrective Action:</label>
            <textarea value={actionCorrective} onChange={(e) => setActionCorrective(e.target.value)} rows={2}
              placeholder="What is being done to fix the issue?"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />
          </div>

          <div>
            <label>Preventive Action:</label>
            <textarea value={actionPreventive} onChange={(e) => setActionPreventive(e.target.value)} rows={2}
              placeholder="What is being done to prevent recurrence?"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label>Responsible:</label>
              <input type="text" value={responsible} onChange={(e) => setResponsible(e.target.value)}
                placeholder="e.g. JABRANE OTMANE" />
            </div>
            <div>
              <label>Deadline:</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label>Status:</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? '⏳ Saving...' : (isEdit ? '💾 Update Action' : '💾 Save Action')}
          </button>
        </form>

        {statusMsg && <p className="settings-status" style={{ marginTop: 16 }}>{statusMsg}</p>}
      </div>
    </div>
  );
}

export default ActionPlanForm;