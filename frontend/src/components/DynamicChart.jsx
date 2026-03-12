import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis
} from 'recharts';

const CHART_COLORS = [
  '#0d9488', // Teal
  '#3730a3', // Indigo
  '#06b6d4', // Cyan
  '#6366f1', // Soft visual purple/indigo
  '#14b8a6', // Light teal
  '#818cf8', // Lighter purple
  '#0ea5e9', // Sky blue
  '#2dd4bf'  // Light cyan
];

export const DynamicScatterChart = ({ data, xKey = 'x', yKey = 'y', zKey = 'z', clusterKey = 'cluster', xAxisLabel = 'X', yAxisLabel = 'Y' }) => {
  // Group data by cluster
  const clusters = [...new Set(data.map(item => item[clusterKey]))];
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          type="number" 
          dataKey={xKey} 
          name={xAxisLabel} 
          stroke="rgba(255,255,255,0.5)" 
          tick={{ fill: 'rgba(255,255,255,0.7)' }} 
        />
        <YAxis 
          type="number" 
          dataKey={yKey} 
          name={yAxisLabel} 
          stroke="rgba(255,255,255,0.5)" 
          tick={{ fill: 'rgba(255,255,255,0.7)' }} 
        />
        {zKey && <ZAxis type="number" dataKey={zKey} range={[50, 400]} />}
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
        
        {clusters.map((cluster, index) => {
          const clusterData = data.filter(item => item[clusterKey] === cluster);
          const color = cluster === -1 ? 'rgba(255,255,255,0.3)' : CHART_COLORS[index % CHART_COLORS.length]; // -1 often means noise in DBSCAN
          const name = cluster === -1 ? 'Noise' : `Cluster ${cluster}`;
          
          return (
            <Scatter 
              key={cluster} 
              name={name} 
              data={clusterData} 
              fill={color} 
              fillOpacity={0.8}
            />
          );
        })}
      </ScatterChart>
    </ResponsiveContainer>
  );
};
