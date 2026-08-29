import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Zap,
  CheckCircle2,
  Flame,
  UserCheck,
  Sparkles,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { runWorkloadOptimizer } from '../../utils/optimizerEngine';

export const OptimizerModal: React.FC = () => {
  const {
    isOptimizerModalOpen,
    closeOptimizerModal,
    employees,
    tasks,
    projects,
    settings,
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    applyAllPendingOptimizations
  } = useApp();

  if (!isOptimizerModalOpen) return null;

  const plan = runWorkloadOptimizer(employees, tasks, projects, settings);
  const pendingRecs = recommendations.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6"
      >
        {/* Modal Top Header */}
        <div className="p-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF3D00] flex items-center justify-center text-black">
              <Zap className="w-6 h-6 fill-black stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-display">
                  AI WORKLOAD OPTIMIZER
                </h2>
                <span className="px-2 py-0.5 bg-white/10 text-white text-[9px] font-black uppercase font-mono tracking-widest">
                  ALGO ENGINE
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5 font-light">
                Autonomous workload reallocation to eliminate capacity deficits and safeguard critical milestones.
              </p>
            </div>
          </div>

          <button
            onClick={closeOptimizerModal}
            className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Visual Before & After Workload Comparison Card */}
          <div className="p-6 bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                REDISTRIBUTION IMPACT // PREDICTIVE SIMULATION
              </span>
              <span className="text-xs font-mono font-bold text-[#FF3D00] flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                RISK DROPS {plan.teamRiskBefore}% → {plan.teamRiskAfter}%
              </span>
            </div>

            {/* Key Comparison Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CURRENT (BEFORE) */}
              <div className="p-5 bg-black/40 border border-white/10 border-l-4 border-l-[#FF3D00] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-black uppercase text-[#FF3D00] flex items-center gap-1.5 font-display">
                    <Flame className="w-4 h-4 text-[#FF3D00]" />
                    Current State
                  </span>
                  <span className="text-[10px] font-mono uppercase text-white/40 font-bold">2 OVERLOADED</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white uppercase font-bold">Rahul Sharma (Frontend)</span>
                      <span className="font-bold text-[#FF3D00]">94% (37.5h)</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                      <div className="bg-[#FF3D00] h-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white/80 uppercase">Aman Verma (Full Stack)</span>
                      <span className="font-bold text-white/50">45% (18h)</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                      <div className="bg-neutral-500 h-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white/80 uppercase">Priya Singh (Backend)</span>
                      <span className="font-bold text-white">77% (31h)</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                      <div className="bg-white h-full" style={{ width: '77%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AFTER OPTIMIZATION */}
              <div className="p-5 bg-black/40 border border-white/20 border-l-4 border-l-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-display">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    After AI Optimization
                  </span>
                  <span className="text-[10px] font-mono uppercase text-white font-black">0 OVERLOADED</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white uppercase font-bold">Rahul Sharma (Frontend)</span>
                      <span className="font-bold text-white">74% (29.5h) • -20%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                      <div className="bg-white h-full" style={{ width: '74%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white uppercase">Aman Verma (Full Stack)</span>
                      <span className="font-bold text-white">65% (26h) • OPTIMAL</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                      <div className="bg-white/80 h-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white uppercase">Priya Singh (Backend)</span>
                      <span className="font-bold text-white/70">77% (31h) • STABLE</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                      <div className="bg-white/70 h-full" style={{ width: '77%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Recommendations List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] font-display">
                Actionable Directives ({pendingRecs.length} PENDING)
              </h3>
              {pendingRecs.length > 0 && (
                <button
                  id="btn-apply-all-optimizations"
                  onClick={() => {
                    applyAllPendingOptimizations();
                    closeOptimizerModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#FF3D00]/20"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Execute All</span>
                </button>
              )}
            </div>

            {pendingRecs.length === 0 ? (
              <div className="p-8 bg-white/[0.02] border border-white/10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-white/40 mx-auto" />
                <p className="text-sm font-bold uppercase tracking-wider text-white">Team Fully Balanced</p>
                <p className="text-xs font-mono text-white/40">
                  Zero capacity bottlenecks detected across active sprint scope.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRecs.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 bg-white/[0.02] border border-white/10 border-l-4 border-l-[#FF3D00] space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase font-mono tracking-widest">
                            REBALANCE DIRECTIVE
                          </span>
                          <h4 className="font-bold text-sm text-white uppercase tracking-tight">{rec.taskTitle}</h4>
                        </div>
                        <p className="text-xs text-white/60 mt-1.5 flex items-center gap-2 font-mono">
                          Shift <strong className="text-[#FF3D00]">{rec.taskHours}H</strong> from{' '}
                          <strong className="text-white">{rec.currentEmployeeName || 'Rahul Sharma'}</strong> to{' '}
                          <strong className="text-white underline">{rec.recommendedEmployeeName}</strong>
                        </p>
                      </div>

                      {rec.deliveryRiskReduction && (
                        <div className="px-2.5 py-1 bg-white/10 text-white text-[10px] font-mono font-bold uppercase">
                          Risk: {rec.deliveryRiskReduction}
                        </div>
                      )}
                    </div>

                    {/* Reasons list */}
                    <div className="p-3 bg-black/40 border border-white/5 space-y-1 font-mono text-[11px] text-white/50">
                      {rec.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[#FF3D00] font-bold">»</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => rejectRecommendation(rec.id)}
                        className="px-4 py-2 border border-white/20 text-white/60 hover:text-white text-xs uppercase tracking-wider font-bold transition cursor-pointer"
                      >
                        Dismiss
                      </button>

                      <button
                        id={`btn-approve-rec-${rec.id}`}
                        onClick={() => {
                          approveRecommendation(rec.id);
                          if (pendingRecs.length === 1) closeOptimizerModal();
                        }}
                        className="flex items-center gap-1.5 px-5 py-2 bg-white text-black hover:bg-[#FF3D00] text-xs font-black uppercase tracking-widest transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Authorize Shift</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
