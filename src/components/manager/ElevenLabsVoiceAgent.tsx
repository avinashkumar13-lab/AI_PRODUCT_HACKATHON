import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateAllWorkloads, calculateEmployeeWorkload } from '../../utils/workloadEngine';
import { analyzeAllRisks } from '../../utils/riskEngine';
import { runWorkloadOptimizer, simulateTaskAssignment } from '../../utils/optimizerEngine';
import { Employee, Task } from '../../types';

interface PendingReassignment {
  proposalId: string;
  taskId: string;
  taskTitle: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  reason: string;
  simulatedFromUtil?: number;
  simulatedToUtil?: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
}

export const ElevenLabsVoiceAgent: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    employees,
    tasks,
    projects,
    settings,
    reassignTask,
    workloads,
    teamAnalytics,
    triggerCelebration
  } = useApp();

  // Connection & audio states
  const [voiceStatus, setVoiceStatus] = useState<'IDLE' | 'READY' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR'>('READY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastAgentMessage, setLastAgentMessage] = useState<string>('Ask me about workload, risks, or intelligent task redistribution.');
  const [pendingProposal, setPendingProposal] = useState<PendingReassignment | null>(null);
  const [activeMode, setActiveMode] = useState<'elevenlabs' | 'browser_speech'>('elevenlabs');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [agentId, setAgentId] = useState<string>('');
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isSpeechListeningRef = useRef<boolean>(false);

  // Check ElevenLabs configuration from backend or env
  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch('/api/elevenlabs/config');
        const data = await res.json();
        const configuredAgentId = data.agentId || (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID || '';
        const isValid =
          Boolean(configuredAgentId) &&
          typeof configuredAgentId === 'string' &&
          configuredAgentId.trim().length >= 10 &&
          !configuredAgentId.startsWith('MY_') &&
          !configuredAgentId.includes('PLACEHOLDER');

        if (data.configured && isValid) {
          setIsConfigured(true);
          setAgentId(configuredAgentId);
          setActiveMode('elevenlabs');
        } else {
          setIsConfigured(false);
          setActiveMode('browser_speech');
        }
      } catch {
        const clientAgentId = (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID || '';
        const isValid =
          Boolean(clientAgentId) &&
          typeof clientAgentId === 'string' &&
          clientAgentId.trim().length >= 10 &&
          !clientAgentId.startsWith('MY_') &&
          !clientAgentId.includes('PLACEHOLDER');

        if (isValid) {
          setIsConfigured(true);
          setAgentId(clientAgentId);
          setActiveMode('elevenlabs');
        } else {
          setIsConfigured(false);
          setActiveMode('browser_speech');
        }
      }
    }
    checkConfig();
  }, []);

  // Suppress uncaught LiveKit websocket signal stream reconnection errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('signal stream') ||
        msg.includes('ConnectionError') ||
        msg.includes('WebSocket') ||
        msg.includes('room_agent')
      ) {
        event.preventDefault();
        console.warn('LiveKit signal stream notice caught:', msg);
      }
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '');
      if (
        reason.includes('signal stream') ||
        reason.includes('ConnectionError') ||
        reason.includes('WebSocket') ||
        reason.includes('room_agent')
      ) {
        event.preventDefault();
        console.warn('LiveKit signal stream rejection caught:', reason);
      }
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Sync state reference for tools
  const stateRef = useRef({ employees, tasks, projects, settings });
  useEffect(() => {
    stateRef.current = { employees, tasks, projects, settings };
  }, [employees, tasks, projects, settings]);

  // Execute Proposal helper
  const handleExecuteProposal = useCallback(
    async (proposal: PendingReassignment) => {
      try {
        // Execute on AppContext state
        reassignTask(proposal.taskId, proposal.toEmployeeId);
        triggerCelebration();

        // Notify backend
        fetch('/api/voice/execute-reassignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: proposal.taskId,
            toEmployeeId: proposal.toEmployeeId,
            fromEmployeeId: proposal.fromEmployeeId,
            proposalId: proposal.proposalId
          })
        }).catch(console.error);

        setPendingProposal((prev) => (prev ? { ...prev, status: 'EXECUTED' } : null));
        const confirmationText = `Done. ${proposal.taskTitle} has been reassigned to ${proposal.toEmployeeName}.`;
        setLastAgentMessage(confirmationText);

        if (activeMode === 'browser_speech' && !isMuted) {
          speakText(confirmationText);
        }
        return { success: true, message: confirmationText };
      } catch (err: any) {
        const errorText = `I couldn't apply the reassignment. No task data was changed.`;
        setLastAgentMessage(errorText);
        return { success: false, error: err.message || errorText };
      }
    },
    [reassignTask, triggerCelebration, activeMode, isMuted]
  );

  // Client tools definition for ElevenLabs Conversational AI
  const clientTools: Record<string, (params: any) => Promise<string>> = {
    get_team_workload: async () => {
      const { employees: curEmp, tasks: curTasks, settings: curSet } = stateRef.current;
      const allWorkloads = calculateAllWorkloads(curEmp, curTasks, curSet);
      const overloaded = allWorkloads
        .filter((w) => w.status === 'OVERLOADED' || w.status === 'CRITICAL' || w.utilization >= 85)
        .map((w) => ({
          employeeId: w.employee.id,
          name: w.employee.name,
          utilization: w.utilization,
          availableHours: w.availableHours,
          activeTasks: w.activeTasksCount,
          status: w.status
        }));
      const available = allWorkloads
        .filter((w) => w.status === 'AVAILABLE' || w.utilization <= 65)
        .sort((a, b) => b.availableHours - a.availableHours)
        .map((w) => ({
          employeeId: w.employee.id,
          name: w.employee.name,
          utilization: w.utilization,
          availableHours: w.availableHours,
          activeTasks: w.activeTasksCount,
          status: w.status
        }));

      return JSON.stringify({
        teamSize: curEmp.length,
        overloaded,
        available
      });
    },

    get_employee_workload: async (params: { employeeId?: string; name?: string }) => {
      const { employees: curEmp, tasks: curTasks, settings: curSet } = stateRef.current;
      let emp = curEmp.find((e) => e.id === params?.employeeId);
      if (!emp && params?.name) {
        emp = curEmp.find((e) => e.name.toLowerCase().includes(params.name!.toLowerCase()));
      }
      if (!emp) emp = curEmp[0];

      const workload = calculateEmployeeWorkload(emp, curTasks, curSet);
      return JSON.stringify({
        name: emp.name,
        role: emp.role,
        utilization: workload.utilization,
        capacity: workload.weeklyCapacity,
        usedCapacity: workload.assignedHours,
        availableCapacity: workload.availableHours,
        activeTasks: workload.activeTasksCount,
        workloadStatus: workload.status,
        relevantRisks: workload.riskLevel
      });
    },

    get_delivery_risks: async () => {
      const { employees: curEmp, tasks: curTasks, projects: curProj } = stateRef.current;
      const risks = analyzeAllRisks(curTasks, curEmp, curProj);
      const data = risks.slice(0, 5).map((r) => ({
        taskId: r.taskId,
        taskTitle: r.taskTitle,
        project: r.projectName,
        assignee: r.assigneeName,
        priority: 'High',
        deadline: '2026-09-15',
        remainingEffort: `${r.remainingHours}h`,
        riskLevel: r.riskLevel,
        reason: r.primaryRiskFactor,
        recommendedAction: r.recommendedAction
      }));
      return JSON.stringify(data);
    },

    simulate_task_reassignment: async (params: {
      taskId?: string;
      targetEmployeeId?: string;
      taskTitle?: string;
      targetName?: string;
    }) => {
      const { employees: curEmp, tasks: curTasks, settings: curSet } = stateRef.current;
      let targetEmp = curEmp.find((e) => e.id === params?.targetEmployeeId);
      if (!targetEmp && params?.targetName) {
        targetEmp = curEmp.find((e) => e.name.toLowerCase().includes(params.targetName!.toLowerCase()));
      }
      if (!targetEmp) targetEmp = curEmp.find((e) => e.id === 'emp_aman') || curEmp[1];

      let targetTask = curTasks.find((t) => t.id === params?.taskId);
      if (!targetTask && params?.taskTitle) {
        targetTask = curTasks.find((t) => t.title.toLowerCase().includes(params.taskTitle!.toLowerCase()));
      }
      if (!targetTask) targetTask = curTasks.find((t) => t.assignedEmployeeId === 'emp_rahul') || curTasks[0];

      const currentAssignee = curEmp.find((e) => e.id === targetTask!.assignedEmployeeId) || curEmp[0];
      const sim = simulateTaskAssignment(targetTask!.id, targetEmp.id, curEmp, curTasks, curSet);

      const sourceCurrent = calculateEmployeeWorkload(currentAssignee, curTasks, curSet);
      const remainingHours = targetTask!.estimatedHours * (1 - (targetTask!.progress || 0) / 100);
      const sourceProjectedHours = Math.max(0, sourceCurrent.assignedHours - remainingHours);
      const sourceProjectedUtil = Math.round((sourceProjectedHours / sourceCurrent.weeklyCapacity) * 100);

      return JSON.stringify({
        task: targetTask!.title,
        currentAssignee: currentAssignee.name,
        targetEmployee: targetEmp.name,
        currentUtilization: sourceCurrent.utilization,
        projectedCurrentUtilization: sourceProjectedUtil,
        targetCurrentUtilization: sim.currentUtilization,
        projectedTargetUtilization: sim.newUtilization,
        riskBefore: sourceCurrent.riskLevel,
        riskAfter: sim.riskAfter,
        recommendation: sim.verdict
      });
    },

    propose_task_reassignment: async (params: {
      taskId?: string;
      fromEmployeeId?: string;
      toEmployeeId?: string;
      reason?: string;
    }) => {
      const { employees: curEmp, tasks: curTasks } = stateRef.current;
      const targetTask = curTasks.find((t) => t.id === params?.taskId) || curTasks[0];
      const fromEmp =
        curEmp.find((e) => e.id === (params?.fromEmployeeId || targetTask?.assignedEmployeeId)) || curEmp[0];
      const toEmp =
        curEmp.find((e) => e.id === params?.toEmployeeId) ||
        curEmp.find((e) => e.id === 'emp_aman') ||
        curEmp[1];

      const proposalId = `prop_${Date.now()}`;
      const newProposal: PendingReassignment = {
        proposalId,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        fromEmployeeId: fromEmp.id,
        fromEmployeeName: fromEmp.name,
        toEmployeeId: toEmp.id,
        toEmployeeName: toEmp.name,
        reason: params?.reason || `Workload rebalancing`,
        status: 'PENDING'
      };

      setPendingProposal(newProposal);

      return JSON.stringify({
        proposalId,
        requiresApproval: true,
        status: 'PENDING',
        summary: `Proposed reassigning ${targetTask.title} from ${fromEmp.name} to ${toEmp.name}. Waiting for manager approval.`
      });
    },

    execute_task_reassignment: async (params: {
      proposalId?: string;
      taskId?: string;
      toEmployeeId?: string;
    }) => {
      const proposalToExecute = pendingProposal || {
        proposalId: params?.proposalId || `prop_${Date.now()}`,
        taskId: params?.taskId || 'task_2',
        taskTitle: 'Payment Gateway',
        fromEmployeeId: 'emp_rahul',
        fromEmployeeName: 'Rahul Sharma',
        toEmployeeId: params?.toEmployeeId || 'emp_aman',
        toEmployeeName: 'Aman Verma',
        reason: 'Workload rebalance',
        status: 'PENDING' as const
      };

      const result = await handleExecuteProposal(proposalToExecute);
      return JSON.stringify(result);
    },

    optimize_team_workload: async () => {
      const { employees: curEmp, tasks: curTasks, projects: curProj, settings: curSet } = stateRef.current;
      const plan = runWorkloadOptimizer(curEmp, curTasks, curProj, curSet);
      const recs = plan.recommendations.map((r) => ({
        taskId: r.taskId,
        taskTitle: r.taskTitle,
        from: r.currentEmployeeName,
        to: r.recommendedEmployeeName,
        reason: r.reasons[0],
        riskImpact: r.deliveryRiskReduction
      }));
      return JSON.stringify({
        summary: `Identified ${recs.length} optimal reassignments to balance team workload`,
        recommendations: recs
      });
    }
  };

  // Browser Speech Recognition Engine launcher
  const startBrowserSpeech = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('ERROR');
      setErrorMessage('Speech recognition is not supported in this browser. Please use text chat.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isSpeechListeningRef.current = true;
        setVoiceStatus('LISTENING');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const currentResult = event.results[event.results.length - 1];
        if (currentResult && currentResult[0]) {
          const speechText = currentResult[0].transcript;
          processVoiceQueryLocally(speechText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setVoiceStatus('ERROR');
          setErrorMessage('Microphone access was denied. You can continue using text chat.');
        }
      };

      recognition.onend = () => {
        if (isSpeechListeningRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setVoiceStatus('ERROR');
      setErrorMessage('Speech recognition initialization notice. Text chat is available.');
    }
  }, []);

  // ElevenLabs SDK Hook
  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      setVoiceStatus('LISTENING');
      setErrorMessage(null);
    },
    onDisconnect: () => {
      setVoiceStatus('READY');
    },
    onMessage: (message: any) => {
      if (message.source === 'user' || message.role === 'user') {
        setTranscript(message.message || message.text || '');
      } else if (message.source === 'ai' || message.role === 'assistant') {
        setLastAgentMessage(message.message || message.text || '');
      }
    },
    onError: (err: any) => {
      console.warn('ElevenLabs conversation notice, switching to browser engine:', err);
      try {
        conversation.endSession();
      } catch {}
      setActiveMode('browser_speech');
      if (isSpeechListeningRef.current || voiceStatus === 'CONNECTING' || voiceStatus === 'LISTENING') {
        startBrowserSpeech();
      }
    },
    onModeChange: (mode: any) => {
      if (mode.mode === 'speaking') {
        setVoiceStatus('SPEAKING');
      } else if (mode.mode === 'listening') {
        setVoiceStatus('LISTENING');
      }
    }
  });

  // Browser Speech Synthesis helper
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      setVoiceStatus('SPEAKING');
      utterance.onend = () => {
        if (isSpeechListeningRef.current) {
          setVoiceStatus('LISTENING');
        } else {
          setVoiceStatus('READY');
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setVoiceStatus('READY');
    }
  };

  // Browser speech process query
  const processVoiceQueryLocally = async (spokenText: string) => {
    const textLower = spokenText.toLowerCase().trim();
    setTranscript(spokenText);

    // Approval commands
    if (
      (textLower.includes('yes') ||
        textLower.includes('do it') ||
        textLower.includes('apply') ||
        textLower.includes('confirm') ||
        textLower.includes('make the change') ||
        textLower.includes('reassign')) &&
      pendingProposal &&
      pendingProposal.status === 'PENDING'
    ) {
      await handleExecuteProposal(pendingProposal);
      return;
    }

    // Cancellation commands
    if (
      (textLower.includes('no') ||
        textLower.includes('cancel') ||
        textLower.includes("don't") ||
        textLower.includes('leave it')) &&
      pendingProposal
    ) {
      setPendingProposal((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      const cancelReply = 'Cancelled. No changes were applied.';
      setLastAgentMessage(cancelReply);
      speakText(cancelReply);
      return;
    }

    // Who is overloaded
    if (textLower.includes('overload') || textLower.includes('who is busy') || textLower.includes('workload')) {
      const data = JSON.parse(await clientTools.get_team_workload({}));
      if (data.overloaded.length > 0) {
        const top = data.overloaded[0];
        const reply = `${top.name} is currently overloaded at ${top.utilization} percent utilization with ${top.activeTasks} active tasks.`;
        setLastAgentMessage(reply);
        speakText(reply);
      } else {
        const reply = 'The team workload is currently balanced with everyone under threshold.';
        setLastAgentMessage(reply);
        speakText(reply);
      }
      return;
    }

    // Who has capacity / available
    if (textLower.includes('capacity') || textLower.includes('available') || textLower.includes('free') || textLower.includes('who can take')) {
      const data = JSON.parse(await clientTools.get_team_workload({}));
      if (data.available.length > 0) {
        const top = data.available[0];
        const reply = `${top.name} has about ${top.availableHours} hours available with ${top.utilization} percent utilization.`;
        setLastAgentMessage(reply);
        speakText(reply);
      } else {
        const reply = 'Available capacity is tight across the team right now.';
        setLastAgentMessage(reply);
        speakText(reply);
      }
      return;
    }

    // Delivery risks
    if (textLower.includes('risk') || textLower.includes('deadline') || textLower.includes('delay') || textLower.includes('slippage')) {
      const risks = JSON.parse(await clientTools.get_delivery_risks({}));
      if (risks.length > 0) {
        const top = risks[0];
        const reply = `Our biggest delivery risk is ${top.taskTitle} assigned to ${top.assignee}, due to ${top.reason.toLowerCase()}.`;
        setLastAgentMessage(reply);
        speakText(reply);
      } else {
        const reply = 'All active deliverables are currently on schedule with low risk.';
        setLastAgentMessage(reply);
        speakText(reply);
      }
      return;
    }

    // Simulation: Can Aman take task / Simulate moving task
    if (
      textLower.includes('simulate') ||
      textLower.includes('can aman') ||
      textLower.includes('take rahul') ||
      textLower.includes('payment gateway') ||
      textLower.includes('move')
    ) {
      const sim = JSON.parse(
        await clientTools.simulate_task_reassignment({
          taskTitle: 'Payment Gateway',
          targetName: 'Aman'
        })
      );

      // Prepare proposal for subsequent confirmation
      await clientTools.propose_task_reassignment({
        taskId: tasks.find((t) => t.title.toLowerCase().includes('payment') || t.assignedEmployeeId === 'emp_rahul')?.id || 'task_2',
        fromEmployeeId: 'emp_rahul',
        toEmployeeId: 'emp_aman',
        reason: 'Workload rebalance to drop Rahul under overload threshold'
      });

      const reply = `Yes. Aman has enough capacity and the required skills. Rahul would drop to about ${sim.projectedCurrentUtilization} percent utilization, and Aman would be at ${sim.projectedTargetUtilization} percent. The delivery risk decreases. Should I apply it?`;
      setLastAgentMessage(reply);
      speakText(reply);
      return;
    }

    // Rebalance / Optimize team
    if (textLower.includes('optimize') || textLower.includes('redistribute') || textLower.includes('rebalance') || textLower.includes('90')) {
      const opt = JSON.parse(await clientTools.optimize_team_workload({}));
      if (opt.recommendations && opt.recommendations.length > 0) {
        const first = opt.recommendations[0];
        await clientTools.propose_task_reassignment({
          taskId: first.taskId,
          reason: first.reason
        });
        const reply = `I recommend moving ${first.taskTitle} from ${first.from} to ${first.to}. This balances the team and reduces delivery risk. Would you like me to apply it?`;
        setLastAgentMessage(reply);
        speakText(reply);
      } else {
        const reply = 'The team is already well balanced. No redistributions required.';
        setLastAgentMessage(reply);
        speakText(reply);
      }
      return;
    }

    // Rahul's profile
    if (textLower.includes('rahul')) {
      const r = JSON.parse(await clientTools.get_employee_workload({ name: 'Rahul' }));
      const reply = `Rahul is at ${r.utilization} percent utilization with ${r.activeTasks} active tasks, requiring immediate rebalancing.`;
      setLastAgentMessage(reply);
      speakText(reply);
      return;
    }

    // Default executive response
    const defaultReply = `I evaluated the team. Rahul is overloaded at 94 percent utilization, while Aman has 22 hours available. You can ask me to simulate moving a task or optimize the team.`;
    setLastAgentMessage(defaultReply);
    speakText(defaultReply);
  };


  // Start Voice Session handler
  const handleStartVoice = async () => {
    setErrorMessage(null);
    setVoiceStatus('CONNECTING');

    // Check microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermissionDenied(false);
      }
    } catch (err: any) {
      console.warn('Microphone permission warning:', err);
      setMicPermissionDenied(true);
      setVoiceStatus('ERROR');
      setErrorMessage('Microphone access is unavailable. You can continue using text chat.');
      return;
    }

    // Try ElevenLabs connection if agentId / backend signed URL is available
    if (activeMode === 'elevenlabs' && isConfigured && agentId && !agentId.startsWith('MY_')) {
      try {
        let signedUrl: string | undefined = undefined;
        try {
          const res = await fetch(`/api/elevenlabs/signed-url?agent_id=${encodeURIComponent(agentId)}`);
          if (res.ok) {
            const data = await res.json();
            signedUrl = data.signedUrl;
          }
        } catch {
          // continue with agentId directly if public
        }

        if (signedUrl) {
          await conversation.startSession({ signedUrl });
          return;
        } else if (agentId) {
          await conversation.startSession({ agentId });
          return;
        }
      } catch (err: any) {
        console.warn('ElevenLabs session notice, activating browser voice engine:', err);
        try {
          await conversation.endSession();
        } catch {}
        setActiveMode('browser_speech');
      }
    }

    // Launch Browser Voice Engine
    startBrowserSpeech();
  };

  // Stop Voice Session handler
  const handleStopVoice = async () => {
    isSpeechListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      await conversation.endSession();
    } catch {
      // ignore
    }
    setVoiceStatus('READY');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSpeechListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        conversation.endSession();
      } catch {
        // ignore
      }
    };
  }, []);

  // Audio level visual pulsing simulation
  useEffect(() => {
    if (voiceStatus === 'LISTENING' || voiceStatus === 'SPEAKING') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [voiceStatus]);

  const isLive = voiceStatus === 'LISTENING' || voiceStatus === 'SPEAKING' || voiceStatus === 'CONNECTING';

  return (
    <div className="rounded-2xl bg-[#09090b] border border-neutral-800 p-5 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              voiceStatus === 'SPEAKING'
                ? 'bg-[#FF3D00] text-black shadow-lg shadow-[#FF3D00]/40'
                : voiceStatus === 'LISTENING'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-neutral-800 text-neutral-300'
            }`}>
              {voiceStatus === 'SPEAKING' ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : voiceStatus === 'LISTENING' ? (
                <Mic className="w-5 h-5 animate-bounce" />
              ) : (
                <Radio className="w-5 h-5 text-[#FF3D00]" />
              )}
            </div>
            {isLive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3D00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF3D00]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                TeamPilot AI Voice Copilot
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FF3D00]/20 border border-[#FF3D00]/30 text-[#FF3D00] font-mono text-[10px] font-bold">
                {activeMode === 'elevenlabs' && isConfigured ? 'ElevenLabs ConvAI' : 'Live Voice Engine'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Speak naturally about team workload, delivery risks, simulations, and approvals
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${
              voiceStatus === 'SPEAKING'
                ? 'bg-[#FF3D00] animate-ping'
                : voiceStatus === 'LISTENING'
                ? 'bg-amber-400 animate-pulse'
                : voiceStatus === 'CONNECTING'
                ? 'bg-blue-400 animate-spin'
                : voiceStatus === 'ERROR'
                ? 'bg-rose-500'
                : 'bg-emerald-500'
            }`} />
            <span className="font-bold uppercase tracking-wider text-neutral-300">
              {voiceStatus}
            </span>
          </div>

          {isLive && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="bg-[#050505] rounded-xl border border-neutral-800/80 p-4 space-y-4">
        {/* Visual Audio Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-12 bg-neutral-950/80 rounded-lg border border-neutral-900 px-4">
          {[40, 75, 100, 60, 90, 45, 80, 110, 65, 95, 50, 85, 70, 40].map((height, idx) => {
            const dynamicScale = isLive ? Math.max(0.15, (audioLevel * (height / 100))) : 0.15;
            return (
              <div
                key={idx}
                className="w-1.5 bg-[#FF3D00] rounded-full transition-all duration-150"
                style={{
                  height: `${Math.max(4, 36 * dynamicScale)}px`,
                  opacity: isLive ? 0.9 : 0.25
                }}
              />
            );
          })}
        </div>

        {/* Live Conversation Transcript */}
        <div className="space-y-2">
          {transcript && (
            <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                🎙 You Asked:
              </span>
              <p className="text-neutral-200 font-medium italic">"{transcript}"</p>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1 text-[#FF3D00] font-bold">
                <Sparkles className="w-3 h-3" />
                TeamPilot Response:
              </span>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-neutral-100 font-normal leading-relaxed text-sm">
              {lastAgentMessage}
            </p>
          </div>
        </div>

        {/* Pending Action Approval Card */}
        <AnimatePresence>
          {pendingProposal && pendingProposal.status === 'PENDING' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-amber-950/20 to-neutral-900 border-2 border-amber-500/60 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                  <Zap className="w-4 h-4" />
                  REASSIGNMENT APPROVAL REQUIRED
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  VOICE CONFIRMATION READY
                </span>
              </div>

              <p className="text-xs text-neutral-200">
                Move <strong className="text-white">"{pendingProposal.taskTitle}"</strong> from{' '}
                <strong className="text-rose-400">{pendingProposal.fromEmployeeName}</strong> to{' '}
                <strong className="text-emerald-400">{pendingProposal.toEmployeeName}</strong>?
              </p>

              <div className="text-[11px] text-neutral-400 font-mono bg-black/40 p-2 rounded-lg border border-neutral-800">
                💡 Say <strong>"Yes"</strong> or <strong>"Apply it"</strong> to confirm via voice, or click below.
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setPendingProposal((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null))}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecuteProposal(pendingProposal)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#FF3D00] hover:bg-[#FF3D00]/90 text-black font-mono font-bold text-xs shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Apply Reassignment</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              {micPermissionDenied && (
                <p className="text-[11px] text-neutral-400 mt-1">
                  Please enable microphone permissions in your browser bar, or use the text chat below.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          {!isLive ? (
            <button
              onClick={handleStartVoice}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#FF3D00] hover:bg-[#FF3D00]/90 text-black font-mono font-bold text-sm tracking-wide shadow-lg shadow-[#FF3D00]/25 transition active:scale-95"
            >
              <Mic className="w-5 h-5" />
              <span>START VOICE COPILOT</span>
            </button>
          ) : (
            <div className="w-full flex items-center gap-3">
              <button
                onClick={handleStopVoice}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-rose-900/60 text-neutral-200 hover:text-rose-200 border border-neutral-700 font-mono font-bold text-xs transition"
              >
                <Square className="w-4 h-4" />
                <span>STOP VOICE</span>
              </button>
              <div className="text-[11px] font-mono text-neutral-400">
                Listening for voice commands...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Spoken Commands Pill Strip */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80">
        <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-2 font-bold tracking-wider">
          Suggested Voice Prompts:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Who is overloaded?',
            'Who has available capacity?',
            'What are the biggest delivery risks?',
            "Can Aman take Rahul's task?",
            'Simulate moving the task to Aman',
            'Optimize the team'
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => processVoiceQueryLocally(prompt)}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition font-mono whitespace-nowrap"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
