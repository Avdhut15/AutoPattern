import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const ReconstructionChart = ({ reconstruction_errors = [], anomaly_labels = [] }) => {
  const chartData = useMemo(() => {
    if (!reconstruction_errors || reconstruction_errors.length === 0) return [];
    return reconstruction_errors.map((err, idx) => ({
      index: idx,
      error: Number(err.toFixed(5)),
      isAnomaly: anomaly_labels[idx] === 1,
    }));
  }, [reconstruction_errors, anomaly_labels]);

  if (chartData.length === 0) return null;

  // Compute threshold line (90th percentile)
  const sorted = [...reconstruction_errors].sort((a, b) => a - b);
  const thresholdIdx = Math.floor(sorted.length * 0.9);
  const threshold = sorted[thresholdIdx] || 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--bg-card)', padding: '12px',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.85rem'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: data.isAnomaly ? 'var(--error)' : 'var(--success)',
            marginBottom: '4px'
          }}>
            {data.isAnomaly ? '🚨 Anomaly' : '✅ Normal'}
          </div>
          <p><strong>Data Point:</strong> #{data.index}</p>
          <p><strong>Recon. Error:</strong> {data.error.toFixed(5)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
        <XAxis
          dataKey="index"
          stroke="var(--text-muted)"
          tick={{ fontSize: 11 }}
          label={{ value: 'Data Point Index', position: 'insideBottom', offset: -5, fontSize: 12, fill: 'var(--text-secondary)' }}
        />
        <YAxis
          stroke="var(--text-muted)"
          tick={{ fontSize: 11 }}
          label={{ value: 'Reconstruction Error', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'var(--text-secondary)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={threshold}
          stroke="var(--error)"
          strokeDasharray="5 5"
          label={{ value: 'Anomaly Threshold', position: 'insideTopRight', fill: 'var(--error)', fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="error"
          stroke="var(--brand-primary)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={chartData.length < 500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default React.memo(ReconstructionChart);
