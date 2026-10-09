import React, { useState } from 'react';

function DataEntryForm({ onDataAdded, onClose, allData, selectedYear }) {
  const [mode, setMode] = useState('add'); // 'add' or 'edit'
  const [sheetName, setSheetName] = useState('TRIR');
  const [monthIndex, setMonthIndex] = useState(0);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const indicators = [
    { title: 'TRIR', sheet: 'TRIR' },
    { title: 'LTIR', sheet: 'LTIR' },
    { title: 'Energy', sheet: 'Kwh' },
    { title: 'Water', sheet: 'm3' },
    { title: 'Waste', sheet: 'Kg' },
    { title: 'Recycling Rate (%)', sheet: '%' }
  ];

  // Get the current value for the selected indicator and month
  const currentValue = () => {
    const data = allData[sheetName];
    if (!data || !data.datasets || !data.datasets.reel) return 'N/A';
    const val = data.datasets.reel[monthIndex];
    return val !== undefined ? Number(val).toFixed(4) : '0.0000';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/update_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        sheet_name: sheetName,
        month_index: parseInt(monthIndex),
        value: parseFloat(value),
        year: parseInt(selectedYear) || 2026
}),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (response.ok) {
        setStatus('✅ Data saved successfully!');
        setTimeout(() => {
          onDataAdded();
          onClose();
        }, 1500);
      } else {
        setStatus(`❌ Error: ${result.detail || 'Unknown server error'}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setStatus('❌ Error: Server timed out. Make sure the Excel file is CLOSED on your Mac.');
      } else {
        setStatus(`❌ Connection error. Is the backend running?`);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="close-btn" onClick={onClose}>✖ Close</button>
        
        <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#111827' }}>
          {mode === 'add' ? '➕ Add Monthly Data' : '✏️ Correct Existing Data'}
        </h2>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
          {mode === 'add' 
            ? 'Enter a new value for the selected indicator and month.' 
            : 'Update a value that was previously entered incorrectly.'}
        </p>

        {/* Toggle Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button 
            type="button"
            onClick={() => setMode('add')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600',
              backgroundColor: mode === 'add' ? '#E31837' : '#F3F4F6',
              color: mode === 'add' ? '#fff' : '#111827'
            }}
          >
            Add New
          </button>
          <button 
            type="button"
            onClick={() => setMode('edit')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600',
              backgroundColor: mode === 'edit' ? '#E31837' : '#F3F4F6',
              color: mode === 'edit' ? '#fff' : '#111827'
            }}
          >
            Correct Existing
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="data-form">
          <div>
            <label>Indicator:</label>
            <select value={sheetName} onChange={(e) => setSheetName(e.target.value)}>
              {indicators.map(ind => <option key={ind.sheet} value={ind.sheet}>{ind.title}</option>)}
            </select>
          </div>

          <div>
            <label>Month:</label>
            <select value={monthIndex} onChange={(e) => setMonthIndex(e.target.value)}>
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>

          {/* Current Value Preview */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>Current Value (Réel): </span>
            <span style={{ fontSize: '16px', color: '#111827', fontWeight: '800' }}>{currentValue()}</span>
          </div>

          <div>
            <label>New Value (Réel):</label>
            <input 
              type="number" 
              step="0.0001" 
              placeholder="e.g. 0.025"
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="submit-btn" disabled={status.includes('Saving')}>
            {status.includes('Saving') ? 'Saving...' : (mode === 'add' ? 'Save to Excel' : 'Update Excel')}
          </button>
        </form>
        {status && <p className="status-msg">{status}</p>}
      </div>
    </div>
  );
}

export default DataEntryForm;