import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckSquare,
  Flame,
  ShieldAlert,
  Gauge,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Plus,
  UserCheck,
  ChevronRight,
  Mic,
  Volume2
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { EmptyStateOnboarding } from '../common/EmptyStateOnboarding';

export const DashboardView: React.FC = () => {
  const {
    employees,
    tasks,
    projects,
    workloads,
    teamAnalytics,
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    openOptimizerModal,
    openSimulateModal,
    openCreateTaskModal,
    openEmployeeDetailModal,
    openTaskDetailModal,
    setActiveTab
  } = useApp();

  if (employees.length === 0 && projects.length === 0 && tasks.length === 0) {
    return <EmptyStateOnboarding type="dashboard" />;
  }

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');

  const overloadedEmployees = workloads.filter((w) => w.utilization >= 80);
  const criticalTasks = tasks.filter((t) => (t.priority === 'Critical' || t.riskLevel === 'Critical') && t.status !== 'Completed');

  // Chart data preparation
  const chartData = workloads.map((w) => ({
    name: w.employee.name.split(' ')[0].toUpperCase(),
    fullName: w.employee.name,
    utilization: w.utilization,
    assigned: w.assignedHours,
    capacity: w.weeklyCapacity,
    status: w.status
  }));

  const getBarColor = (util: number) => {
    if (util >= 90) return '#FF3D00'; // Hot Orange / Critical
    if (util >= 75) return '#FFA000'; // Amber warning
    if (util >= 50) return '#FFFFFF'; // Clean High White
    return '#737373'; // Neutral grey
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome & Quick AI Action */}
      <div className="p-8 bg-white/[0.02] border border-white/10 relative overflow-hidden flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3D00] font-black">
              STATUS: SPRINT HORIZON ACTIVE
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono">
              REALTIME AI SCHEDULING
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-white leading-none font-display">
            WORKFORCE <span className="text-transparent" style={{ WebkitTextStroke: '2px white' }}>INTELLIGENCE</span>
          </h1>
          <p className="text-sm text-white/40 leading-relaxed font-light">
            Algorithmic load distribution across {employees.length} engineers and {projects.length} active initiatives.
            Predict bottlenecks, prevent burnout, and enforce continuous on-time delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('ai_copilot')}
            className="flex items-center gap-2 px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-[#FF3D00]/50 text-[#FF3D00] hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-[#FF3D00]/10 active:scale-95"
          >
            <Mic className="w-4 h-4 text-[#FF3D00]" />
            <span>VOICE COPILOT</span>
          </button>


          <button
            onClick={openOptimizerModal}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#FF3D00]/20 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>AI OPTIMIZE TEAM</span>
          </button>

          <button
            onClick={openCreateTaskModal}
            className="flex items-center gap-2 px-5 py-3.5 border border-white/20 text-white hover:bg-white hover:text-black font-bold text-xs uppercase tracking-widest transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Proactive Overload Alert Banner */}
      {overloadedEmployees.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-950 border border-rose-800/80 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-300 uppercase tracking-wider">
                <span>Overload Alert:</span>
                <span className="text-white">
                  {overloadedEmployees.map((o) => `${o.employee.name} (${o.utilization}%)`).join(', ')}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Engineers exceed safe workload thresholds. Delivery risk elevated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai_copilot')}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-[#FF3D00]/60 text-[#FF3D00] font-mono text-xs font-bold transition"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Ask Voice Copilot to Rebalance</span>
            </button>
            <button
              onClick={openOptimizerModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF3D00] hover:bg-[#FF3D00]/90 text-black font-mono text-xs font-bold transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Redistribute</span>
            </button>
          </div>
        </div>
      )}


      {/* 8 Primary Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-6 bg-white/[0.02] border border-white/10 border-l-4 border-l-white/30 hover:border-white/30 transition">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-2">
            Team Members
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
            {employees.length}
            <span className="text-base font-normal not-italic text-white/30 ml-2 font-mono">FTE</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/50 uppercase tracking-widest">
            100% OPERATIONAL
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 bg-white/[0.02] border border-white/10 border-l-4 border-l-white/30 hover:border-white/30 transition">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-2">
            Active Tasks
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
            {teamAnalytics.totalActiveTasks}
            <span className="text-base font-normal not-italic text-white/30 ml-2 font-mono">/{tasks.length}</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/50 uppercase tracking-widest">
            {teamAnalytics.completedTasksCount} COMPLETE ({Math.round((teamAnalytics.completedTasksCount / tasks.length) * 100)}%)
          </div>
        </div>

        {/* Metric 3: Overloaded Alert */}
        <div className={`p-6 bg-white/[0.02] border transition ${
          teamAnalytics.overloadedEmployeesCount > 0
            ? 'border-[#FF3D00]/50 border-l-4 border-l-[#FF3D00]'
            : 'border-white/10 border-l-4 border-l-white/30'
        }`}>
          <div className="text-[9px] uppercase tracking-[0.3em] text-[#FF3D00] font-semibold mb-2 flex items-center justify-between">
            <span>Overloaded</span>
            <Flame className="w-3.5 h-3.5 text-[#FF3D00]" />
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-[#FF3D00] italic">
            {teamAnalytics.overloadedEmployeesCount}
            <span className="text-base font-normal not-italic text-[#FF3D00]/60 ml-2 font-mono">&gt;80%</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-[#FF3D00] uppercase tracking-widest">
            {teamAnalytics.overloadedEmployeesCount > 0 ? 'CRITICAL BOTTLENECK' : 'BALANCED LOAD'}
          </div>
        </div>

        {/* Metric 4: Risk Deliverables */}
        <div className={`p-6 bg-white/[0.02] border transition ${
          teamAnalytics.atRiskTasks > 0
            ? 'border-white/30 border-l-4 border-l-[#FF3D00]'
            : 'border-white/10 border-l-4 border-l-white/30'
        }`}>
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-2 flex items-center justify-between">
            <span>At-Risk Tasks</span>
            <ShieldAlert className="w-3.5 h-3.5 text-white/60" />
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
            {teamAnalytics.atRiskTasks}
            <span className="text-base font-normal not-italic text-white/30 ml-2 font-mono">RISK</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            DEADLINE DEFICIT
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-6 bg-white/[0.02] border border-white/10 border-l-4 border-l-white/30 hover:border-white/30 transition">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-2">
            Team Load
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
            {teamAnalytics.teamUtilization}%
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            {teamAnalytics.totalAssignedHours}H / 320H TOTAL
          </div>
        </div>

        {/* Metric 6 */}
        <div className="p-6 bg-white/[0.02] border border-white/10 border-l-4 border-l-white/30 hover:border-white/30 transition">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-2">
            Free Bandwidth
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
            {teamAnalytics.totalAvailableHours}
            <span className="text-base font-normal not-italic text-white/30 ml-2 font-mono">HRS</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            AVAILABLE CAPACITY
          </div>
        </div>

        {/* Metric 7 */}
        <div className="p-6 bg-white/[0.02] border border-white/10 border-l-4 border-l-white/30 hover:border-white/30 transition">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold mb-2">
            Forecast Health
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
            89%
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            96% WITH AI REBALANCE
          </div>
        </div>

        {/* Metric 8 */}
        <div className="p-6 bg-white/[0.02] border border-[#FF3D00]/40 border-l-4 border-l-[#FF3D00] hover:border-[#FF3D00] transition">
          <div className="text-[9px] uppercase tracking-[0.3em] text-[#FF3D00] font-semibold mb-2 flex items-center justify-between">
            <span>AI Actions</span>
            <Sparkles className="w-3.5 h-3.5 text-[#FF3D00]" />
          </div>
          <div className="text-4xl lg:text-5xl font-black tracking-tighter text-[#FF3D00] italic">
            {pendingRecs.length}
            <span className="text-base font-normal not-italic text-[#FF3D00]/60 ml-2 font-mono">PENDING</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-[#FF3D00] uppercase tracking-widest">
            -14% DELIVERY DEFICIT
          </div>
        </div>
      </div>

      {/* Main Charts & Action Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-Time Workload Distribution Chart */}
        <div className="lg:col-span-2 p-6 bg-white/[0.02] border border-white/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="text-[9px] uppercase tracking-[0.4em] text-[#FF3D00] font-bold">
                TELEMETRY // MATRIX
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white font-display mt-0.5">
                Workload & Capacity Distribution
              </h2>
            </div>

            <div className="flex items-center gap-4 text-[10px] uppercase font-mono tracking-wider">
              <span className="flex items-center gap-1.5 text-white/50">
                <span className="w-2.5 h-2.5 bg-neutral-500 inline-block"></span> &lt;50%
              </span>
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-2.5 h-2.5 bg-white inline-block"></span> 50-75%
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 bg-amber-500 inline-block"></span> 76-90%
              </span>
              <span className="flex items-center gap-1.5 text-[#FF3D00]">
                <span className="w-2.5 h-2.5 bg-[#FF3D00] inline-block"></span> &gt;90%
              </span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 w-full min-w-0 min-h-[256px]">
            <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={10} fontVariant="mono" />
                <YAxis stroke="#737373" fontSize={10} domain={[0, 110]} unit="%" fontVariant="mono" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-4 bg-[#0a0a0a] border border-white/20 shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white uppercase tracking-wider">{data.fullName}</p>
                          <p className="text-white/60 font-mono">Utilization: <strong className="text-[#FF3D00]">{data.utilization}%</strong></p>
                          <p className="text-white/40 font-mono">Assigned: {data.assigned}h / {data.capacity}h</p>
                          <p className="text-white font-mono font-bold uppercase text-[10px]">{data.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="utilization" radius={[0, 0, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
              SIMULATE FUTURE ASSIGNMENTS
            </span>
            <button
              onClick={openSimulateModal}
              className="text-[10px] uppercase tracking-widest text-[#FF3D00] hover:text-white font-black transition cursor-pointer"
            >
              LAUNCH WHAT-IF SIMULATOR →
            </button>
          </div>
        </div>

        {/* Right 1 Col: AI Recommendations Panel */}
        <div className="p-6 bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF3D00]" />
                <h2 className="text-base font-black uppercase tracking-tight text-white font-display">
                  Live AI Directives
                </h2>
              </div>
              <span className="px-2 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase tracking-widest">
                {pendingRecs.length} Ready
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {pendingRecs.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-white/10 bg-white/[0.01]">
                  <CheckCircle2 className="w-6 h-6 text-white/40 mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-wider text-white">Workload Optimal</p>
                  <p className="text-[10px] font-mono text-white/30">Zero engineer bottlenecks detected.</p>
                </div>
              ) : (
                pendingRecs.slice(0, 2).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-white/[0.03] border border-white/10 border-l-2 border-l-[#FF3D00] space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white uppercase tracking-tight">{rec.taskTitle}</span>
                      <span className="px-2 py-0.5 bg-white/10 text-white font-mono text-[9px] font-bold">
                        {rec.taskHours}H
                      </span>
                    </div>

                    <p className="text-white/60 text-xs leading-relaxed">
                      Reassign from <strong className="text-[#FF3D00]">{rec.currentEmployeeName || 'Rahul'}</strong> to{' '}
                      <strong className="text-white">{rec.recommendedEmployeeName}</strong>
                    </p>

                    <div className="text-[10px] text-white/40 bg-black/40 p-2.5 border border-white/5 font-mono">
                      ⚡ {rec.reasons[0]}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => rejectRecommendation(rec.id)}
                        className="px-3 py-1 border border-white/20 text-white/60 hover:text-white text-[10px] uppercase tracking-wider font-bold transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => approveRecommendation(rec.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-[#FF3D00] hover:bg-[#ff5722] text-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3 fill-black" />
                        <span>Execute</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={openOptimizerModal}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-[#FF3D00] font-black text-xs uppercase tracking-widest transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>OPTIMIZER STUDIO ({pendingRecs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Overloaded Engineers Alert & Critical Deliverables Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overloaded Engineers Quick Action List */}
        <div className="p-6 bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FF3D00]" />
              <h2 className="text-sm font-black uppercase tracking-tight text-white font-display">
                Capacity Deficit Alerts
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('workload')}
              className="text-[10px] uppercase tracking-widest text-[#FF3D00] hover:text-white font-bold cursor-pointer"
            >
              Matrix →
            </button>
          </div>

          <div className="space-y-3">
            {overloadedEmployees.map((w) => (
              <div
                key={w.employee.id}
                onClick={() => openEmployeeDetailModal(w.employee)}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 border-l-2 border-l-[#FF3D00] cursor-pointer transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={w.employee.avatar}
                    alt={w.employee.name}
                    className="w-10 h-10 object-cover border border-white/20"
                  />
                  <div>
                    <p className="font-bold text-white uppercase tracking-wider">{w.employee.name}</p>
                    <p className="text-[10px] font-mono text-white/40">{w.employee.role} • {w.activeTasksCount} active tasks</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-[#FF3D00] text-base">{w.utilization}%</span>
                  <p className="text-[9px] font-mono text-white/40">{w.assignedHours}H / {w.weeklyCapacity}H</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Milestone Deliverables */}
        <div className="p-6 bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-white" />
              <h2 className="text-sm font-black uppercase tracking-tight text-white font-display">
                Critical Deliverables
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-[10px] uppercase tracking-widest text-white/60 hover:text-white font-bold cursor-pointer"
            >
              All Tasks ({tasks.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {criticalTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => openTaskDetailModal(task)}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#FF3D00]">{task.taskNumber}</span>
                    <span className="font-bold text-white uppercase tracking-tight">{task.title}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/40 mt-1">
                    DUE {task.deadline} • {task.estimatedHours}H EFFORT • {task.progress}% DONE
                  </p>
                </div>

                <span className={`px-2 py-1 text-[9px] font-black uppercase font-mono ${
                  task.priority === 'Critical' ? 'bg-[#FF3D00] text-black' : 'border border-white/30 text-white'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
