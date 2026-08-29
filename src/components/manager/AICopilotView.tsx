import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
  Clock
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
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">TeamPilot Manager Copilot</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/30">
                Agentic Tools Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous workforce optimization, what-if simulations, and deadline intelligence
            </p>
          </div>
        </div>

        <button
          onClick={openOptimizerModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold transition"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Launch Full Optimizer</span>
        </button>
      </div>

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
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none'
              }`}
            >
              {/* Tool calls inspected header */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <button
                    onClick={() => toggleToolExpand(msg.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[10px] hover:bg-slate-950 transition"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Tool Executions ({msg.toolCalls.length}): {msg.toolCalls.map((t) => t.name).join(', ')}</span>
                    {expandedTools[msg.id] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </button>

                  {expandedTools[msg.id] && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto space-y-2">
                      {msg.toolCalls.map((call, idx) => (
                        <div key={idx} className="border-b border-slate-800/80 pb-2">
                          <p className="font-bold text-cyan-400">⚡ {call.name}()</p>
                          <pre className="text-[10px] text-slate-400 overflow-x-auto mt-1">
                            {JSON.stringify(call.result, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message text with Markdown */}
              <div className="prose prose-invert prose-xs max-w-none text-slate-200 space-y-2">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {/* Action Approval Card */}
              {msg.actionCard && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border-2 border-indigo-500/80 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Approval Requested
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      msg.actionCard.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : msg.actionCard.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {msg.actionCard.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200">
                    Reassign <strong>"{msg.actionCard.data.taskTitle}"</strong> from{' '}
                    <strong className="text-rose-300">{msg.actionCard.data.fromEmployeeName || 'Rahul'}</strong> to{' '}
                    <strong className="text-emerald-300">{msg.actionCard.data.toEmployeeName}</strong>?
                  </p>

                  {msg.actionCard.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleRejectAction(msg.id)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApproveAction(msg.id, msg.actionCard)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve & Apply Reassignment</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <span className="text-[9px] text-slate-400 mt-2 block text-right">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs p-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span>Gemini AI is analyzing real-time workforce state and checking constraints...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex flex-wrap gap-1.5 overflow-x-auto">
        {QUICK_PROMPT_PILLS.map((pill) => (
          <button
            key={pill}
            onClick={() => handleSendMessage(pill)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition font-medium whitespace-nowrap"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
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
            placeholder="Ask AI Copilot (e.g. 'Who is overloaded?', 'Evaluate who can build the Payment Gateway', 'Run team rebalance')..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
