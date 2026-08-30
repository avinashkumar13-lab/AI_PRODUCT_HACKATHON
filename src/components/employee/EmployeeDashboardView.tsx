import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateEmployeeWorkload } from '../../utils/workloadEngine';
import {
  CheckSquare,
  Clock,
  Gauge,
  Calendar,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Flame,
  UserCheck
} from 'lucide-react';

export const EmployeeDashboardView: React.FC = () => {
  const {
    currentUser,
    employees,
    tasks,
    projects,
    settings,
    updateTaskProgress,
    openTaskDetailModal,
    setActiveTab
  } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentUser.employeeId) || employees[0] || {
    id: 'emp_default',
    name: currentUser.name || 'Team Member',
    email: currentUser.email || 'employee@teampilot.ai',
    role: currentUser.title || 'Software Engineer',
    department: 'Engineering',
    skills: ['React', 'TypeScript', 'Node.js'],
    experience: 'Senior' as const,
    workingHoursPerDay: 8,
    weeklyCapacity: 40,
    avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    performanceRating: 4.9,
    completedTasksCount: 0
  };
  const workload = calculateEmployeeWorkload(currentEmployee, tasks, settings);
  const myTasks = tasks.filter((t) => t.assignedEmployeeId === currentEmployee.id);
  const activeTasks = myTasks.filter((t) => t.status !== 'Completed');


  // AI Generated Daily Schedule State
  const [dailySchedule, setDailySchedule] = useState<any[]>([
    {
      id: 'slot_1',
      timeSlot: '09:00 AM – 10:30 AM',
      taskTitle: activeTasks[0]?.title || 'Sprint Standup & Architecture Sync',
      priority: activeTasks[0]?.priority || 'Critical',
      category: 'Deep Work'
    },
    {
      id: 'slot_2',
      timeSlot: '10:45 AM – 12:45 PM',
      taskTitle: activeTasks[0]?.title || 'Core Implementation & Unit Testing',
      priority: activeTasks[0]?.priority || 'High',
      category: 'Core Coding'
    },
    {
      id: 'slot_3',
      timeSlot: '01:30 PM – 03:30 PM',
      taskTitle: activeTasks[1]?.title || 'API Integration & Code Review',
      priority: activeTasks[1]?.priority || 'Medium',
      category: 'Integration'
    },
    {
      id: 'slot_4',
      timeSlot: '03:45 PM – 05:00 PM',
      taskTitle: 'PR Reviews & Deliverable Documentation',
      priority: 'Low',
      category: 'Wrap-up'
    }
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Employee Greeting Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentEmployee.avatar}
            alt={currentEmployee.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400/80 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                Engineering Portal
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Personal Work Horizon</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Welcome back, {currentEmployee.name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-slate-300">
              {currentEmployee.role} • {workload.status === 'AVAILABLE' ? '🟢 Available Bandwidth' : workload.status}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('ai_assistant')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition active:scale-95"
        >
          <Bot className="w-4 h-4 text-cyan-300" />
          <span>Ask AI Personal Assistant</span>
        </button>
      </div>

      {/* Personal Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">My Active Tasks</span>
          <p className="text-2xl font-black text-white">{activeTasks.length}</p>
          <span className="text-[11px] text-slate-400">{myTasks.length} assigned total</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Weekly Hours</span>
          <p className="text-2xl font-black text-indigo-300">{workload.assignedHours}h</p>
          <span className="text-[11px] text-slate-400">of 40h capacity</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Available Bandwidth</span>
          <p className="text-2xl font-black text-emerald-400">{workload.availableHours}h</p>
          <span className="text-[11px] text-emerald-300">{(workload.availableHours / 5).toFixed(1)}h / day free</span>
        </div>

        <div className={`p-4 rounded-xl border space-y-1 ${
          workload.utilization > 90
            ? 'bg-rose-950/30 border-rose-500/50'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-slate-400 uppercase">Personal Workload</span>
          <p className={`text-2xl font-black ${
            workload.utilization > 90 ? 'text-rose-400' : 'text-slate-100'
          }`}>
            {workload.utilization}%
          </p>
          <span className="text-[11px] text-slate-400 font-semibold">{workload.status}</span>
        </div>
      </div>

      {/* Main Row: Today's AI Schedule & Active Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Daily Focus Schedule */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">AI-Optimized Daily Focus Plan</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-Sequenced for Peak Flow</span>
          </div>

          <div className="space-y-3">
            {dailySchedule.map((slot, idx) => (
              <div
                key={slot.id || idx}
                className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-cyan-300 text-[11px] font-bold shrink-0">
                    {slot.timeSlot}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-100">{slot.taskTitle}</p>
                    <span className="text-[10px] text-slate-400">{slot.category}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  slot.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {slot.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables Due Soon */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">My Active Deliverables</h2>
            <span className="text-xs text-blue-400 font-semibold">{activeTasks.length} Tasks</span>
          </div>

          <div className="space-y-3">
            {activeTasks.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-800/40 text-center text-xs text-slate-400">
                🎉 No active deliverables right now. You're all caught up!
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => openTaskDetailModal(task)}
                  className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">{task.taskNumber}</span>
                    <span className="text-[10px] text-slate-400">Due {task.deadline}</span>
                  </div>

                  <p className="font-semibold text-slate-200">{task.title}</p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{task.estimatedHours}h effort</span>
                      <span className="font-bold text-emerald-400">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
