import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskStatus } from '../../types';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';

export const EmployeeTasksView: React.FC = () => {
  const {
    currentUser,
    employees,
    tasks,
    projects,
    updateTaskProgress,
    updateTaskStatus,
    openTaskDetailModal
  } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentUser.employeeId) || employees[0];
  const myTasks = currentEmployee ? tasks.filter((t) => t.assignedEmployeeId === currentEmployee.id) : [];


  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">My Assigned Deliverables</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              {myTasks.length} Assigned Tasks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Update task progress in real time to keep delivery intelligence and capacity engines synchronized.
          </p>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {myTasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No active tasks assigned</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your backlog is clear. Manager or AI assignment engine will assign upcoming sprint deliverables here.
            </p>
          </div>
        ) : (
          myTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-400">{task.taskNumber}</span>
                      <span className="text-xs text-slate-400">• {project?.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">Target Deadline</span>
                    <p className="font-bold text-sm text-emerald-400">{task.deadline}</p>
                  </div>
                </div>

                {/* Progress Controls */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Completion Status</span>
                    <span className="font-extrabold text-slate-100 text-sm">{task.progress}%</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateTaskProgress(task.id, val)}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition text-xs ${
                          task.progress === val
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Meta & Inspect */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Effort: <strong className="text-slate-200">{task.estimatedHours}h</strong></span>
                    <span>Remaining: <strong className="text-cyan-300">{(task.estimatedHours * (1 - task.progress / 100)).toFixed(1)}h</strong></span>
                    <span>Status: <strong className="text-slate-200">{task.status}</strong></span>
                  </div>

                  <button
                    onClick={() => openTaskDetailModal(task)}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    View Task Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
