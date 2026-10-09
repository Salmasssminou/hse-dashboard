import React, { useState } from 'react';

function InjuryForm({ year, defaultMonth, onClose, onSaved }) {
  const [chartType, setChartType] = useState('Project');
  const [month, setMonth] = useState(defaultMonth && defaultMonth !== 'Tous' ? defaultMonth : 'Janvier');
  const [entryYear, setEntryYear] = useState(year || '2026');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const years = ['2024', '2025', '2026', '2027', '2028'];

  const categoriesMap = {
    Project: [
      'ASSEMBLY PDB', 'ASSEMBLY XKD', 'ASSEMBLY ROCKET', 'ASSEMBLY VOLVO',
      'ASSEMBLY X82', 'ASSEMBLY EX30', 'ASSEMBLY FL', 'ASSEMBLY ECHO 5',
      'LEAD PREP', 'CUTTING', 'UCs', 'MAINTENANCE', 'LOGISTIQUE', 'QUALITY', 'ENGINEERING'
    ],
    Department: ['ASSEMBLY', 'CUTTING LP', 'MAINTENANCE', 'LOGISTIQUE', 'UCs', 'QUALITY', 'ING'],
    BodyPart: ['Hand', 'Head', 'Feet', 'Arm', 'Leg', 'Trunk']
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch('/api/injuries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month, year: parseInt(entryYear), chart_type: chartType,
          category, value: parseFloat(value)
        })
      });
      if (res.ok) {
        setStatus('✅ Saved!');
        setTimeout(() => { onSaved(); onClose(); }, 1000);
      } else {
        const err = await res.json();
        setStatus('❌ ' + (err.detail || 'Error saving'));
      }
    } catch (err) {
      setStatus('❌ ' + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <button className="modal-close-btn" style={{ position: 'absolute', top: 16, right: 16 }} onClick={onClose}>✖ Close</button>

        <div className="injury-form-header">
          <h2>🩹 Add Injury Data</h2>
          <p>Select year, month, category and enter the number of cases.</p>
        </div>

        <form onSubmit={handleSubmit} className="data-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          </div>

          <div>
            <label>Chart Type:</label>
            <select value={chartType} onChange={(e) => { setChartType(e.target.value); setCategory(''); }}>
              <option value="Project">🏭 By Project</option>
              <option value="Department">👥 By Department</option>
              <option value="BodyPart">🦴 By Body Part</option>
            </select>
          </div>

          <div>
            <label>Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">-- Select --</option>
              {categoriesMap[chartType].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label>Number of Cases:</label>
            <input type="number" min="0" step="1" placeholder="e.g. 5"
              value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>

          <button type="submit" className="submit-btn" disabled={status.includes('Saving')}>
            {status.includes('Saving') ? 'Saving...' : '💾 Save'}
          </button>
        </form>

        {status && <p className="settings-status" style={{ marginTop: 16 }}>{status}</p>}
      </div>
    </div>
  );
}

export default InjuryForm;