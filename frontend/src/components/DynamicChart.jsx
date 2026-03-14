import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis,
  BarChart, Bar, Cell, LineChart, Line
} from 'recharts';

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#0d9488', // Teal
  '#9333ea', // Purple
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Light teal
  '#818cf8', // Lighter purple
  '#2dd4bf'  // Light cyan
];

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid var(--border-light)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '0.85rem',
  padding: '10px',
};

export const DynamicScatterChart = React.memo(({ data, xKey = 'x', yKey = 'y', zKey = 'z', clusterKey = 'cluster', xAxisLabel = 'X', yAxisLabel = 'Y' }) => {
  const clusters = [...new Set(data.map(item => item[clusterKey]))];
  const disableAnim = data.length > 500;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xAxisLabel}
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yAxisLabel}
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
        />
        {zKey && <ZAxis type="number" dataKey={zKey} range={[50, 400]} />}
        <Tooltip contentStyle={tooltipStyle} />

        {clusters.map((cluster, index) => {
          const clusterData = data.filter(item => item[clusterKey] === cluster);
          const color = cluster === -1 ? 'rgba(150,150,150,0.5)' : CHART_COLORS[index % CHART_COLORS.length];
          const name = cluster === -1 ? 'Noise' : `Cluster ${cluster}`;

          return (
            <Scatter
              key={cluster}
              name={name}
              data={clusterData}
              fill={color}
              fillOpacity={0.8}
              isAnimationActive={!disableAnim}
            />
          );
        })}
      </ScatterChart>
    </ResponsiveContainer>
  );
});

export const DynamicBarChart = React.memo(({ data, xKey = 'name', yKey = 'value', color = 'var(--brand-primary)', height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
        <XAxis dataKey={xKey} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} isAnimationActive={data.length < 50}>
          {data.map((entry, index) => (
            <Cell key={`bar-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

export const DynamicLineChart = React.memo(({ data, xKey = 'x', yKey = 'y', color = 'var(--brand-primary)', height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
        <XAxis dataKey={xKey} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={data.length < 500} />
      </LineChart>
    </ResponsiveContainer>
  );
});

DynamicScatterChart.displayName = 'DynamicScatterChart';
DynamicBarChart.displayName = 'DynamicBarChart';
DynamicLineChart.displayName = 'DynamicLineChart';
