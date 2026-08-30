import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'PostgreSQL',
  'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'Next.js', 'Tailwind CSS',
  'FastAPI', 'Redis', 'CI/CD', 'Security', 'Figma', 'System Design'
];

const DEPARTMENTS = [
  'Core Product Engineering',
  'Frontend Engineering',
  'Backend & Infrastructure',
  'Cloud & DevOps',
  'Data & AI Platform',
  'Product Design & UX',
  'Security & Compliance',
  'Mobile Engineering'
];

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
];

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ isOpen, onClose }) => {
  const { addEmployee } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Full Stack Developer');
  const [department, setDepartment] = useState('Core Product Engineering');
  const [experience, setExperience] = useState<'Junior' | 'Mid' | 'Senior' | 'Lead'>('Mid');
  const [weeklyCapacity, setWeeklyCapacity] = useState(40);
  const [location, setLocation] = useState('Remote');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customSkill.trim()) {
      e.preventDefault();
      if (!selectedSkills.includes(customSkill.trim())) {
        setSelectedSkills([...selectedSkills, customSkill.trim()]);
      }
      setCustomSkill('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addEmployee({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.trim(),
      department,
      skills: selectedSkills,
      experience,
      workingHoursPerDay: Math.round(weeklyCapacity / 5),
      weeklyCapacity: Number(weeklyCapacity) || 40,
      avatar: selectedAvatar,
      location: location.trim() || 'Remote',
      performanceRating: 4.8,
      completedTasksCount: 0
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-white">
                Add Team Member
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-white/50">
                Register engineer profile & capacity
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Role Title *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-black text-white">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Seniority Level
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value as any)}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none cursor-pointer"
              >
                <option value="Junior">Junior (0-2 yrs)</option>
                <option value="Mid">Mid-Level (2-5 yrs)</option>
                <option value="Senior">Senior (5-8 yrs)</option>
                <option value="Lead">Staff / Lead (8+ yrs)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Weekly Capacity (Hrs)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={weeklyCapacity}
                onChange={(e) => setWeeklyCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco / Remote"
                className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
          </div>

          {/* Avatar selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-white/60 mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {AVATAR_OPTIONS.map((avatarUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  className={`relative p-0.5 border transition cursor-pointer ${
                    selectedAvatar === avatarUrl ? 'border-[#FF3D00] ring-1 ring-[#FF3D00]' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={avatarUrl} alt="Avatar option" className="w-8 h-8 object-cover" />
                  {selectedAvatar === avatarUrl && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF3D00] text-black text-[8px] flex items-center justify-center font-black">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Tag Cloud */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase tracking-widest font-black text-white/60">
                Skills & Competencies ({selectedSkills.length} selected)
              </label>
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">
                Used by AI Ranking Engine
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-black/60 border border-white/10">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-2 py-0.5 text-[10px] font-mono transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-transparent text-white/60 border-white/10 hover:border-white/40'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={handleAddCustomSkill}
                placeholder="Type custom skill and press Enter..."
                className="flex-1 px-3 py-1.5 bg-black border border-white/20 focus:border-white text-white text-xs placeholder:text-white/30 outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
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
              <span>Create Team Member</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
