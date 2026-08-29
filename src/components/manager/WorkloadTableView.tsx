import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Gauge,
  Search,
  Filter,
  Sliders,
  Sparkles,
  Users,
  Flame,
  ShieldAlert,
  Zap,
  ArrowUpDown,
  UserCheck
} from 'lucide-react';

export const WorkloadTableView: React.FC = () => {
  const {
    workloads,
    openEmployeeDetailModal,
    openSimulateModal,
    openOptimizerModal
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredWorkloads = workloads.filter((w) => {
    const matchesSearch =
      w.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.employee.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'OVERLOADED') return matchesSearch && (w.status === 'OVERLOADED' || w.status === 'CRITICAL' || w.utilization >= 80);
    if (filterStatus === 'HEALTHY') return matchesSearch && w.status === 'HEALTHY';
    if (filterStatus === 'AVAILABLE') return matchesSearch && w.status === 'AVAILABLE';
    return matchesSearch;
  });

  const getStatusBadge = (status: string, util: number) => {
    if (util >= 90 || status === 'OVERLOADED' || status === 'CRITICAL') {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    if (util >= 75 || status === 'HIGH WORKLOAD') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (util >= 50 || status === 'HEALTHY') {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  const getProgressColor = (util: number) => {
    if (util >= 90) return 'bg-rose-500';
    if (util >= 75) return 'bg-amber-500';
    if (util >= 50) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Real-Time Team Workload Matrix</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              Live Allocation Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor capacity, active sprint commitments, burnout risk, and available bandwidth for every engineer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openOptimizerModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>AI Rebalance Team</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by engineer name, role, or technical skill..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
          {['ALL', 'OVERLOADED', 'HEALTHY', 'AVAILABLE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4">Engineer</th>
                <th className="py-3.5 px-3">Skills</th>
                <th className="py-3.5 px-3">Weekly Capacity</th>
                <th className="py-3.5 px-3">Assigned Work</th>
                <th className="py-3.5 px-3">Available</th>
                <th className="py-3.5 px-4 min-w-[160px]">Capacity Utilization</th>
                <th className="py-3.5 px-3 text-center">Tasks</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredWorkloads.map((w) => (
                <tr
                  key={w.employee.id}
                  className="hover:bg-slate-800/50 transition cursor-pointer"
                  onClick={() => openEmployeeDetailModal(w.employee)}
                >
                  {/* Engineer column */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={w.employee.avatar}
                        alt={w.employee.name}
                        className={`w-9 h-9 rounded-xl object-cover ring-2 ${
                          w.utilization >= 85 ? 'ring-rose-500' : 'ring-slate-700'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-slate-100 flex items-center gap-1.5">
                          {w.employee.name}
                          {w.utilization >= 85 && (
                            <Flame className="w-3.5 h-3.5 text-rose-400" />
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">{w.employee.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Skills */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {w.employee.skills.slice(0, 2).map((skill) => (
                        <span
                          key={skill}
                          className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {w.employee.skills.length > 2 && (
                        <span className="text-[10px] text-slate-500">
                          +{w.employee.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Weekly Capacity */}
                  <td className="py-3.5 px-3 font-semibold text-slate-200">
                    {w.weeklyCapacity}h / wk
                  </td>

                  {/* Assigned Hours */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-100">{w.assignedHours}h</span>
                    <span className="text-[10px] text-slate-500 block">{(w.assignedHours / 5).toFixed(1)}h / day</span>
                  </td>

                  {/* Available */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-emerald-400">{w.availableHours}h</span>
                    <span className="text-[10px] text-slate-500 block">{(w.availableHours / 5).toFixed(1)}h / day</span>
                  </td>

                  {/* Capacity Utilization Meter */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-200">{w.utilization}%</span>
                        <span className="text-slate-400 text-[10px]">{w.assignedHours}/{w.weeklyCapacity}h</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(w.utilization)}`}
                          style={{ width: `${Math.min(100, w.utilization)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Tasks count */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-bold text-slate-300">
                      {w.activeTasksCount}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                        w.status,
                        w.utilization
                      )}`}
                    >
                      {w.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openSimulateModal()}
                        title="Simulate Task Assignment"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 text-[11px] font-semibold transition"
                      >
                        Simulate
                      </button>

                      <button
                        onClick={() => openEmployeeDetailModal(w.employee)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold transition"
                      >
                        Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
