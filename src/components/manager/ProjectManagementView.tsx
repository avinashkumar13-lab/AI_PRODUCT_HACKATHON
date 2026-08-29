import React from 'react';
import { useApp } from '../../context/AppContext';

export const ProjectManagementView: React.FC = () => {
  const { projects, tasks, employees, openTaskDetailModal } = useApp();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter font-display">
              ACTIVE PROJECTS & MILESTONES
            </h1>
            <span className="px-2.5 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase font-mono tracking-widest">
              {projects.length} PORTFOLIOS
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1 font-light">
            Track multi-project resource allocation, budget consumption, and deliverable commitments.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const completedTasks = projectTasks.filter((t) => t.status === 'Completed');
          const progressPercent = projectTasks.length > 0
            ? Math.round((completedTasks.length / projectTasks.length) * 100)
            : 0;

          const assignedMembers = employees.filter((e) =>
            project.teamMemberIds?.includes(e.id)
          );

          return (
            <div
              key={project.id}
              className="p-6 bg-white/[0.02] border border-white/10 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#FF3D00] text-black font-mono font-black text-[10px] uppercase">
                        {project.key}
                      </span>
                      <h2 className="text-lg font-black text-white uppercase tracking-tight font-display">{project.name}</h2>
                    </div>
                    <p className="text-xs text-white/40 mt-1 font-light">{project.description}</p>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-widest ${
                    project.status === 'At Risk'
                      ? 'bg-[#FF3D00] text-black'
                      : 'bg-white text-black'
                  }`}>
                    {project.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Milestone Execution</span>
                    <span className="font-bold text-white">
                      {completedTasks.length} / {projectTasks.length} TASKS ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 overflow-hidden">
                    <div
                      className="bg-[#FF3D00] h-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-black/40 border border-white/10 text-center font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-white/40 uppercase">Budget</span>
                    <p className="font-bold text-white mt-0.5 text-sm">{project.budgetHours}H</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase">Client</span>
                    <p className="font-bold text-white mt-0.5 text-sm uppercase">{project.client}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase">Deadline</span>
                    <p className="font-bold text-[#FF3D00] mt-0.5 text-sm">{project.deadline}</p>
                  </div>
                </div>

                {/* Key Deliverables Sample */}
                <div className="space-y-2 text-xs font-mono">
                  <p className="font-bold text-white/40 uppercase tracking-widest text-[9px]">
                    ACTIVE DELIVERABLES ({projectTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {projectTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openTaskDetailModal(t)}
                        className="p-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 cursor-pointer transition flex items-center justify-between"
                      >
                        <span className="font-medium text-white/80 uppercase truncate max-w-[240px]">
                          {t.taskNumber}: {t.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#FF3D00]">{t.estimatedHours}H</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Members Allocation */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {assignedMembers.map((m) => (
                      <img
                        key={m.id}
                        src={m.avatar}
                        alt={m.name}
                        title={`${m.name} (${m.role})`}
                        className="w-7 h-7 object-cover border border-white/20"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/40 uppercase">
                    {assignedMembers.length} ENGINEERS
                  </span>
                </div>

                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">{project.priority} PRIORITY</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
