import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FolderPlus, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Priority, ProjectStatus } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject, employees } = useApp();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [client, setClient] = useState('Internal / Core Product');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [startDate, setStartDate] = useState('2026-08-29');
  const [deadline, setDeadline] = useState('2026-10-15');
  const [budgetHours, setBudgetHours] = useState(160);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('2026-09-15');
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; dueDate: string; completed: boolean }>>([
    { id: 'm1', title: 'Architecture & Schema Review', dueDate: '2026-09-05', completed: false },
    { id: 'm2', title: 'Core Implementation & Integration', dueDate: '2026-09-25', completed: false }
  ]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      const generatedKey = val
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      if (generatedKey) setKey(generatedKey);
    }
  };

  const toggleMember = (empId: string) => {
    if (selectedMembers.includes(empId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== empId));
    } else {
      setSelectedMembers([...selectedMembers, empId]);
    }
  };

  const handleAddMilestone = () => {
    if (milestoneTitle.trim()) {
      setMilestones([
        ...milestones,
        {
          id: `m_${Date.now()}`,
          title: milestoneTitle.trim(),
          dueDate: milestoneDate,
          completed: false
        }
      ]);
      setMilestoneTitle('');
    }
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    createProject({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      client: client.trim() || 'Enterprise Client',
      description: description.trim(),
      priority,
      startDate,
      deadline,
      status: 'On Track' as ProjectStatus,
      teamMemberIds: selectedMembers,
      taskIds: [],
      budgetHours: Number(budgetHours) || 120,
      spentHours: 0,
      milestones
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-white">
                Create Project
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-white/50">
                Setup new project roadmap & milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white border border-white/10 hover:border-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apex Core Platform Revamp"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Key Prefix *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="e.g. APX"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs font-mono placeholder:text-white/30 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Client / Stakeholder
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Fintech Global Corp"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none cursor-pointer"
              >
                <option value="Critical">Critical (P0)</option>
                <option value="High">High (P1)</option>
                <option value="Medium">Medium (P2)</option>
                <option value="Low">Low (P3)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key project deliverables and strategic objectives..."
              className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Target Deadline *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Budget (Hours)
              </label>
              <input
                type="number"
                min="10"
                value={budgetHours}
                onChange={(e) => setBudgetHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Assigned Team Members */}
          {employees.length > 0 && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1.5">
                Assign Team Members ({selectedMembers.length} assigned)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-black/60 border border-white/10">
                {employees.map((emp) => {
                  const isAssigned = selectedMembers.includes(emp.id);
                  return (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => toggleMember(emp.id)}
                      className={`flex items-center gap-2.5 p-1.5 border text-left transition cursor-pointer ${
                        isAssigned
                          ? 'border-[#FF3D00] bg-white/[0.05]'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={emp.avatar} alt={emp.name} className="w-6 h-6 object-cover border border-white/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                        <p className="text-[9px] text-white/40 truncate">{emp.role}</p>
                      </div>
                      {isAssigned && <Check className="w-3.5 h-3.5 text-[#FF3D00] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Milestones */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1.5">
              Project Milestones ({milestones.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF3D00]"></span>
                    <span className="font-medium text-white">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/40">Due {m.dueDate}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="text-white/40 hover:text-[#FF3D00]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="New milestone title..."
                className="flex-1 px-3 py-1.5 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
              <input
                type="date"
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
                className="w-36 px-2 py-1.5 bg-black border border-white/20 focus:border-white text-white text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 bg-white/10 hover:bg-white hover:text-black text-white text-xs uppercase font-bold transition cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-white/70 hover:text-white text-xs uppercase tracking-wider font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-white text-black hover:bg-[#FF3D00] hover:text-black text-xs uppercase tracking-wider font-black transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
