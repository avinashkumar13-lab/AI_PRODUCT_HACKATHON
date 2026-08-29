import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Flame,
  X
} from 'lucide-react';
import { calculateEmployeeWorkload } from '../../utils/workloadEngine';

export const TeamView: React.FC = () => {
  const {
    employees,
    tasks,
    settings,
    openEmployeeDetailModal,
    addEmployee
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Senior Full Stack Engineer');
  const [newEmpSkills, setNewEmpSkills] = useState('React, TypeScript, Node.js, AWS');
  const [newEmpCapacity, setNewEmpCapacity] = useState(40);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    addEmployee({
      name: newEmpName,
      role: newEmpRole,
      skills: newEmpSkills.split(',').map((s) => s.trim()),
      weeklyCapacity: Number(newEmpCapacity) || 40,
      workingHoursPerDay: 8,
      experience: 'Senior'
    });

    setNewEmpName('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter font-display">
              ENGINEERING TEAM DIRECTORY
            </h1>
            <span className="px-2.5 py-0.5 bg-[#FF3D00] text-black text-[9px] font-black uppercase font-mono tracking-widest">
              {employees.length} ENGINEERS ACTIVE
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1 font-light">
            Manage engineering talent, skill sets, working hours, and capacity availability.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 text-black text-xs font-black uppercase tracking-widest transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white/[0.02] border border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH BY ENGINEER NAME, ROLE, OR SKILL..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
          />
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredEmployees.map((emp) => {
          const workload = calculateEmployeeWorkload(emp, tasks, settings);

          return (
            <div
              key={emp.id}
              onClick={() => openEmployeeDetailModal(emp)}
              className="p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/30 transition cursor-pointer space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-12 h-12 object-cover border border-white/20"
                  />
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase font-mono tracking-widest ${
                    workload.utilization >= 90
                      ? 'bg-[#FF3D00] text-black'
                      : workload.utilization >= 75
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white'
                  }`}>
                    {workload.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white uppercase flex items-center gap-1.5 font-display">
                    {emp.name}
                    {workload.utilization >= 85 && (
                      <Flame className="w-3.5 h-3.5 text-[#FF3D00]" />
                    )}
                  </h3>
                  <p className="text-xs font-mono text-white/40 uppercase">{emp.role}</p>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 font-mono">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40 uppercase">Load ({workload.assignedHours}H)</span>
                    <span className={`font-black ${
                      workload.utilization >= 90 ? 'text-[#FF3D00]' : 'text-white'
                    }`}>
                      {workload.utilization}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        workload.utilization >= 90
                          ? 'bg-[#FF3D00]'
                          : 'bg-white'
                      }`}
                      style={{ width: `${Math.min(100, workload.utilization)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Skill Tags */}
                <div className="flex flex-wrap gap-1 font-mono">
                  {emp.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-bold text-white/70 uppercase"
                    >
                      {s}
                    </span>
                  ))}
                  {emp.skills.length > 3 && (
                    <span className="text-[9px] text-white/40">+{emp.skills.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-white/40 text-[10px] uppercase">{workload.activeTasksCount} ACTIVE</span>
                <span className="font-bold text-[#FF3D00] text-[10px]">{workload.availableHours}H FREE</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#080808] border border-white/20 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-black text-sm uppercase tracking-tight text-white font-display">Add New Team Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 border border-white/10 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-white/60 uppercase tracking-widest text-[10px] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FF3D00]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-white/60 uppercase tracking-widest text-[10px] mb-1.5">Engineering Role</label>
                <input
                  type="text"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FF3D00]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-white/60 uppercase tracking-widest text-[10px] mb-1.5">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newEmpSkills}
                  onChange={(e) => setNewEmpSkills(e.target.value)}
                  placeholder="React, Node.js, GraphQL, PostgreSQL"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FF3D00]"
                />
              </div>

              <div>
                <label className="block font-bold text-white/60 uppercase tracking-widest text-[10px] mb-1.5">Weekly Capacity (Hours)</label>
                <input
                  type="number"
                  value={newEmpCapacity}
                  onChange={(e) => setNewEmpCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FF3D00]"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-white/40 hover:text-white font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black uppercase tracking-widest transition"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
