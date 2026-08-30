import React, { useState, useEffect } from 'react';
import { useGmail } from '../../context/GmailContext';
import { useApp } from '../../context/AppContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  X,
  Send,
  Sparkles,
  Paperclip,
  FileText,
  User,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ComposeEmailModal: React.FC = () => {
  const { composeState, closeCompose, sendEmail, saveDraft } = useGmail();
  const { employees, projects } = useApp();

  const [to, setTo] = useState(composeState.to || '');
  const [subject, setSubject] = useState(composeState.subject || '');
  const [body, setBody] = useState(composeState.body || '');

  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'urgent' | 'encouraging' | 'executive'>('professional');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Destructive / Action confirmation modal state
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  useEffect(() => {
    if (composeState.isOpen) {
      setTo(composeState.to || '');
      setSubject(composeState.subject || '');
      setBody(composeState.body || '');
      setError(null);
    }
  }, [composeState]);

  if (!composeState.isOpen) return null;

  // AI draft generation
  const handleGenerateAiDraft = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) {
      setError('Please specify an AI prompt or select a quick template.');
      return;
    }

    setIsGeneratingAi(true);
    setError(null);

    try {
      // Find matching employee or project context if mentioned
      const matchedEmp = employees.find(
        (e) => to.includes(e.email) || promptToUse.toLowerCase().includes(e.name.toLowerCase())
      );

      const res = await fetch('/api/gemini/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          tone: aiTone,
          context: {
            recipientName: matchedEmp?.name || to,
            employeeName: matchedEmp?.name,
            subject: subject || undefined
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate draft with AI.');
      }

      const data = await res.json();
      if (data.subject && !subject) {
        setSubject(data.subject);
      }
      setBody(data.body || '');
      setShowAiAssistant(false);
    } catch (err: any) {
      console.error('AI draft error:', err);
      setError(err.message || 'AI drafting failed.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Trigger send confirmation dialog
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setError('Recipient email is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject line is required.');
      return;
    }
    if (!body.trim()) {
      setError('Email body cannot be empty.');
      return;
    }

    setError(null);
    setShowSendConfirmation(true);
  };

  // Actual send after confirmation
  const handleConfirmSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const success = await sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        threadId: composeState.threadId,
        inReplyTo: composeState.inReplyTo
      });

      if (success) {
        setShowSendConfirmation(false);
      } else {
        setError('Failed to send email. Check your Gmail connection.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while sending.');
    } finally {
      setIsSending(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!to.trim() && !subject.trim() && !body.trim()) {
      closeCompose();
      return;
    }

    setIsSavingDraft(true);
    try {
      await saveDraft({
        to: to.trim(),
        subject: subject.trim() || '(No Subject)',
        body: body.trim(),
        threadId: composeState.threadId,
        inReplyTo: composeState.inReplyTo
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const quickAiPrompts = [
    { label: 'Task Assignment', prompt: 'Draft a task assignment email detailing expectations and deadline' },
    { label: 'Workload Check-in', prompt: 'Inquire about current workload capacity and offer support' },
    { label: 'Sprint Risk Alert', prompt: 'Inform team member about delivery risks on upcoming deliverables' },
    { label: 'Appreciation & Recognition', prompt: 'Express recognition for exceptional delivery and timely completion' }
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="w-full max-w-2xl bg-[#090909] border border-white/20 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#111111] border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-[#FF3D00]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-white font-mono">
                {composeState.mode === 'reply'
                  ? 'REPLY VIA GMAIL'
                  : composeState.mode === 'forward'
                  ? 'FORWARD MESSAGE'
                  : 'NEW GMAIL MESSAGE'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                  showAiAssistant
                    ? 'bg-[#FF3D00] text-black border-[#FF3D00]'
                    : 'bg-white/5 text-[#FF3D00] border-[#FF3D00]/40 hover:bg-[#FF3D00]/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>AI Draft Copilot</span>
              </button>

              <button
                type="button"
                onClick={closeCompose}
                className="p-1 text-white/40 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Drafting Accordion */}
          <AnimatePresence>
            {showAiAssistant && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0d0d0d] border-b border-[#FF3D00]/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#FF3D00] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Executive Email Generator
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] uppercase font-mono text-white/40">Tone:</span>
                    <select
                      value={aiTone}
                      onChange={(e: any) => setAiTone(e.target.value)}
                      className="bg-black border border-white/20 text-white text-[10px] px-2 py-0.5 font-mono focus:outline-none focus:border-[#FF3D00]"
                    >
                      <option value="professional">Professional</option>
                      <option value="urgent">Urgent & Decisive</option>
                      <option value="encouraging">Encouraging</option>
                      <option value="executive">Executive Brief</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. Request Rahul to review payment gateway PR by tomorrow 2 PM..."
                    className="flex-1 bg-black border border-white/20 text-white text-xs px-3 py-2 placeholder:text-white/30 focus:outline-none focus:border-[#FF3D00]"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateAiDraft()}
                    disabled={isGeneratingAi}
                    className="px-4 py-2 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isGeneratingAi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generate</span>
                  </button>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickAiPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(qp.prompt);
                        handleGenerateAiDraft(qp.prompt);
                      }}
                      className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition font-mono"
                    >
                      + {qp.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleInitiateSend} className="flex-1 flex flex-col overflow-hidden">
            {error && (
              <div className="p-3 mx-6 mt-4 bg-[#FF3D00]/10 border border-[#FF3D00]/40 flex items-center gap-2 text-xs text-[#FF3D00]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* To field with Team Member chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                    To Recipient:
                  </label>
                  <span className="text-[9px] font-mono text-white/30">Click team member below to auto-fill</span>
                </div>
                <input
                  id="input-gmail-to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="engineer@company.com"
                  required
                  className="w-full bg-[#121212] border border-white/20 text-white text-xs px-3.5 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-[#FF3D00]"
                />

                {/* Quick Team Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {employees.slice(0, 5).map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setTo(emp.email)}
                      className={`text-[10px] px-2 py-0.5 border transition font-mono flex items-center gap-1 ${
                        to === emp.email
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <User className="w-2.5 h-2.5" />
                      <span>{emp.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                  Subject:
                </label>
                <input
                  id="input-gmail-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Project milestone update..."
                  required
                  className="w-full bg-[#121212] border border-white/20 text-white text-xs px-3.5 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-[#FF3D00]"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                  Message Content:
                </label>
                <textarea
                  id="input-gmail-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email here..."
                  rows={9}
                  required
                  className="w-full bg-[#121212] border border-white/20 text-white text-xs p-3.5 placeholder:text-white/30 focus:outline-none focus:border-[#FF3D00] resize-none font-sans leading-relaxed flex-1"
                />
              </div>
            </div>

            {/* Footer Toolbar */}
            <div className="px-6 py-4 bg-[#111111] border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="px-4 py-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-xs font-mono uppercase tracking-wider transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeCompose}
                  className="px-4 py-2 text-white/50 hover:text-white text-xs uppercase tracking-wider font-bold transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  id="btn-send-gmail-submit"
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-2.5 bg-[#FF3D00] hover:bg-[#ff5722] text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#FF3D00]/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Review & Send</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Mandatory User Confirmation Dialog before sending email per Workspace guidelines */}
      <ConfirmationModal
        isOpen={showSendConfirmation}
        title="Confirm Send Email via Gmail"
        message={`Are you sure you want to send this email from your connected Google Workspace account?`}
        details={[
          `Recipient: ${to}`,
          `Subject: ${subject}`,
          `Body Preview: ${body.slice(0, 90)}${body.length > 90 ? '...' : ''}`
        ]}
        confirmLabel="Send Message"
        confirmVariant="primary"
        icon="send"
        isProcessing={isSending}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowSendConfirmation(false)}
      />
    </>
  );
};
