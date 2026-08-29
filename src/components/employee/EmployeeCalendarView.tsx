import React from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';

export const EmployeeCalendarView: React.FC = () => {
  const { currentUser, employees, tasks } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentUser.employeeId) || employees[1];
  const myTasks = tasks.filter((t) => t.assignedEmployeeId === currentEmployee.id);
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const getTasksForDay = (day: number) => {
    const dayStr = `2026-09-${day.toString().padStart(2, '0')}`;
    return myTasks.filter((t) => t.deadline === dayStr);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white tracking-tight">My Deliverable Calendar</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            September 2026
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          View your upcoming milestone deadlines, focus slots, and review dates.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl p-4 space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-600">Sat</div>
          <div className="text-slate-600">Sun</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isWeekend = (day + 1) % 7 === 0 || (day + 1) % 7 === 1;

            return (
              <div
                key={day}
                className={`min-h-[100px] p-2 rounded-xl border transition flex flex-col justify-between ${
                  dayTasks.length > 0
                    ? 'bg-slate-800/90 border-slate-700 shadow-md'
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
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>

                <div className="space-y-1 my-1 overflow-y-auto max-h-[70px]">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-medium truncate"
                    >
                      {task.taskNumber}: {task.title}
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-slate-500 text-right">
                  {dayTasks.length > 0 ? `${dayTasks.length} task due` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
