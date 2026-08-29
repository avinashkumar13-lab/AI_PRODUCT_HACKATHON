import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateEmployeeWorkload } from '../../utils/workloadEngine';
import {
  X,
  Mail,
  MapPin,
  Award,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

export const EmployeeDetailModal: React.FC = () => {
  const {
    isEmployeeDetailModalOpen,
    closeEmployeeDetailModal,
    selectedEmployeeForModal,
    tasks,
    settings,
    openSimulateModal,
    openTaskDetailModal
  } = useApp();

  if (!isEmployeeDetailModalOpen || !selectedEmployeeForModal) return null;

  const emp = selectedEmployeeForModal;
  const workload = calculateEmployeeWorkload(emp, tasks, settings);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-white text-black';
      case 'HEALTHY':
        return 'bg-white/10 text-white border border-white/20';
      case 'HIGH WORKLOAD':
        return 'bg-amber-500 text-black';
      case 'OVERLOADED':
      case 'CRITICAL':
        return 'bg-[#FF3D00] text-black font-black';
      default:
        return 'bg-white/10 text-white';
    }
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
            <img
              src={emp.avatar}
              alt={emp.name}
              className="w-14 h-14 object-cover border border-white/20"
            />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white uppercase tracking-tight font-display">{emp.name}</h2>
                <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase font-mono tracking-widest ${getStatusBadge(workload.status)}`}>
                  {workload.status}
                </span>
              </div>
              <p className="text-xs font-mono text-white/40 mt-0.5 uppercase">{emp.role} • {emp.department}</p>
            </div>
          </div>

          <button
            onClick={closeEmployeeDetailModal}
            className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Capacity Utilization Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-4 bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-white/40 font-bold tracking-wider">Weekly Cap</span>
              <p className="text-2xl font-black text-white mt-1">{workload.weeklyCapacity}H</p>
              <span className="text-[9px] text-white/40">8H / DAY</span>
            </div>

            <div className="p-4 bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-white/40 font-bold tracking-wider">Assigned</span>
              <p className="text-2xl font-black text-white mt-1">{workload.assignedHours}H</p>
              <span className="text-[9px] text-white/40">{workload.activeTasksCount} ACTIVE TASKS</span>
            </div>

            <div className="p-4 bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-white/40 font-bold tracking-wider">Bandwidth</span>
              <p className="text-2xl font-black text-white mt-1">{workload.availableHours}H</p>
              <span className="text-[9px] text-white/40">{(workload.availableHours / 5).toFixed(1)}H / DAY</span>
            </div>

            <div className={`p-4 border ${
              workload.utilization > 90
                ? 'bg-[#FF3D00]/10 border-[#FF3D00] border-l-4 border-l-[#FF3D00]'
                : 'bg-black/40 border-white/10'
            }`}>
              <span className="text-[9px] uppercase text-white/40 font-bold tracking-wider">Load Rate</span>
              <p className={`text-2xl font-black mt-1 ${
                workload.utilization > 90 ? 'text-[#FF3D00]' : 'text-white'
              }`}>
                {workload.utilization}%
              </p>
              <span className="text-[9px] text-white/40 font-bold uppercase">{workload.status}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase text-white/60 font-bold tracking-wider">Weekly Capacity Allocation</span>
              <span className="font-bold text-white">{workload.assignedHours} / {workload.weeklyCapacity}H ({workload.utilization}%)</span>
            </div>
            <div className="w-full h-2 bg-white/5 overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-500 ${
                  workload.utilization > 90
                    ? 'bg-[#FF3D00]'
                    : 'bg-white'
                }`}
                style={{ width: `${Math.min(100, workload.utilization)}%` }}
              ></div>
            </div>
          </div>

          {/* Contact & Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/[0.02] border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-2 text-white/70">
              <Mail className="w-4 h-4 text-white/40 shrink-0" />
              <span className="truncate">{emp.email}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4 text-white/40 shrink-0" />
              <span>{emp.location || 'SAN FRANCISCO, CA'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Award className="w-4 h-4 text-[#FF3D00] shrink-0" />
              <span>{emp.experience.toUpperCase()} • {emp.performanceRating || 4.9} RATING</span>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="space-y-2 font-mono">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Technical Skill Matrix</h4>
            <div className="flex flex-wrap gap-2">
              {emp.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 text-[10px] uppercase font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Assigned Active Tasks Table */}
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                ACTIVE DELIVERABLES ({workload.tasks.length})
              </h4>
              <button
                onClick={() => {
                  closeEmployeeDetailModal();
                  openSimulateModal();
                }}
                className="flex items-center gap-1.5 text-[10px] text-[#FF3D00] hover:text-white font-bold uppercase tracking-wider cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate Workload</span>
              </button>
            </div>

            {workload.tasks.length === 0 ? (
              <div className="p-6 bg-white/[0.02] border border-white/10 text-center text-xs text-white/40 uppercase">
                No active tasks assigned. Engineer is completely available.
              </div>
            ) : (
              <div className="divide-y divide-white/10 bg-white/[0.02] border border-white/10 overflow-hidden">
                {workload.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      closeEmployeeDetailModal();
                      openTaskDetailModal(task);
                    }}
                    className="p-4 hover:bg-white/[0.04] transition cursor-pointer flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#FF3D00]">{task.taskNumber}</span>
                        <span className="font-bold text-white uppercase">{task.title}</span>
                      </div>
                      <p className="text-[10px] text-white/40">
                        {task.estimatedHours}H EFFORT • DUE {task.deadline} • {task.progress}% DONE
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        task.priority === 'Critical' ? 'bg-[#FF3D00] text-black' : 'bg-white/10 text-white'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[9px] uppercase">
                        {task.status}
                      </span>
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
