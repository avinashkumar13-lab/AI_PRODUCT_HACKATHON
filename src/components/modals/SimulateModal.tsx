import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { simulateTaskAssignment, SimulationResult } from '../../utils/optimizerEngine';
import {
  X,
  Sliders,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export const SimulateModal: React.FC = () => {
  const {
    isSimulateModalOpen,
    closeSimulateModal,
    employees,
    tasks,
    settings,
    assignTask
  } = useApp();

  const activeTasks = tasks.filter((t) => t.status !== 'Completed');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || 'task_102');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || 'emp_rahul');

  if (!isSimulateModalOpen) return null;

  const simulation: SimulationResult = simulateTaskAssignment(
    selectedTaskId,
    selectedEmployeeId,
    employees,
    tasks,
    settings
  );

  const handleApplyAssignment = () => {
    assignTask(selectedTaskId, selectedEmployeeId);
    closeSimulateModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center text-black">
              <Sliders className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase font-display">
                  WHAT-IF SCENARIO SANDBOX
                </h2>
                <span className="px-2 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase font-mono tracking-widest">
                  SIMULATION
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5 font-light">
                Model assignment rebalancing in real time without altering production sprint schedules.
              </p>
            </div>
          </div>
          <button
            onClick={closeSimulateModal}
            className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Controls to pick task and employee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-2">
                SELECT TASK TO MODEL
              </label>
              <select
                id="simulate-select-task"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
              >
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-black text-white">
                    {t.taskNumber}: {t.title.toUpperCase()} ({t.estimatedHours}H)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-2">
                TARGET ENGINEER NODE
              </label>
              <select
                id="simulate-select-employee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-black text-white">
                    {emp.name.toUpperCase()} ({emp.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Simulation Outcome Card */}
          <div className="p-6 bg-white/[0.02] border border-white/10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/40">
                  SIMULATION HYPOTHESIS
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-display mt-0.5">
                  Assign "{simulation.taskTitle}" ({simulation.taskHours}H) → {simulation.employeeName}
                </h3>
              </div>

              <div className={`px-3 py-1 text-[10px] font-black uppercase font-mono tracking-widest ${
                simulation.verdict === 'RECOMMENDED'
                  ? 'bg-white text-black'
                  : simulation.verdict === 'CAUTION'
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#FF3D00] text-black'
              }`}>
                VERDICT: {simulation.verdict}
              </div>
            </div>

            {/* Side-by-side Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 bg-black/40 border border-white/10">
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Current Load</span>
                <p className="text-2xl font-black text-white mt-1 font-mono">{simulation.currentUtilization}%</p>
                <span className="text-[9px] font-mono text-white/40">{simulation.currentAssignedHours}H ASSIGNED</span>
              </div>

              <div className={`p-4 bg-black/40 border ${
                simulation.newUtilization > 90
                  ? 'border-[#FF3D00] border-l-4 border-l-[#FF3D00]'
                  : 'border-white/10'
              }`}>
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Simulated Load</span>
                <p className={`text-2xl font-black mt-1 font-mono ${
                  simulation.newUtilization > 90 ? 'text-[#FF3D00]' : 'text-white'
                }`}>
                  {simulation.newUtilization}%
                </p>
                <span className="text-[9px] font-mono text-white/40">{simulation.newAssignedHours}H TOTAL</span>
              </div>

              <div className="p-4 bg-black/40 border border-white/10">
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Predicted Duration</span>
                <p className="text-2xl font-black text-white mt-1 font-mono">
                  {simulation.estimatedWorkingDays}D
                </p>
                <span className="text-[9px] font-mono text-white/40">DUE: {simulation.targetDeadline}</span>
              </div>

              <div className={`p-4 bg-black/40 border ${
                simulation.riskAfter === 'Critical' || simulation.riskAfter === 'High'
                  ? 'border-[#FF3D00]'
                  : 'border-white/10'
              }`}>
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Predicted Risk</span>
                <p className={`text-2xl font-black mt-1 font-mono ${
                  simulation.riskAfter === 'Critical' || simulation.riskAfter === 'High'
                    ? 'text-[#FF3D00]'
                    : 'text-white'
                }`}>
                  {simulation.riskAfter.toUpperCase()}
                </p>
                <span className="text-[9px] font-mono text-white/40">COMPL: {simulation.predictedDeadline}</span>
              </div>
            </div>

            {/* AI Reasoning & Key Insights */}
            <div className="p-5 bg-black/40 border border-white/10 space-y-3">
              <p className="text-[10px] font-mono font-bold text-[#FF3D00] uppercase tracking-widest">
                AI CAPACITY ASSESSMENT:
              </p>
              <p className="text-xs font-mono text-white leading-relaxed">
                {simulation.recommendationReason}
              </p>

              <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs font-mono text-white/50">
                {simulation.keyInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#FF3D00]">»</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Action */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase text-white/40">
                Commit simulated changes to active board?
              </span>
              <button
                id="btn-simulate-apply-assignment"
                onClick={handleApplyAssignment}
                className="flex items-center gap-2 px-6 py-3 bg-[#FF3D00] hover:bg-[#ff5722] text-black text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#FF3D00]/20"
              >
                <UserCheck className="w-4 h-4 fill-black" />
                <span>Execute Assignment</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
