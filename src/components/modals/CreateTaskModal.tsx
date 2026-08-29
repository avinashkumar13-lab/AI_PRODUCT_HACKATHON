import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Priority } from '../../types';
import { rankEmployeesForTask, EmployeeMatchScore } from '../../utils/rankingEngine';
import {
  X,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

const COMMON_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'FastAPI',
  'PostgreSQL',
  'Stripe',
  'API integration',
  'Docker',
  'Kubernetes',
  'AWS',
  'Terraform',
  'GraphQL',
  'Figma',
  'Design Systems',
  'Playwright',
  'Cypress',
  'CI/CD',
  'SQL',
  'Kafka'
];

export const CreateTaskModal: React.FC = () => {
  const {
    isCreateTaskModalOpen,
    closeCreateTaskModal,
    projects,
    employees,
    tasks,
    settings,
    createTask
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj_apex');
  const [priority, setPriority] = useState<Priority>('High');
  const [estimatedHours, setEstimatedHours] = useState<number>(18);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Node.js', 'Stripe', 'API integration']);
  const [selectedDependencies] = useState<string[]>([]);
  const [preferredEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState('2026-08-29');
  const [deadline, setDeadline] = useState('2026-09-15');

  // AI Recommendation State
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [aiRankings, setAiRankings] = useState<EmployeeMatchScore[]>([]);
  const [selectedRankedAssignee, setSelectedRankedAssignee] = useState<EmployeeMatchScore | null>(null);

  if (!isCreateTaskModalOpen) return null;

  const toggleSkill = (skill: string) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills(requiredSkills.filter((s) => s !== skill));
    } else {
      setRequiredSkills([...requiredSkills, skill]);
    }
  };

  const handleRunAIRecommendation = () => {
    const draftTask = {
      title,
      description,
      projectId,
      priority,
      estimatedHours,
      requiredSkills,
      startDate,
      deadline
    };

    const rankings = rankEmployeesForTask(draftTask, employees, tasks, projects, settings);
    setAiRankings(rankings);
    setSelectedRankedAssignee(rankings[0] || null);
    setShowAIRecommendation(true);
  };

  const handleCreateWithAssignee = (assigneeId: string | null) => {
    createTask(
      {
        title: title || 'New Task',
        description,
        projectId,
        priority,
        estimatedHours: Number(estimatedHours) || 8,
        requiredSkills,
        dependencies: selectedDependencies,
        preferredEmployeeId: preferredEmployeeId || null,
        startDate,
        deadline,
        status: assigneeId ? 'Assigned' : 'Backlog'
      },
      assigneeId
    );

    setShowAIRecommendation(false);
    closeCreateTaskModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF3D00] flex items-center justify-center text-black">
              <Sparkles className="w-6 h-6 fill-black stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white tracking-tighter uppercase font-display">
                  CREATE NEW SPRINT TASK
                </h2>
                <span className="px-2 py-0.5 bg-white/10 text-white text-[9px] font-black uppercase font-mono tracking-widest">
                  AUTHORING
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5 font-light">
                Define deliverable scope with automated capacity evaluation and smart engineer routing.
              </p>
            </div>
          </div>
          <button
            onClick={closeCreateTaskModal}
            className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {!showAIRecommendation ? (
            /* STEP 1: Task Form */
            <div className="space-y-5">
              {/* Title & Project */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">
                    TASK TITLE <span className="text-[#FF3D00]">*</span>
                  </label>
                  <input
                    id="input-task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. BUILD PAYMENT GATEWAY"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">PROJECT</label>
                  <select
                    id="select-task-project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id} className="bg-black text-white">
                        {proj.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">TECHNICAL SPECIFICATION</label>
                <textarea
                  id="input-task-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Provide technical specifications, acceptance criteria, or external API requirements..."
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                />
              </div>

              {/* Priority, Estimated Effort, Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">PRIORITY</label>
                  <select
                    id="select-task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  >
                    <option value="Critical" className="bg-black text-white">CRITICAL</option>
                    <option value="High" className="bg-black text-white">HIGH</option>
                    <option value="Medium" className="bg-black text-white">MEDIUM</option>
                    <option value="Low" className="bg-black text-white">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">
                    EFFORT (HOURS)
                  </label>
                  <div className="relative">
                    <input
                      id="input-task-effort"
                      type="number"
                      min={1}
                      max={120}
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                    />
                    <Clock className="w-4 h-4 text-white/40 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">START DATE</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">DEADLINE</label>
                  <input
                    id="input-task-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  />
                </div>
              </div>

              {/* Required Skills Selection */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-2">
                  REQUIRED TECHNICAL SKILLS
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] border border-white/10 max-h-36 overflow-y-auto">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = requiredSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF3D00] text-black shadow-sm'
                            : 'bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/30'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Choice */}
              <div className="p-6 bg-white/[0.02] border border-white/10 border-l-4 border-l-[#FF3D00] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#FF3D00]" />
                    <span className="font-bold text-sm text-white uppercase tracking-tight font-display">
                      Smart Assignment Engine
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                    AUTOMATIC CAPACITY MATCHING
                  </span>
                </div>

                <p className="text-xs text-white/40 leading-relaxed font-light">
                  Let AI analyze real-time engineer capacity, skill profiles, and sprint safety to recommend the optimal assignee.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    id="btn-ai-recommend-employee"
                    type="button"
                    onClick={handleRunAIRecommendation}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#FF3D00]/20"
                  >
                    <Sparkles className="w-4 h-4 fill-black" />
                    <span>Run AI Engineer Recommender</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateWithAssignee(null)}
                    className="py-3 px-5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Save Unassigned
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: AI Recommendation & Ranking View */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF3D00]" />
                    <h3 className="font-black text-base text-white uppercase tracking-tight font-display">
                      AI Candidate Ranking & Assignment
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-white/40 mt-0.5">
                    Analyzing task: <strong className="text-white uppercase">{title || 'New Task'}</strong> ({estimatedHours}H, {requiredSkills.join(', ')})
                  </p>
                </div>

                <button
                  onClick={() => setShowAIRecommendation(false)}
                  className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] hover:text-white font-bold cursor-pointer"
                >
                  ← Edit Task Specs
                </button>
              </div>

              {/* Top Ranked Candidate Featured Card */}
              {selectedRankedAssignee && (
                <div className="p-6 bg-white/[0.02] border border-white/20 border-l-4 border-l-white space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedRankedAssignee.employee.avatar}
                        alt={selectedRankedAssignee.employee.name}
                        className="w-14 h-14 object-cover border border-white/20"
                      />
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg text-white uppercase tracking-tight">{selectedRankedAssignee.employee.name}</h4>
                          <span className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase font-mono tracking-widest">
                            TOP MATCH
                          </span>
                        </div>
                        <p className="text-xs font-mono text-white/40 mt-0.5">{selectedRankedAssignee.employee.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-black font-mono text-white">
                        {selectedRankedAssignee.totalScore}
                        <span className="text-sm text-white/40 font-normal">/100</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-white/40">MATCH SCORE</span>
                    </div>
                  </div>

                  {/* Why Reasons Breakdown */}
                  <div className="space-y-2 pt-3 border-t border-white/10 font-mono text-xs text-white/60">
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                      RECOMMENDATION RATIONALE:
                    </p>
                    <ul className="space-y-1.5">
                      {selectedRankedAssignee.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#FF3D00] font-bold">»</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Realistic Completion Calculation Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/40 border border-white/10 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Effort</span>
                      <p className="font-bold text-sm text-white">{estimatedHours}H</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Bandwidth</span>
                      <p className="font-bold text-sm text-white">
                        {(selectedRankedAssignee.availableHours / 5).toFixed(1)}H/DAY
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Duration</span>
                      <p className="font-bold text-sm text-white">
                        {selectedRankedAssignee.estimatedWorkingDays} DAYS
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase">Est. Finish</span>
                      <p className="font-bold text-sm text-[#FF3D00]">{selectedRankedAssignee.predictedDeadline}</p>
                    </div>
                  </div>

                  {/* Manager Approval Interaction */}
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-3">
                      <button
                        id="btn-approve-task-assignment"
                        onClick={() => handleCreateWithAssignee(selectedRankedAssignee.employee.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-lg shadow-[#FF3D00]/20"
                      >
                        <UserCheck className="w-4 h-4 fill-black" />
                        <span>Authorize Assignment to {selectedRankedAssignee.employee.name.split(' ')[0].toUpperCase()}</span>
                      </button>

                      <button
                        onClick={() => handleCreateWithAssignee(null)}
                        className="py-3 px-5 border border-white/20 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Save Unassigned
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Ranked Candidates */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
                  ALTERNATIVE CANDIDATES RANKED BY AI:
                </p>
                <div className="space-y-2">
                  {aiRankings.slice(1, 4).map((match) => (
                    <div
                      key={match.employee.id}
                      onClick={() => setSelectedRankedAssignee(match)}
                      className={`p-4 border cursor-pointer transition flex items-center justify-between ${
                        selectedRankedAssignee?.employee.id === match.employee.id
                          ? 'bg-white/[0.06] border-white'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={match.employee.avatar}
                          alt={match.employee.name}
                          className="w-10 h-10 object-cover border border-white/20"
                        />
                        <div>
                          <p className="font-bold text-xs text-white uppercase">{match.employee.name}</p>
                          <p className="text-[10px] font-mono text-white/40">
                            {match.employee.role} • {match.availableHours}H FREE ({match.utilization}% LOAD)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right font-mono">
                          <span className="font-black text-sm text-white">{match.totalScore}/100</span>
                          <p className="text-[9px] text-white/40">{match.estimatedWorkingDays} DAYS</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateWithAssignee(match.employee.id);
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white hover:text-black text-[10px] font-mono font-bold uppercase text-white transition cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
