import React from 'react';
import { useApp } from '../../context/AppContext';
import { analyzeAllRisks } from '../../utils/riskEngine';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Sliders,
  Sparkles,
  UserCheck
} from 'lucide-react';

export const RiskEngineView: React.FC = () => {
  const {
    tasks,
    employees,
    projects,
    openOptimizerModal,
    openSimulateModal,
    openTaskDetailModal
  } = useApp();

  const risks = analyzeAllRisks(tasks, employees, projects);
  const criticalRisks = risks.filter((r) => r.riskLevel === 'Critical');
  const highRisks = risks.filter((r) => r.riskLevel === 'High');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Delivery Risk Intelligence Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30">
              {risks.length} Audited Deliverables
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated bottleneck detection, burnout monitoring, and milestone slippage early-warning system.
          </p>
        </div>

        <button
          onClick={openOptimizerModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition active:scale-95"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Auto-Mitigate Risks with AI</span>
        </button>
      </div>

      {/* High-Level Risk Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/40 space-y-1">
          <span className="text-xs font-bold uppercase text-rose-300">Critical Delivery Risks</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{criticalRisks.length}</span>
            <span className="text-xs text-slate-400">tasks delayed or blocked</span>
          </div>
          <p className="text-[11px] text-rose-300">Immediate managerial action required</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 space-y-1">
          <span className="text-xs font-bold uppercase text-amber-300">High Capacity Pressure</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{highRisks.length}</span>
            <span className="text-xs text-slate-400">tasks near threshold</span>
          </div>
          <p className="text-[11px] text-amber-300">Rebalance recommended before sprint ends</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-300">Audited Portfolio Health</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">89%</span>
            <span className="text-xs text-slate-400">on-time probability</span>
          </div>
          <p className="text-[11px] text-emerald-300">+7% after applying AI recommendations</p>
        </div>
      </div>

      {/* Risks Table / Cards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Delivery Risk Audit Details
        </h3>

        <div className="space-y-3">
          {risks.map((risk) => {
            const isHighOrCritical = risk.riskLevel === 'Critical' || risk.riskLevel === 'High';

            return (
              <div
                key={risk.taskId}
                onClick={() => {
                  const taskObj = tasks.find((t) => t.id === risk.taskId);
                  if (taskObj) openTaskDetailModal(taskObj);
                }}
                className={`p-4 rounded-2xl border shadow-md cursor-pointer transition space-y-3 ${
                  risk.riskLevel === 'Critical'
                    ? 'bg-rose-950/20 border-rose-600/50 hover:bg-rose-950/30'
                    : risk.riskLevel === 'High'
                    ? 'bg-amber-950/20 border-amber-600/50 hover:bg-amber-950/30'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        risk.riskLevel === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : risk.riskLevel === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {risk.riskLevel} Risk
                      </span>
                      <span className="font-extrabold text-sm text-blue-400">{risk.taskNumber}</span>
                      <span className="font-bold text-sm text-white">{risk.taskTitle}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Project: {risk.projectName} • Assignee:{' '}
                      <strong className="text-slate-200">{risk.assigneeName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Remaining Work</span>
                      <p className="font-bold text-slate-200">{risk.remainingHours}h effort</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Working Days Left</span>
                      <p className={`font-bold ${risk.workingDaysLeft <= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {risk.workingDaysLeft} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Explanation */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    ⚠️ <strong>Primary Risk Factor:</strong> {risk.primaryRiskFactor}
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {risk.details}
                  </p>
                  <div className="pt-1.5 border-t border-slate-800 text-cyan-300 font-semibold text-[11px]">
                    💡 <strong>Recommended Mitigation:</strong> {risk.recommendedAction}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
