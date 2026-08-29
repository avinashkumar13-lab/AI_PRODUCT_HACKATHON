import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Flame
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { tasks, employees, projects, openTaskDetailModal } = useApp();

  const [currentMonth, setCurrentMonth] = useState('September 2026');

  // Days in September 2026 (Demo focus month)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const getTasksForDay = (day: number) => {
    const dayStr = `2026-09-${day.toString().padStart(2, '0')}`;
    return tasks.filter((t) => t.deadline === dayStr);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Team Delivery & Deadline Calendar</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              September 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize project delivery milestones, upcoming sprints, and engineer due dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="px-3 py-1 font-bold">{currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden p-4 space-y-4">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-600">Sat</div>
          <div className="text-slate-600">Sun</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isWeekend = (day + 1) % 7 === 0 || (day + 1) % 7 === 1;

            return (
              <div
                key={day}
                className={`min-h-[100px] p-2 rounded-xl border transition flex flex-col justify-between ${
                  dayTasks.length > 0
                    ? 'bg-slate-800/80 border-slate-700/80 shadow-md'
                    : isWeekend
                    ? 'bg-slate-950/40 border-slate-800/40 text-slate-600'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${dayTasks.length > 0 ? 'text-white' : ''}`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </div>

                {/* Day Tasks */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[70px]">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openTaskDetailModal(task)}
                      className={`p-1 rounded text-[10px] truncate cursor-pointer transition font-medium ${
                        task.priority === 'Critical'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {task.taskNumber}: {task.title}
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-slate-500 text-right">
                  {dayTasks.length > 0 ? `${dayTasks.length} due` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
