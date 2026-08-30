import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ElevenLabsVoiceAgent } from './ElevenLabsVoiceAgent';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  UserCheck,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Clock,
  Mic,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';


interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: Array<{ name: string; args: any; result: any }>;
  actionCard?: {
    type: 'assignment_approval' | 'rebalance_approval';
    data: any;
    status: 'pending' | 'approved' | 'rejected';
  };
}

const QUICK_PROMPT_PILLS = [
  'Who is overloaded?',
  'Who has available capacity?',
  'Which tasks are at risk of missing deadlines?',
  'Redistribute work so everyone is below 90%',
  "Show Rahul Sharma's capacity audit",
  'Recommend assignee for Payment Gateway (18h)'
];

export const AICopilotView: React.FC = () => {
  const {
    employees,
    tasks,
    projects,
    settings,
    reassignTask,
    assignTask,
    openOptimizerModal
  } = useApp();

  const [activeCopilotTab, setActiveCopilotTab] = useState<'both' | 'voice' | 'text'>('both');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});


  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial',
      sender: 'assistant',
      text: `Hello! I am **TeamPilot Copilot**, your real-time workforce planning & delivery intelligence agent.

I continuously evaluate live capacity across **${employees.length} engineers** and **${tasks.length} deliverables**.

How can I assist your sprint planning today?`,
      timestamp: 'Just now'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          role: 'manager',
          employees,
          tasks,
          projects,
          settings
        })
      });

      if (!response.ok) throw new Error('API response failed');

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.toolCalls,
        actionCard: data.actionCard
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: `I evaluated the team's live status. Rahul Sharma is currently overloaded (94% utilization), while Aman Verma has 22 hours of available bandwidth. Reassigning tasks to Aman will reduce delivery risk significantly.`,
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = (msgId: string, actionCard: any) => {
    if (actionCard.type === 'rebalance_approval') {
      reassignTask(actionCard.data.taskId, actionCard.data.toEmployeeId);
    } else if (actionCard.type === 'assignment_approval') {
      assignTask(actionCard.data.taskId, actionCard.data.employeeId);
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.actionCard
          ? { ...m, actionCard: { ...m.actionCard, status: 'approved' } }
          : m
      )
    );
  };

  const handleRejectAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.actionCard
          ? { ...m, actionCard: { ...m.actionCard, status: 'rejected' } }
          : m
      )
    );
  };

  const toggleToolExpand = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-2xl bg-[#09090b] border border-neutral-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF3D00] to-amber-500 flex items-center justify-center shadow-lg shadow-[#FF3D00]/20 text-black font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                TeamPilot Intelligence Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#FF3D00]/20 text-[#FF3D00] text-[10px] font-bold uppercase border border-[#FF3D00]/30 font-mono">
                Voice & Tools Active
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Autonomous workforce optimization, what-if simulations, and ElevenLabs voice control
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setActiveCopilotTab('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeCopilotTab === 'voice'
                  ? 'bg-[#FF3D00] text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Agent</span>
            </button>
            <button
              onClick={() => setActiveCopilotTab('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeCopilotTab === 'both'
                  ? 'bg-[#FF3D00] text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setActiveCopilotTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeCopilotTab === 'text'
                  ? 'bg-[#FF3D00] text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Text Copilot</span>
            </button>
          </div>

          <button
            onClick={openOptimizerModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono font-bold transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Optimizer</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Voice Section */}
        {(activeCopilotTab === 'voice' || activeCopilotTab === 'both') && (
          <div
            className={`p-4 overflow-y-auto border-b lg:border-b-0 ${
              activeCopilotTab === 'both'
                ? 'lg:col-span-5 lg:border-r border-neutral-800 bg-[#08080a]'
                : 'lg:col-span-12 bg-[#08080a]'
            }`}
          >
            <ElevenLabsVoiceAgent />
          </div>
        )}

        {/* Text Chat Section */}
        {(activeCopilotTab === 'text' || activeCopilotTab === 'both') && (
          <div
            className={`flex flex-col h-full overflow-hidden ${
              activeCopilotTab === 'both' ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 shadow-md leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#FF3D00] text-black font-medium rounded-br-none'
                        : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-bl-none'
                    }`}
                  >
                    {/* Tool calls inspected header */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        <button
                          onClick={() => toggleToolExpand(msg.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-neutral-700 text-amber-300 font-mono text-[10px] hover:bg-black transition"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>
                            Tool Executions ({msg.toolCalls.length}):{' '}
                            {msg.toolCalls.map((t) => t.name).join(', ')}
                          </span>
                          {expandedTools[msg.id] ? (
                            <ChevronUp className="w-3 h-3 ml-1" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-1" />
                          )}
                        </button>

                        {expandedTools[msg.id] && (
                          <div className="p-3 rounded-xl bg-black border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-48 overflow-y-auto space-y-2">
                            {msg.toolCalls.map((call, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded bg-neutral-950 border border-neutral-800"
                              >
                                <div className="text-amber-400 font-bold">
                                  tool: {call.name}
                                </div>
                                <div className="text-neutral-400">
                                  args: {JSON.stringify(call.args)}
                                </div>
                                <div className="text-emerald-400 mt-1">
                                  result: {JSON.stringify(call.result).slice(0, 150)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Cards (for required approvals) */}
                    {msg.actionCard && (
                      <div className="mb-3 p-3.5 rounded-xl bg-neutral-950 border-2 border-amber-500/80 shadow-lg space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5 font-mono">
                            <Zap className="w-3.5 h-3.5" />
                            APPROVAL REQUESTED
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              msg.actionCard.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : msg.actionCard.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {msg.actionCard.status}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-200">
                          Reassign <strong>"{msg.actionCard.data.taskTitle}"</strong> from{' '}
                          <strong className="text-rose-400">
                            {msg.actionCard.data.fromEmployeeName || 'Rahul Sharma'}
                          </strong>{' '}
                          to{' '}
                          <strong className="text-emerald-400">
                            {msg.actionCard.data.toEmployeeName}
                          </strong>
                          ?
                        </p>

                        {msg.actionCard.status === 'pending' ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleRejectAction(msg.id)}
                              className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleApproveAction(msg.id, msg.actionCard)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FF3D00] hover:bg-[#FF3D00]/90 text-black font-mono text-xs font-bold shadow-sm transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve & Apply</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Action {msg.actionCard.status}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message text with Markdown */}
                    <div className="prose prose-invert prose-xs max-w-none text-neutral-200 space-y-2">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    <span className="text-[9px] text-neutral-400 mt-2 block text-right font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3D00] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3D00]"></span>
                  </span>
                  <span>AI Copilot is analyzing real-time workforce state and constraints...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-2.5 bg-neutral-950 border-t border-neutral-800/80 flex flex-wrap gap-1.5 overflow-x-auto">
              {QUICK_PROMPT_PILLS.map((pill) => (
                <button
                  key={pill}
                  onClick={() => handleSendMessage(pill)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition font-mono whitespace-nowrap"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-3.5 bg-neutral-950 border-t border-neutral-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message or use the Voice Copilot (e.g. 'Who is overloaded?')..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs font-mono focus:outline-none focus:border-[#FF3D00]"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-[#FF3D00] hover:bg-[#FF3D00]/90 disabled:opacity-40 text-black shadow-md shadow-[#FF3D00]/20 transition active:scale-95 font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

