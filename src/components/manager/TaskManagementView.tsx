import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, Priority } from '../../types';
import {
  Plus,
  Search,
  Kanban,
  List
} from 'lucide-react';
import { EmptyStateOnboarding } from '../common/EmptyStateOnboarding';

const STATUS_COLUMNS: TaskStatus[] = [
  'Backlog',
  'Assigned',
  'In Progress',
  'Review',
  'Blocked',
  'Completed'
];

export const TaskManagementView: React.FC = () => {
  const {
    tasks,
    projects,
    employees,
    openCreateTaskModal,
    openTaskDetailModal
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  if (tasks.length === 0) {
    return <EmptyStateOnboarding type="tasks" />;
  }

  const filteredTasks = tasks.filter((t) => {

    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.requiredSkills && t.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesProject = filterProject === 'ALL' || t.projectId === filterProject;
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;

    return matchesSearch && matchesProject && matchesPriority;
  });

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'Critical':
        return 'bg-[#FF3D00] text-black font-black';
      case 'High':
        return 'bg-white text-black font-bold';
      case 'Medium':
        return 'bg-white/10 text-white border border-white/20';
      case 'Low':
        return 'bg-white/5 text-white/60 border border-white/10';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter font-display">
              SPRINT KANBAN & DELIVERABLES
            </h1>
            <span className="px-2.5 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase font-mono tracking-widest">
              {tasks.length} NODES
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1 font-light">
            Real-time delivery execution, technical requirements, bandwidth tracking, and roadblock detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-white/[0.03] border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={openCreateTaskModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3D00] hover:bg-[#ff5722] text-black text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#FF3D00]/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH TASKS, IDs, SKILLS..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
          />
        </div>

        {/* Project Filter */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-4 py-2.5 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
        >
          <option value="ALL" className="bg-black text-white">ALL PROJECTS</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-black text-white">{p.name.toUpperCase()}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2.5 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
        >
          <option value="ALL" className="bg-black text-white">ALL PRIORITIES</option>
          <option value="Critical" className="bg-black text-white">CRITICAL</option>
          <option value="High" className="bg-black text-white">HIGH</option>
          <option value="Medium" className="bg-black text-white">MEDIUM</option>
          <option value="Low" className="bg-black text-white">LOW</option>
        </select>
      </div>

      {/* View 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {STATUS_COLUMNS.map((columnStatus) => {
            const columnTasks = filteredTasks.filter((t) => t.status === columnStatus);

            return (
              <div
                key={columnStatus}
                className="bg-white/[0.01] border border-white/10 flex flex-col p-3.5 space-y-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <span className="font-mono font-bold text-xs uppercase tracking-wider text-white">{columnStatus}</span>
                  <span className="px-2 py-0.5 bg-white/10 text-[9px] font-mono font-black text-white">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-2.5 overflow-y-auto flex-1">
                  {columnTasks.map((task) => {
                    const assignee = employees.find((e) => e.id === task.assignedEmployeeId);

                    return (
                      <div
                        key={task.id}
                        onClick={() => openTaskDetailModal(task)}
                        className="p-3.5 bg-[#0a0a0a] hover:bg-white/[0.04] border border-white/10 hover:border-white/30 transition cursor-pointer space-y-2.5 text-xs font-mono"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-[10px] text-[#FF3D00]">{task.taskNumber}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-xs line-clamp-2 leading-snug uppercase">
                          {task.title}
                        </h4>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-white/40">
                            <span>{task.estimatedHours}H EFFORT</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 overflow-hidden">
                            <div
                              className="bg-[#FF3D00] h-full"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Assignee & Due Date */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px]">
                          {assignee ? (
                            <div className="flex items-center gap-1.5 text-white/70">
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-4 h-4 object-cover border border-white/20"
                              />
                              <span className="truncate max-w-[70px] uppercase">{assignee.name.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <span className="text-white/40 font-bold uppercase">UNASSIGNED</span>
                          )}

                          <span className="text-white/40">{task.deadline.split('-').slice(1).join('/')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View 2: LIST VIEW */
        <div className="bg-white/[0.01] border border-white/10 overflow-hidden font-mono">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-white/60 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Task ID & Title</th>
                  <th className="py-3.5 px-3">Project</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Assignee</th>
                  <th className="py-3.5 px-3">Effort</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-3">Deadline</th>
                  <th className="py-3.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/70">
                {filteredTasks.map((task) => {
                  const assignee = employees.find((e) => e.id === task.assignedEmployeeId);
                  const project = projects.find((p) => p.id === task.projectId);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => openTaskDetailModal(task)}
                      className="hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#FF3D00]">{task.taskNumber}</span>
                          <span className="font-bold text-white uppercase">{task.title}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-white/40 uppercase">{project?.name}</td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 object-cover border border-white/20" />
                            <span className="text-white uppercase">{assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-white/40 font-bold uppercase">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-bold text-white">{task.estimatedHours}H</td>

                      <td className="py-3 px-4 min-w-[120px]">
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/40">{task.progress}%</span>
                          <div className="w-full bg-white/5 h-1 overflow-hidden">
                            <div className="bg-[#FF3D00] h-full" style={{ width: `${task.progress}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-white/40">{task.deadline}</td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] text-white/80 font-bold uppercase">
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
