import React, { useState } from 'react';

function ImportCSV({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setStatus('');

    // Preview first 5 rows
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 6);
      setPreview(lines.map(l => l.split(',')));
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) {
      setStatus('❌ Please select a CSV file first.');
      return;
    }

    setImporting(true);
    setStatus('Importing...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/injuries/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus(`✅ Imported: ${data.imported} rows | Skipped: ${data.skipped}`);
        setTimeout(() => {
          onImported();
          onClose();
        }, 2000);
      } else {
        setStatus(`❌ Error: ${data.detail || 'Import failed'}`);
      }
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
    setImporting(false);
  };

  const downloadTemplate = () => {
    const template = `Month,Year,ChartType,Category,Value
Janvier,2026,Project,ASSEMBLY PDB,5
Janvier,2026,Department,ASSEMBLY,22
Janvier,2026,BodyPart,Hand,82
Février,2026,Project,ASSEMBLY XKD,8
Février,2026,Department,CUTTING LP,4
Février,2026,BodyPart,Head,9`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "injuries_template.csv";
    link.click();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <button className="modal-close-btn" style={{ position: 'absolute', top: 16, right: 16 }} onClick={onClose}>
          ✖ Close
        </button>

        <div className="injury-form-header">
          <h2>📥 Import Injuries from CSV</h2>
          <p>Upload a CSV file to bulk-import injury data. Existing records are updated.</p>
        </div>

        {/* Step 1: Template */}
        <div className="import-step">
          <div className="import-step-num">1</div>
          <div className="import-step-content">
            <h4>Download the template</h4>
            <p>Use this CSV template. Columns: <code>Month, Year, ChartType, Category, Value</code></p>
            <button className="chart-icon-btn-lg" onClick={downloadTemplate}>
              📄 Download Template
            </button>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="import-step">
          <div className="import-step-num">2</div>
          <div className="import-step-content">
            <h4>Select your filled file</h4>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="file-upload-label">
              {file ? `📎 ${file.name}` : '📎 Choose CSV File'}
            </label>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="import-preview">
            <h4>Preview (first 5 rows):</h4>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i === 0 ? 'header-row' : ''}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import button */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button
            className="submit-btn"
            onClick={handleImport}
            disabled={!file || importing}
            style={{ flex: 1 }}
          >
            {importing ? '⏳ Importing...' : '🚀 Import Now'}
          </button>
        </div>

        {status && (
          <p className="settings-status" style={{ marginTop: 16 }}>{status}</p>
        )}
      </div>
    </div>
  );
}

export default ImportCSV;