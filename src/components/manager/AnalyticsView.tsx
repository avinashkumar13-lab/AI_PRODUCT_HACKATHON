import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { tasks, teamAnalytics } = useApp();

  const priorityData = [
    { name: 'Critical', count: tasks.filter((t) => t.priority === 'Critical').length, color: '#FF3D00' },
    { name: 'High', count: tasks.filter((t) => t.priority === 'High').length, color: '#ffffff' },
    { name: 'Medium', count: tasks.filter((t) => t.priority === 'Medium').length, color: '#888888' },
    { name: 'Low', count: tasks.filter((t) => t.priority === 'Low').length, color: '#333333' }
  ];

  const skillDistribution = [
    { skill: 'React / Next.js', hours: 68 },
    { skill: 'Node.js / Express', hours: 54 },
    { skill: 'Python / FastAPI', hours: 42 },
    { skill: 'PostgreSQL / SQL', hours: 38 },
    { skill: 'Docker / DevOps', hours: 26 },
    { skill: 'UI / Design', hours: 24 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter font-display">
              WORKFORCE ANALYTICS & VELOCITY
            </h1>
            <span className="px-2.5 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase font-mono tracking-widest">
              SPRINT 2026-Q3
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1 font-light">
            Statistical breakdown of engineering workload, skill distribution, and bottleneck prevention.
          </p>
        </div>
      </div>

      {/* Top Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="p-5 bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Team Efficiency</span>
          <p className="text-3xl font-black text-white">92.4%</p>
          <span className="text-[10px] text-white/40 uppercase">ON-SCHEDULE DELIVERIES</span>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Burnout Index</span>
          <p className="text-3xl font-black text-[#FF3D00]">MODERATE</p>
          <span className="text-[10px] text-white/40 uppercase">2 ENGINEERS &gt;85% LOAD</span>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Completed Effort</span>
          <p className="text-3xl font-black text-white">{teamAnalytics.completedTasksCount * 12}H</p>
          <span className="text-[10px] text-white/40 uppercase">{teamAnalytics.completedTasksCount} DELIVERABLES</span>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AI ROI Impact</span>
          <p className="text-3xl font-black text-[#FF3D00]">-14% RISK</p>
          <span className="text-[10px] text-white/40 uppercase">PREVENTS 2 MISSED DEADLINES</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Skill Distribution */}
        <div className="p-6 bg-white/[0.02] border border-white/10 space-y-4">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
            COMMITTED ENGINEERING HOURS BY SKILL DOMAIN
          </h2>
          <div className="h-64 w-full min-w-0 min-h-[256px]">
            <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
              <BarChart data={skillDistribution} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" opacity={0.6} />
                <XAxis type="number" stroke="#666666" fontSize={10} unit="h" />
                <YAxis dataKey="skill" type="category" stroke="#999999" fontSize={10} width={110} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-black border border-white/20 text-xs font-mono">
                          <p className="font-bold text-white uppercase">{payload[0].payload.skill}</p>
                          <p className="text-[#FF3D00]">{payload[0].value} HOURS COMMITTED</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" fill="#FF3D00" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Priority Breakdown */}
        <div className="p-6 bg-white/[0.02] border border-white/10 space-y-4">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
            DELIVERABLE DISTRIBUTION BY PRIORITY
          </h2>
          <div className="h-64 w-full min-w-0 min-h-[256px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 bg-black border border-white/20 text-xs font-mono">
                          <p className="font-bold text-white uppercase">{payload[0].name}</p>
                          <p className="text-[#FF3D00]">{payload[0].value} DELIVERABLES</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
