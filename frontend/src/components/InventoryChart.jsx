import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { useInventory } from '../context/InventoryContext';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 animate-fade-up shadow-lg border-0">
        <p className="fw-bold mb-1 fs-6" style={{ color: 'var(--text-main)' }}>{label}</p>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: payload[0].color || '#0066FF' }}></div>
          <span className="text-muted fw-medium">Stock Remaining:</span>
          <span className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const InventoryChart = () => {
  const { inventory } = useInventory();

  // Sort by quantity, get top 15 products to prevent chart crowding
  const chartData = [...inventory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 15)
    .map(item => ({
      name: item.name,
      Stock: item.quantity,
      id: item._id
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-4 mb-4 animate-fade-up delay-200 shadow-sm" style={{ minHeight: '400px' }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Activity size={24} className="text-primary" />
        <h5 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>Live Warehouse Volume</h5>
      </div>
      
      <div style={{ width: '100%', height: '350px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height={350} minWidth={0} debounce={50}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0066FF" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#0066FF" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--panel-border)" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-color)', opacity: 0.1 }} />
            
            <Bar 
              dataKey="Stock" 
              radius={[6, 6, 0, 0]} 
              fill="url(#colorGlow)"
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.Stock < 5 ? '#EF4444' : entry.Stock < 15 ? '#FBBF24' : 'url(#colorGlow)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryChart;
