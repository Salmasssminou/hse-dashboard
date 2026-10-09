import React from 'react';

function KpiCard({ title, reelData, targetData, filterLabel }) {
  if (!reelData || !targetData) return <div className="kpi-card loading">Loading...</div>;

  // Calculate average of all shown months (YTD or single month)
  const avgReel = (reelData.reduce((a, b) => a + b, 0) / reelData.length);
  const avgTarget = (targetData.reduce((a, b) => a + b, 0) / targetData.length);
  
  // Calculate Trend (Compare last month to previous month) only if more than 1 month is shown
  let trend = 0;
  let showTrend = false;
  if (reelData.length > 1) {
    const last = parseFloat(reelData[reelData.length - 1]);
    const prev = parseFloat(reelData[reelData.length - 2]);
    if (prev !== 0) {
      trend = ((last - prev) / Math.abs(prev)) * 100;
    } else if (last !== 0) {
      trend = 100; // If previous was 0 and now it's not, show 100% up
    }
    showTrend = true;
  }

  const isOnTarget = avgReel <= avgTarget;
  
  // Determine color for trend (For HSE, DOWN is GOOD for most indicators)
  const trendIsGood = trend < 0;

  return (
    <div className="kpi-card">
      <h3>{title} ({filterLabel})</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <p className={`kpi-value ${isOnTarget ? 'good' : 'bad'}`}>{avgReel.toFixed(2)}</p>
        {showTrend && (
          <span style={{ fontSize: '14px', fontWeight: '700', color: trendIsGood ? '#10B981' : '#E31837' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <span className="kpi-target">Objectif: {avgTarget.toFixed(2)}</span>
    </div>
  );
}

export default KpiCard;