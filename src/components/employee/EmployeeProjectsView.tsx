import React from 'react';
import { useApp } from '../../context/AppContext';
import { FolderKanban, CheckCircle2, Clock, Users } from 'lucide-react';

export const EmployeeProjectsView: React.FC = () => {
  const { currentUser, employees, projects, tasks } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentUser.employeeId) || employees[0];
  const myProjects = currentEmployee ? projects.filter((p) => p.teamMemberIds?.includes(currentEmployee.id)) : [];


  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white tracking-tight">My Active Project Portfolios</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            {myProjects.length} Projects
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Projects where you are currently contributing as an active engineering lead or contributor.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {myProjects.map((project) => {
          const myProjectTasks = tasks.filter(
            (t) => t.projectId === project.id && t.assignedEmployeeId === currentEmployee.id
          );

          return (
            <div
              key={project.id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-400 font-extrabold text-[10px]">
                      {project.key}
                    </span>
                    <h3 className="text-base font-bold text-white">{project.name}</h3>
                  </div>
                  <p className="text-slate-400 mt-1">{project.description}</p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                  {project.status}
                </span>
              </div>

              {/* My Assigned Tasks in this project */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  My Assigned Deliverables ({myProjectTasks.length})
                </span>
                <div className="space-y-1.5">
                  {myProjectTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-slate-200">
                      <span>{t.taskNumber}: {t.title}</span>
                      <span className="font-bold text-cyan-300">{t.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400">
                <span>Client: {project.client}</span>
                <span>Deadline: {project.deadline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
