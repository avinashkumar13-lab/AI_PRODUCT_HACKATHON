import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, FolderPlus, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { EmptyStateOnboarding } from '../common/EmptyStateOnboarding';
import { CreateProjectModal } from '../modals/CreateProjectModal';

export const ProjectManagementView: React.FC = () => {
  const { projects, tasks, employees, openTaskDetailModal } = useApp();
  const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);

  if (projects.length === 0) {
    return <EmptyStateOnboarding type="projects" />;
  }

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

        <button
          onClick={() => setIsCreateProjOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 text-black text-xs font-black uppercase tracking-widest transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Project</span>
        </button>
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
                      {progressPercent}% ({completedTasks.length}/{projectTasks.length} tasks)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Team Members Avatars */}
                <div className="pt-2">
                  <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest block mb-2">Allocated Engineering Pod:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {assignedMembers.length > 0 ? (
                      assignedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 text-xs"
                        >
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-4 h-4 object-cover"
                          />
                          <span className="font-medium text-white/90">{member.name.split(' ')[0]}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-white/30 font-mono">No engineers assigned</span>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                {project.milestones && project.milestones.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest block">Target Milestones:</span>
                    <div className="space-y-1.5">
                      {project.milestones.map((ms) => (
                        <div key={ms.id} className="flex items-center justify-between text-xs font-mono p-2 bg-white/[0.02] border border-white/5">
                          <span className={ms.completed ? 'line-through text-white/30' : 'text-white/80'}>{ms.title}</span>
                          <span className="text-[10px] text-white/40">{ms.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks preview in project */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-[10px] text-white/40 font-mono">
                  Deadline: <span className="text-white font-bold">{project.deadline}</span>
                </div>
                <div className="text-[10px] text-white/40 font-mono">
                  Budget: <span className="text-white font-bold">{project.budgetHours} hrs</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CreateProjectModal
        isOpen={isCreateProjOpen}
        onClose={() => setIsCreateProjOpen(false)}
      />
    </div>
  );
};
