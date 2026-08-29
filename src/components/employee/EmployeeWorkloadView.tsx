import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateEmployeeWorkload } from '../../utils/workloadEngine';
import { Gauge, Clock, ShieldCheck, CheckCircle2, Flame } from 'lucide-react';

export const EmployeeWorkloadView: React.FC = () => {
  const { currentUser, employees, tasks, settings } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentUser.employeeId) || employees[1];
  const workload = calculateEmployeeWorkload(currentEmployee, tasks, settings);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white tracking-tight">My Capacity & Utilization Breakdown</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            Sprint Allocation
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Detailed breakdown of your committed sprint hours, remaining weekly bandwidth, and focus balance.
        </p>
      </div>

      {/* Primary Capacity Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Capacity</span>
            <p className="text-xl font-black text-white mt-1">{workload.weeklyCapacity}h / wk</p>
            <span className="text-[10px] text-slate-500">8h / working day</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Effort</span>
            <p className="text-xl font-black text-indigo-300 mt-1">{workload.assignedHours}h</p>
            <span className="text-[10px] text-slate-500">{workload.activeTasksCount} active tasks</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Available Bandwidth</span>
            <p className="text-xl font-black text-emerald-400 mt-1">{workload.availableHours}h</p>
            <span className="text-[10px] text-slate-500">{(workload.availableHours / 5).toFixed(1)}h / day</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Utilization Rate</span>
            <p className="text-xl font-black text-cyan-300 mt-1">{workload.utilization}%</p>
            <span className="text-[10px] text-emerald-400 font-bold">{workload.status}</span>
          </div>
        </div>

        {/* Workload Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Weekly Hours Allocation</span>
            <span className="font-bold text-slate-200">{workload.assignedHours} / {workload.weeklyCapacity} hours</span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                workload.utilization > 90
                  ? 'bg-rose-500'
                  : workload.utilization > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, workload.utilization)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
