import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useGmail } from '../../context/GmailContext';
import { TaskStatus, TaskComment, TaskAttachment } from '../../types';
import { calculateRealisticDeadline } from '../../utils/deadlineEngine';
import { analyzeTaskRisk } from '../../utils/riskEngine';
import {
  X,
  CheckSquare,
  ShieldAlert,
  Trash2,
  MessageSquare,
  Paperclip,
  Send,
  FileText,
  Clock,
  ExternalLink,
  Plus,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';

export const TaskDetailModal: React.FC = () => {
  const {
    isTaskDetailModalOpen,
    closeTaskDetailModal,
    selectedTaskForModal,
    employees,
    projects,
    tasks,
    currentUser,
    deleteTask,
    updateTaskProgress,
    updateTaskStatus,
    assignTask,
    updateTask
  } = useApp();

  const { openCompose } = useGmail();


  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'attachments'>('overview');
  const [newComment, setNewComment] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);

  if (!isTaskDetailModalOpen || !selectedTaskForModal) return null;

  const task = tasks.find((t) => t.id === selectedTaskForModal.id) || selectedTaskForModal;
  const project = projects.find((p) => p.id === task.projectId);
  const assignedEmp = employees.find((e) => e.id === task.assignedEmployeeId);
  const riskAnalysis = analyzeTaskRisk(task, employees, projects, tasks);

  const handleProgressChange = (newProgress: number) => {
    updateTaskProgress(task.id, newProgress);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
  };

  const handleAssigneeChange = (empId: string) => {
    assignTask(task.id, empId === 'unassigned' ? null : empId);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    closeTaskDetailModal();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj: TaskComment = {
      id: `comm_${Date.now()}`,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: newComment.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today'
    };

    const updatedComments = [...(task.comments || []), commentObj];
    updateTask(task.id, { comments: updatedComments });
    setNewComment('');
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentName.trim()) return;

    const attachmentObj: TaskAttachment = {
      id: `att_${Date.now()}`,
      name: attachmentName.trim(),
      size: '2.4 MB',
      type: attachmentName.includes('.') ? attachmentName.split('.').pop()?.toUpperCase() || 'FILE' : 'DOC',
      url: attachmentUrl.trim() || '#',
      uploadedAt: 'Just now'
    };

    const updatedAttachments = [...(task.attachments || []), attachmentObj];
    updateTask(task.id, { attachments: updatedAttachments });
    setAttachmentName('');
    setAttachmentUrl('');
    setIsAddingAttachment(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#080808] border border-white/20 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-white/[0.03] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center text-black">
              <CheckSquare className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-[#FF3D00]">{task.taskNumber}</span>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-widest ${
                  task.priority === 'Critical' ? 'bg-[#FF3D00] text-black' : 'bg-white/10 text-white'
                }`}>
                  {task.priority}
                </span>
                <span className="text-[10px] font-mono text-white/40 uppercase">• {project?.name || 'General Project'}</span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight font-display mt-0.5">{task.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {assignedEmp && (
              <button
                id="btn-task-email-assignee"
                type="button"
                onClick={() => {
                  closeTaskDetailModal();
                  openCompose({
                    to: assignedEmp.email,
                    subject: `Update on Task ${task.taskNumber}: ${task.title}`,
                    body: `Hi ${assignedEmp.name},\n\nI am sending a quick update regarding task [${task.taskNumber}] ${task.title}.\n\nDetails:\n- Priority: ${task.priority}\n- Estimated effort: ${task.estimatedHours}h (${task.progress}% completed)\n- Due date: ${task.deadline}\n\nPlease let me know if you encounter any blockers or need assistance.\n\nBest regards,\nTeam Pilot AI`,
                    mode: 'new'
                  });
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                title={`Email ${assignedEmp.name} regarding this task`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Email Assignee</span>
              </button>
            )}

            <button
              onClick={closeTaskDetailModal}
              className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-white/10 px-6 bg-black">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#FF3D00] text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Overview & Risk
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-[#FF3D00] text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({task.comments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'attachments'
                ? 'border-[#FF3D00] text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({task.attachments?.length || 0})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              {task.description && (
                <div className="p-4 bg-white/[0.02] border border-white/10 text-white/70 font-mono leading-relaxed">
                  {task.description}
                </div>
              )}

              {/* Quick Progress Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-white/60 uppercase tracking-widest">Progress Execution</span>
                  <span className="font-mono font-black text-white text-sm">{task.progress}% COMPLETED</span>
                </div>

                <div className="w-full bg-white/5 h-2 overflow-hidden border border-white/10">
                  <div
                    className="bg-[#FF3D00] h-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {[0, 25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleProgressChange(val)}
                      className={`flex-1 py-2 font-mono text-xs font-bold uppercase transition cursor-pointer ${
                        task.progress === val
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee & Status Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">
                    ASSIGNED ENGINEER
                  </label>
                  <select
                    value={task.assignedEmployeeId || 'unassigned'}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  >
                    <option value="unassigned" className="bg-black text-white">UNASSIGNED (BACKLOG)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-black text-white">
                        {emp.name.toUpperCase()} ({emp.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1.5">
                    WORKFLOW STATUS
                  </label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#FF3D00]"
                  >
                    <option value="Backlog" className="bg-black text-white">BACKLOG</option>
                    <option value="Assigned" className="bg-black text-white">ASSIGNED</option>
                    <option value="In Progress" className="bg-black text-white">IN PROGRESS</option>
                    <option value="Review" className="bg-black text-white">REVIEW</option>
                    <option value="Blocked" className="bg-black text-white">BLOCKED</option>
                    <option value="Completed" className="bg-black text-white">COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* Schedule & Effort Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/40 border border-white/10 text-center font-mono">
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Effort</span>
                  <p className="font-bold text-white mt-1 text-sm">{task.estimatedHours}H</p>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Remaining</span>
                  <p className="font-bold text-white mt-1 text-sm">
                    {(task.estimatedHours * (1 - task.progress / 100)).toFixed(1)}H
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Target Due</span>
                  <p className="font-bold text-white mt-1 text-sm">{task.deadline}</p>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Est. Finish</span>
                  <p className="font-bold text-[#FF3D00] mt-1 text-sm">
                    {assignedEmp ? calculateRealisticDeadline(task.estimatedHours * (1 - task.progress / 100), assignedEmp, tasks, '2026-08-29').recommendedDeadline : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Risk Engine Analysis Card */}
              <div className={`p-5 border space-y-3 ${
                riskAnalysis.riskLevel === 'Critical' || riskAnalysis.riskLevel === 'High'
                  ? 'bg-[#FF3D00]/10 border-[#FF3D00]'
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${
                      riskAnalysis.riskLevel === 'Critical' || riskAnalysis.riskLevel === 'High' ? 'text-[#FF3D00]' : 'text-white'
                    }`} />
                    <span className="font-mono font-bold text-white text-xs uppercase tracking-wider">
                      DELIVERY RISK: {riskAnalysis.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    {riskAnalysis.workingDaysLeft} WORK DAYS REMAINING
                  </span>
                </div>

                <p className="text-white/70 font-mono text-xs leading-relaxed">{riskAnalysis.details}</p>
                <div className="p-3 bg-black/60 border border-white/10 text-white font-mono text-xs">
                  <strong className="text-[#FF3D00]">RECOMMENDED ACTION:</strong> {riskAnalysis.recommendedAction}
                </div>
              </div>

              {/* Required Skills */}
              {task.requiredSkills && task.requiredSkills.length > 0 && (
                <div>
                  <span className="block font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    REQUIRED TECHNICAL SKILLS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {task.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/80 text-[10px] font-mono uppercase font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comments List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(!task.comments || task.comments.length === 0) ? (
                  <div className="py-8 text-center text-white/40 font-mono text-xs">
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  task.comments.map((comm) => (
                    <div key={comm.id} className="p-3.5 bg-white/[0.02] border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={comm.authorAvatar} alt={comm.authorName} className="w-5 h-5 object-cover border border-white/20" />
                          <span className="font-bold text-white text-xs">{comm.authorName}</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/40">{comm.createdAt}</span>
                      </div>
                      <p className="text-white/80 text-xs pl-7 leading-relaxed font-sans">{comm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a team update or blocker comment..."
                  className="flex-1 px-3 py-2.5 bg-black border border-white/20 focus:border-white text-white text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-white text-black hover:bg-[#FF3D00] hover:text-black font-black uppercase text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                  Attached Deliverables & Specs
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingAttachment(!isAddingAttachment)}
                  className="flex items-center gap-1 text-[10px] uppercase font-bold text-white hover:text-[#FF3D00] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach File / URL</span>
                </button>
              </div>

              {isAddingAttachment && (
                <form onSubmit={handleAddAttachment} className="p-3 bg-white/[0.03] border border-white/20 space-y-2">
                  <input
                    type="text"
                    required
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="File / Document name (e.g. architecture_diagram.png)"
                    className="w-full px-3 py-1.5 bg-black border border-white/20 text-white text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Link URL (optional)"
                    className="w-full px-3 py-1.5 bg-black border border-white/20 text-white text-xs outline-none"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingAttachment(false)}
                      className="px-3 py-1 border border-white/10 text-white/60 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-white text-black text-xs uppercase font-black"
                    >
                      Upload
                    </button>
                  </div>
                </form>
              )}

              {/* Attachments List */}
              <div className="space-y-2">
                {(!task.attachments || task.attachments.length === 0) ? (
                  <div className="py-8 text-center text-white/40 font-mono text-xs">
                    No files or links attached yet.
                  </div>
                ) : (
                  task.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 flex items-center justify-center font-mono font-bold text-[10px] text-white">
                          {att.type}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">{att.name}</p>
                          <span className="text-[9px] font-mono text-white/40">{att.size} • {att.uploadedAt}</span>
                        </div>
                      </div>
                      {att.url && att.url !== '#' && (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 border border-white/20 text-white/60 hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-white/40 hover:text-[#FF3D00] font-mono text-xs font-bold uppercase transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>DELETE TASK</span>
            </button>

            <button
              onClick={closeTaskDetailModal}
              className="px-6 py-2.5 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-widest transition cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

