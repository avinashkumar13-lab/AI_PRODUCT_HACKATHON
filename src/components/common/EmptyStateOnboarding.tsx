import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Users,
  FolderPlus,
  CheckSquare,
  ArrowRight,
  Zap,
  Layers,
  Bot,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateOnboardingProps {
  type?: 'dashboard' | 'employees' | 'projects' | 'tasks';
}

export const EmptyStateOnboarding: React.FC<EmptyStateOnboardingProps> = ({ type = 'dashboard' }) => {
  const {
    employees,
    projects,
    tasks,
    currentUser,
    openCreateTaskModal,
    seedDemoData
  } = useApp();

  const [isCreateEmpOpen, setIsCreateEmpOpen] = React.useState(false);
  const [isCreateProjOpen, setIsCreateProjOpen] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);

  const hasEmployees = employees.length > 0;
  const hasProjects = projects.length > 0;
  const hasTasks = tasks.length > 0;

  const handleSeedTemplate = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white/[0.06] via-[#080808] to-black border border-white/20 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF3D00] rounded-full blur-[140px] opacity-10 pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase font-mono tracking-widest text-[#FF3D00] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#FF3D00]" />
            <span>Workspace Initialized</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tighter text-white leading-tight">
            Welcome to Team Pilot AI, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-white/60 text-sm sm:text-base mt-2 leading-relaxed font-light">
            Your dedicated workforce intelligence workspace is ready. Build your team, set up roadmaps, and let our Gemini-powered risk and workload engines optimize your delivery.
          </p>

          {/* Quick status counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8">
            <div className={`p-4 border transition ${hasEmployees ? 'border-white/40 bg-white/[0.03]' : 'border-white/10 bg-black/40'}`}>
              <div className="flex items-center justify-between">
                <Users className="w-4 h-4 text-white/60" />
                <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 ${hasEmployees ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}>
                  {employees.length} Active
                </span>
              </div>
              <p className="font-display font-black text-sm uppercase text-white mt-3">
                {hasEmployees ? `${employees.length} Team Members` : 'No Employees Yet'}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {hasEmployees ? 'Ready for task assignments' : 'Add developers, designers & leads'}
              </p>
            </div>

            <div className={`p-4 border transition ${hasProjects ? 'border-white/40 bg-white/[0.03]' : 'border-white/10 bg-black/40'}`}>
              <div className="flex items-center justify-between">
                <FolderPlus className="w-4 h-4 text-white/60" />
                <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 ${hasProjects ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}>
                  {projects.length} Active
                </span>
              </div>
              <p className="font-display font-black text-sm uppercase text-white mt-3">
                {hasProjects ? `${projects.length} Projects Tracked` : 'No Projects Yet'}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {hasProjects ? 'Roadmaps & milestones active' : 'Define scopes, deadlines & budgets'}
              </p>
            </div>

            <div className={`p-4 border transition ${hasTasks ? 'border-white/40 bg-white/[0.03]' : 'border-white/10 bg-black/40'}`}>
              <div className="flex items-center justify-between">
                <CheckSquare className="w-4 h-4 text-white/60" />
                <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 ${hasTasks ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}>
                  {tasks.length} Active
                </span>
              </div>
              <p className="font-display font-black text-sm uppercase text-white mt-3">
                {hasTasks ? `${tasks.length} Tasks Scheduled` : 'No Tasks Yet'}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {hasTasks ? 'AI workload tracking enabled' : 'Assign work with smart AI matching'}
              </p>
            </div>
          </div>

          {/* Step by Step Onboarding Plan */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-[10px] uppercase font-mono tracking-[0.3em] font-black text-white/40 mb-4">
              Step-by-Step Workspace Setup
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-4 border border-white/15 bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 bg-white text-black font-mono font-black text-xs flex items-center justify-center mb-3">
                    01
                  </span>
                  <h3 className="font-bold text-xs uppercase text-white tracking-tight">Add Team Members</h3>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                    Register employee profiles, skills, departments, and standard weekly capacities.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-onboarding-add-employee"
                  onClick={() => setIsCreateEmpOpen(true)}
                  className="mt-4 flex items-center justify-between py-1.5 px-3 bg-white/10 hover:bg-white hover:text-black text-white text-[10px] uppercase font-bold tracking-wider transition cursor-pointer"
                >
                  <span>Add First Member</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Step 2 */}
              <div className="p-4 border border-white/15 bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 bg-white text-black font-mono font-black text-xs flex items-center justify-center mb-3">
                    02
                  </span>
                  <h3 className="font-bold text-xs uppercase text-white tracking-tight">Create Projects</h3>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                    Set up project keys, milestone deadlines, and estimated budget hours.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-onboarding-create-project"
                  onClick={() => setIsCreateProjOpen(true)}
                  className="mt-4 flex items-center justify-between py-1.5 px-3 bg-white/10 hover:bg-white hover:text-black text-white text-[10px] uppercase font-bold tracking-wider transition cursor-pointer"
                >
                  <span>Create Project</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Step 3 */}
              <div className="p-4 border border-white/15 bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 bg-white text-black font-mono font-black text-xs flex items-center justify-center mb-3">
                    03
                  </span>
                  <h3 className="font-bold text-xs uppercase text-white tracking-tight">Assign & Optimize</h3>
                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                    Create tasks and let the Gemini AI Copilot suggest ideal assignees and detect bottlenecks.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-onboarding-create-task"
                  onClick={openCreateTaskModal}
                  className="mt-4 flex items-center justify-between py-1.5 px-3 bg-white/10 hover:bg-white hover:text-black text-white text-[10px] uppercase font-bold tracking-wider transition cursor-pointer"
                >
                  <span>Create Task</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Demo Template Seed Option */}
            <div className="mt-8 p-4 bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#FF3D00] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white uppercase">Want to explore with sample data?</p>
                  <p className="text-[10px] text-white/50">
                    Populate your empty workspace with 8 pre-configured engineering profiles, 4 projects, and 24 tasks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-onboarding-seed-demo"
                onClick={handleSeedTemplate}
                disabled={isSeeding}
                className="w-full sm:w-auto px-4 py-2 bg-white text-black hover:bg-[#FF3D00] hover:text-black text-xs uppercase font-black tracking-wider transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSeeding ? 'Loading Template...' : 'Load Starter Sample Data'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Render modals if triggered from onboarding */}
      {isCreateEmpOpen && (
        <CreateEmployeeModalWrapper isOpen={isCreateEmpOpen} onClose={() => setIsCreateEmpOpen(false)} />
      )}
      {isCreateProjOpen && (
        <CreateProjectModalWrapper isOpen={isCreateProjOpen} onClose={() => setIsCreateProjOpen(false)} />
      )}
    </div>
  );
};

// Lazy inline wrappers to prevent circular import loops
import { CreateEmployeeModal } from '../modals/CreateEmployeeModal';
import { CreateProjectModal } from '../modals/CreateProjectModal';

const CreateEmployeeModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return <CreateEmployeeModal isOpen={isOpen} onClose={onClose} />;
};

const CreateProjectModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return <CreateProjectModal isOpen={isOpen} onClose={onClose} />;
};
