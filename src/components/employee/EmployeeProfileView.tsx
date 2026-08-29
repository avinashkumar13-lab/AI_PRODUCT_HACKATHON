import React from 'react';
import { useApp } from '../../context/AppContext';
import { User, Mail, Award, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

export const EmployeeProfileView: React.FC = () => {
  const { currentUser, employees } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentUser.employeeId) || employees[1];

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white tracking-tight">Engineering Profile & Skills</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            Verified Contributor
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Your skills, rating, and domain expertise used by TeamPilot's AI assignment matching engine.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={currentEmployee.avatar}
            alt={currentEmployee.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/60 shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-white">{currentEmployee.name}</h2>
            <p className="text-xs text-slate-300">{currentEmployee.role} • {currentEmployee.department}</p>
            <p className="text-xs text-slate-500 mt-0.5">{currentEmployee.email}</p>
          </div>
        </div>

        {/* Skill Tags */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Skill Matrix</span>
          <div className="flex flex-wrap gap-2">
            {currentEmployee.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Meta Stats */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Experience</span>
            <p className="font-bold text-slate-100 mt-0.5">{currentEmployee.experience}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Weekly Hours</span>
            <p className="font-bold text-slate-100 mt-0.5">{currentEmployee.weeklyCapacity}h</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Performance Rating</span>
            <p className="font-bold text-emerald-400 mt-0.5">{currentEmployee.performanceRating || 4.9} / 5.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};
