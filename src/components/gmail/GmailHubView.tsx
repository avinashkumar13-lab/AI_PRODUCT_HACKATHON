import React, { useState } from 'react';
import { useGmail, GmailFolder } from '../../context/GmailContext';
import { useApp } from '../../context/AppContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { ComposeEmailModal } from './ComposeEmailModal';
import {
  Mail,
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  ArrowLeft,
  Reply,
  Forward,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  CheckSquare,
  Zap,
  ExternalLink,
  Shield,
  Layers,
  LogOut,
  MailCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GmailHubView: React.FC = () => {
  const {
    isGmailConnected,
    needsGoogleAuth,
    isConnecting,
    googleUser,
    gmailProfile,
    messages,
    selectedMessage,
    currentFolder,
    searchQuery,
    isLoadingMessages,
    unreadCount,
    errorMessage,
    connectGmail,
    disconnectGmail,
    refreshInbox,
    selectMessage,
    setCurrentFolder,
    setSearchQuery,
    toggleStar,
    toggleReadStatus,
    deleteEmail,
    openCompose,
    clearError
  } = useGmail();

  const { createTask, employees, projects, triggerCelebration } = useApp();

  // Local states
  const [isConvertingToTask, setIsConvertingToTask] = useState(false);
  const [extractedTaskPreview, setExtractedTaskPreview] = useState<any | null>(null);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);

  // Confirmation Modal states
  const [showTrashConfirmation, setShowTrashConfirmation] = useState(false);
  const [messageToTrash, setMessageToTrash] = useState<string | null>(null);
  const [showDisconnectConfirmation, setShowDisconnectConfirmation] = useState(false);

  // Folder configuration
  const folders: Array<{ id: GmailFolder; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'INBOX', label: 'Inbox', icon: Inbox },
    { id: 'STARRED', label: 'Starred', icon: Star },
    { id: 'SENT', label: 'Sent', icon: Send },
    { id: 'DRAFTS', label: 'Drafts', icon: FileText },
    { id: 'TRASH', label: 'Trash', icon: Trash2 }
  ];

  // Convert Email to Task using AI backend
  const handleConvertEmailToTask = async () => {
    if (!selectedMessage) return;

    setIsConvertingToTask(true);
    try {
      const res = await fetch('/api/gemini/email-to-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: selectedMessage.subject,
          emailBody: selectedMessage.bodyText || selectedMessage.snippet,
          emailFrom: selectedMessage.from,
          employees,
          projects
        })
      });

      if (!res.ok) {
        throw new Error('Failed to parse email into task.');
      }

      const taskData = await res.json();
      setExtractedTaskPreview(taskData);
    } catch (err: any) {
      console.error('Email to task conversion error:', err);
      // Fallback
      setExtractedTaskPreview({
        title: selectedMessage.subject.replace(/^(Re|Fwd):\s*/i, ''),
        description: `Imported from Gmail message from ${selectedMessage.from}.\n\nContent snippet: ${selectedMessage.snippet}`,
        priority: 'High',
        estimatedHours: 8,
        requiredSkills: ['Backend', 'Engineering'],
        suggestedProjectId: projects[0]?.id || 'proj_alpha',
        suggestedEmployeeId: employees[0]?.id || null,
        deadlineDaysFromNow: 5
      });
    } finally {
      setIsConvertingToTask(false);
    }
  };

  // Commit extracted task into Team Pilot
  const handleSaveExtractedTask = () => {
    if (!extractedTaskPreview) return;

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (extractedTaskPreview.deadlineDaysFromNow || 5));
    const deadlineString = deadlineDate.toISOString().split('T')[0];

    createTask(
      {
        title: extractedTaskPreview.title,
        description: extractedTaskPreview.description,
        priority: extractedTaskPreview.priority || 'High',
        estimatedHours: extractedTaskPreview.estimatedHours || 8,
        requiredSkills: extractedTaskPreview.requiredSkills || ['Full Stack'],
        projectId: extractedTaskPreview.suggestedProjectId || projects[0]?.id || 'proj_alpha',
        deadline: deadlineString,
        status: extractedTaskPreview.suggestedEmployeeId ? 'Assigned' : 'Backlog'
      },
      extractedTaskPreview.suggestedEmployeeId
    );

    triggerCelebration();
    setExtractedTaskPreview(null);
  };

  // Quick Reply handler
  const handleSendQuickReply = async () => {
    if (!selectedMessage || !quickReplyText.trim()) return;

    setIsSendingQuickReply(true);
    try {
      openCompose({
        to: selectedMessage.from,
        subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
        body: quickReplyText,
        threadId: selectedMessage.threadId,
        inReplyTo: selectedMessage.id,
        mode: 'reply'
      });
      setQuickReplyText('');
    } finally {
      setIsSendingQuickReply(false);
    }
  };

  // AI draft for quick reply
  const handleGenerateAiQuickReply = async () => {
    if (!selectedMessage) return;
    try {
      const res = await fetch('/api/gemini/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Draft a quick professional acknowledgment reply to this email: "${selectedMessage.subject}". Confirm we are on track.`,
          tone: 'professional',
          context: {
            recipientName: selectedMessage.from,
            subject: selectedMessage.subject
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuickReplyText(data.body || '');
      }
    } catch (e) {
      setQuickReplyText('Thank you for the update. We have reviewed the details and will keep you posted on delivery.');
    }
  };

  // Initiate Trash with Confirmation Dialog
  const handleInitiateTrash = (id: string) => {
    setMessageToTrash(id);
    setShowTrashConfirmation(true);
  };

  const handleConfirmTrash = async () => {
    if (messageToTrash) {
      await deleteEmail(messageToTrash);
      setShowTrashConfirmation(false);
      setMessageToTrash(null);
    }
  };

  // IF NOT AUTHENTICATED WITH GOOGLE
  if (!isGmailConnected || needsGoogleAuth) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF3D00] uppercase">
                COMMUNICATION MATRIX
              </span>
              <span className="px-2 py-0.5 bg-white/10 text-white/80 text-[10px] font-mono uppercase">
                WORKSPACE INTEGRATION
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white font-display">
              GMAIL WORKSPACE HUB
            </h1>
            <p className="text-xs text-white/50 font-light mt-0.5">
              Connect your Google Workspace Gmail account to read team updates, dispatch notifications, and turn emails into project tasks with AI.
            </p>
          </div>
        </div>

        {/* Google Sign-In Card */}
        <div className="bg-[#0c0c0c] border border-white/10 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-[#FF3D00]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex p-4 bg-white/5 border border-white/10 text-[#FF3D00]">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black uppercase text-white font-display">
                CONNECT YOUR GMAIL ACCOUNT
              </h2>
              <p className="text-xs text-white/60 font-light leading-relaxed max-w-lg mx-auto">
                Securely link your Google account to enable intelligent bidirectional email operations, workload notification broadcasts, and 1-click email-to-task AI parsing.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FF3D00]/10 border border-[#FF3D00]/40 text-xs text-[#FF3D00] flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Official Google Sign-In Button */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                id="btn-connect-google-gmail"
                type="button"
                onClick={connectGmail}
                disabled={isConnecting}
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-widest transition shadow-xl shadow-white/5 cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isConnecting ? 'CONNECTING GOOGLE WORKSPACE...' : 'SIGN IN WITH GOOGLE'}</span>
              </button>

              <p className="text-[10px] font-mono text-white/40">
                Requires OAuth scopes for reading, drafting, and sending Gmail messages.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10 text-left">
              <div className="p-4 bg-white/[0.02] border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF3D00]" />
                  <span>AI Email-to-Task</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-light">
                  Convert complex project requirements or bug reports from incoming client emails directly into Kanban tasks.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <Send className="w-3.5 h-3.5 text-[#FF3D00]" />
                  <span>AI Dispatch Assistant</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-light">
                  Draft task assignment memos, status reports, and workload rebalance notices with Gemini Copilot.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <Shield className="w-3.5 h-3.5 text-[#FF3D00]" />
                  <span>In-Memory Security</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-light">
                  Tokens are strictly cached in volatile memory only and never written to permanent browser storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IF CONNECTED TO GMAIL
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF3D00] uppercase">
              WORKSPACE COMMUNICATION
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              GMAIL CONNECTED
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white font-display">
            GMAIL WORKSPACE HUB
          </h1>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Connected as <strong className="text-white font-mono">{gmailProfile?.emailAddress || googleUser?.email}</strong>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-gmail-refresh"
            type="button"
            onClick={refreshInbox}
            disabled={isLoadingMessages}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-gmail-compose"
            type="button"
            onClick={() => openCompose({ mode: 'new' })}
            className="px-5 py-2 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#FF3D00]/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Compose Message</span>
          </button>

          <button
            id="btn-gmail-disconnect"
            type="button"
            onClick={() => setShowDisconnectConfirmation(true)}
            className="p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white/50 hover:text-red-400 transition cursor-pointer"
            title="Disconnect Gmail"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Mail Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-[640px]">
        {/* Left Column: Folders & Message List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#0a0a0a] border border-white/10 overflow-hidden">
          {/* Folder Pills */}
          <div className="p-3 bg-[#111111] border-b border-white/10 flex items-center gap-1 overflow-x-auto">
            {folders.map((f) => {
              const Icon = f.icon;
              const isActive = currentFolder === f.id;
              return (
                <button
                  key={f.id}
                  id={`tab-folder-${f.id.toLowerCase()}`}
                  type="button"
                  onClick={() => {
                    setCurrentFolder(f.id);
                    selectMessage(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-black font-black shadow-sm'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-white/40'}`} />
                  <span>{f.label}</span>
                  {f.id === 'INBOX' && unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#FF3D00] text-black font-mono text-[9px] font-black">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-white/10 bg-[#0e0e0e] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <input
              id="input-gmail-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, subject, keywords..."
              className="w-full bg-transparent text-white text-xs placeholder:text-white/30 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] uppercase font-mono text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[600px]">
            {isLoadingMessages ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-5 h-5 text-[#FF3D00] animate-spin mx-auto" />
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  Loading Gmail Messages...
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Mail className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs font-black uppercase text-white/70 font-mono">
                  No messages found
                </p>
                <p className="text-[11px] text-white/40 font-light">
                  Folder is empty or search returned no matching items.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;

                return (
                  <div
                    key={msg.id}
                    id={`msg-item-${msg.id}`}
                    onClick={() => selectMessage(msg)}
                    className={`p-3.5 cursor-pointer transition relative group ${
                      isSelected
                        ? 'bg-white/10 border-l-4 border-l-[#FF3D00]'
                        : msg.isUnread
                        ? 'bg-white/[0.04] hover:bg-white/[0.07] border-l-4 border-l-white/40'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 truncate">
                        {msg.isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#FF3D00] shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate font-mono ${
                            msg.isUnread ? 'font-bold text-white' : 'text-white/80'
                          }`}
                        >
                          {msg.from.split('<')[0].replace(/"/g, '').trim()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(msg.id);
                          }}
                          className="p-0.5 text-white/30 hover:text-amber-400 transition"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              msg.isStarred ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-mono text-white/40">
                          {msg.date.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    <h4
                      className={`text-xs tracking-tight line-clamp-1 mb-1 ${
                        msg.isUnread ? 'font-black text-white' : 'font-medium text-white/70'
                      }`}
                    >
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-white/40 line-clamp-1 font-light leading-snug">
                      {msg.snippet}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message Detail Viewer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0a0a0a] border border-white/10 min-h-[600px] overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Message Header Toolbar */}
              <div className="p-4 bg-[#111111] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectMessage(null)}
                    className="lg:hidden p-1.5 text-white/50 hover:text-white bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-msg-reply"
                    type="button"
                    onClick={() =>
                      openCompose({
                        to: selectedMessage.from,
                        subject: selectedMessage.subject.startsWith('Re:')
                          ? selectedMessage.subject
                          : `Re: ${selectedMessage.subject}`,
                        inReplyTo: selectedMessage.id,
                        threadId: selectedMessage.threadId,
                        mode: 'reply'
                      })
                    }
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>

                  <button
                    id="btn-msg-forward"
                    type="button"
                    onClick={() =>
                      openCompose({
                        subject: `Fwd: ${selectedMessage.subject}`,
                        body: `\n\n---------- Forwarded message ---------\nFrom: ${selectedMessage.from}\nDate: ${selectedMessage.date}\nSubject: ${selectedMessage.subject}\nTo: ${selectedMessage.to}\n\n${selectedMessage.bodyText}`,
                        mode: 'forward'
                      })
                    }
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    <span>Forward</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Convert to Task CTA */}
                  <button
                    id="btn-msg-convert-to-task"
                    type="button"
                    onClick={handleConvertEmailToTask}
                    disabled={isConvertingToTask}
                    className="px-3.5 py-1.5 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#FF3D00]/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isConvertingToTask ? 'Analyzing...' : 'Convert to Task'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStar(selectedMessage.id)}
                    className="p-2 text-white/50 hover:text-amber-400 bg-white/5 transition"
                    title="Star message"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedMessage.isStarred ? 'text-amber-400 fill-amber-400' : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleReadStatus(selectedMessage.id)}
                    className="p-2 text-white/50 hover:text-white bg-white/5 transition"
                    title="Toggle read status"
                  >
                    <MailCheck className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-msg-trash"
                    type="button"
                    onClick={() => handleInitiateTrash(selectedMessage.id)}
                    className="p-2 text-white/50 hover:text-[#FF3D00] bg-white/5 hover:bg-[#FF3D00]/10 transition cursor-pointer"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Details */}
              <div className="p-6 border-b border-white/10 space-y-3 bg-[#0d0d0d]">
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight font-display">
                  {selectedMessage.subject}
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-white/40">From:</span>
                      <strong className="text-white font-mono">{selectedMessage.from}</strong>
                    </div>
                    {selectedMessage.to && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-white/40">To:</span>
                        <span className="text-white/70 font-mono">{selectedMessage.to}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-white/40 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedMessage.date}</span>
                  </div>
                </div>
              </div>

              {/* Extracted Task Preview Banner if triggered */}
              <AnimatePresence>
                {extractedTaskPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#121212] border-b-2 border-[#FF3D00] p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#FF3D00] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        AI Extracted Task Card
                      </span>
                      <button
                        type="button"
                        onClick={() => setExtractedTaskPreview(null)}
                        className="text-[10px] font-mono uppercase text-white/40 hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="bg-black/50 border border-white/10 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white font-mono">
                          {extractedTaskPreview.title}
                        </h4>
                        <span className="px-2 py-0.5 bg-[#FF3D00]/20 text-[#FF3D00] text-[9px] font-mono font-black uppercase">
                          {extractedTaskPreview.priority} PRIORITY
                        </span>
                      </div>

                      <p className="text-[11px] text-white/60 font-light">
                        {extractedTaskPreview.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-white/50">
                        <span>Est: <strong>{extractedTaskPreview.estimatedHours}h</strong></span>
                        {extractedTaskPreview.requiredSkills && (
                          <span>Skills: <strong>{extractedTaskPreview.requiredSkills.join(', ')}</strong></span>
                        )}
                        {extractedTaskPreview.suggestedEmployeeId && (
                          <span>
                            Assignee: <strong>{employees.find((e) => e.id === extractedTaskPreview.suggestedEmployeeId)?.name || 'Auto-match'}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        id="btn-confirm-add-task-from-email"
                        type="button"
                        onClick={handleSaveExtractedTask}
                        className="px-4 py-2 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-white/5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Add to Project Board</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {selectedMessage.bodyHtml ? (
                  <div
                    className="prose prose-invert max-w-none text-xs text-white/80 font-sans leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                  />
                ) : (
                  <p className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {selectedMessage.bodyText || selectedMessage.snippet}
                  </p>
                )}
              </div>

              {/* Quick Reply Bar */}
              <div className="p-4 bg-[#111111] border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 flex items-center gap-1">
                    <Reply className="w-3 h-3" /> Quick Response
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAiQuickReply}
                    className="text-[10px] font-mono text-[#FF3D00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Draft Reply</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickReplyText}
                    onChange={(e) => setQuickReplyText(e.target.value)}
                    placeholder="Type quick reply or click AI Draft..."
                    className="flex-1 bg-black border border-white/20 text-white text-xs px-3 py-2 placeholder:text-white/30 focus:outline-none focus:border-[#FF3D00] font-sans"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendQuickReply();
                      }
                    }}
                  />
                  <button
                    id="btn-send-quick-reply"
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={!quickReplyText.trim() || isSendingQuickReply}
                    className="px-4 py-2 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 text-white/30">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-black uppercase text-white font-mono">
                  No Message Selected
                </h3>
                <p className="text-xs text-white/40 font-light">
                  Select an email from the left list to read content, draft AI replies, or convert into engineering deliverables.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCompose({ mode: 'new' })}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Compose New Message</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      <ComposeEmailModal />

      {/* Trash / Delete Confirmation Modal (MANDATORY per Workspace integration guidelines) */}
      <ConfirmationModal
        isOpen={showTrashConfirmation}
        title="Move Email to Trash"
        message="Are you sure you want to move this email message to the Gmail Trash folder? You can restore it later from Trash if needed."
        confirmLabel="Move to Trash"
        confirmVariant="danger"
        icon="trash"
        onConfirm={handleConfirmTrash}
        onCancel={() => {
          setShowTrashConfirmation(false);
          setMessageToTrash(null);
        }}
      />

      {/* Disconnect Google Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectConfirmation}
        title="Disconnect Google Workspace"
        message="Are you sure you want to sign out and clear your cached Gmail token from memory?"
        confirmLabel="Disconnect"
        confirmVariant="warning"
        icon="warning"
        onConfirm={async () => {
          await disconnectGmail();
          setShowDisconnectConfirmation(false);
        }}
        onCancel={() => setShowDisconnectConfirmation(false)}
      />
    </div>
  );
};
