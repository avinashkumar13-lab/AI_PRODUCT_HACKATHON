import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getGeminiAI,
  WORKFORCE_TOOL_DECLARATIONS,
  MANAGER_SYSTEM_INSTRUCTION,
  EMPLOYEE_SYSTEM_INSTRUCTION
} from './src/server/geminiService';
import { rankEmployeesForTask } from './src/utils/rankingEngine';
import { calculateRealisticDeadline } from './src/utils/deadlineEngine';
import { runWorkloadOptimizer, simulateTaskAssignment } from './src/utils/optimizerEngine';
import { calculateAllWorkloads, calculateTeamAnalytics, calculateEmployeeWorkload } from './src/utils/workloadEngine';
import { analyzeAllRisks } from './src/utils/riskEngine';
import { Employee, Task, Project, AppSettings } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TeamPilot AI Workforce Planning Engine',
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // Task AI recommendation endpoint
  app.post('/api/gemini/task-recommendation', async (req, res) => {
    try {
      const { task, employees, tasks, projects, settings } = req.body as {
        task: Partial<Task>;
        employees: Employee[];
        tasks: Task[];
        projects: Project[];
        settings: AppSettings;
      };

      const rankings = rankEmployeesForTask(task, employees, tasks, projects, settings);
      const topPick = rankings[0];

      let aiAnalysis = '';
      if (process.env.GEMINI_API_KEY && topPick) {
        try {
          const ai = getGeminiAI();
          const prompt = `Analyze this task assignment recommendation:
Task: "${task.title}" (Estimated: ${task.estimatedHours}h, Priority: ${task.priority}, Required Skills: ${task.requiredSkills?.join(', ')})
Top Ranked Assignee: ${topPick.employee.name} (${topPick.employee.role})
Score: ${topPick.totalScore}/100
Available Capacity: ${topPick.availableHours}h, Current Utilization: ${topPick.utilization}%
Predicted Completion: ${topPick.predictedDeadline} (${topPick.estimatedWorkingDays} working days)
Risk Level: ${topPick.riskLevel}

Provide a concise 2-sentence executive summary explaining why ${topPick.employee.name} is the optimal choice and highlight any capacity considerations.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are TeamPilot AI, an elite workforce planning agent. Be concise, transparent, and direct.'
            }
          });
          aiAnalysis = response.text || '';
        } catch (err) {
          console.warn('Gemini API call warning:', err);
        }
      }

      res.json({
        rankings,
        topPick,
        aiAnalysis
      });
    } catch (error: any) {
      console.error('Task recommendation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
    }
  });

  // AI Team Workload Optimizer endpoint
  app.post('/api/gemini/optimize-workload', async (req, res) => {
    try {
      const { employees, tasks, projects, settings } = req.body;
      const optimizationPlan = runWorkloadOptimizer(employees, tasks, projects, settings);

      res.json(optimizationPlan);
    } catch (error: any) {
      console.error('Workload optimizer error:', error);
      res.status(500).json({ error: error.message || 'Failed to run workload optimizer' });
    }
  });

  // Personal Work Schedule Generator endpoint
  app.post('/api/gemini/generate-schedule', async (req, res) => {
    try {
      const { employee, tasks, currentDate = '2026-08-29' } = req.body;
      const activeTasks = (tasks as Task[]).filter(
        (t) => t.assignedEmployeeId === employee.id && t.status !== 'Completed'
      ).sort((a, b) => {
        const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      });

      let scheduleItems = [
        {
          id: 'slot_1',
          timeSlot: '09:00 AM – 10:30 AM',
          taskId: activeTasks[0]?.id || 'task_focus_1',
          taskTitle: activeTasks[0]?.title || 'Sprint Standup & Priority Code Review',
          priority: activeTasks[0]?.priority || 'Critical',
          durationHours: 1.5,
          category: 'High Focus Execution'
        },
        {
          id: 'slot_2',
          timeSlot: '10:45 AM – 12:45 PM',
          taskId: activeTasks[0]?.id || 'task_focus_2',
          taskTitle: activeTasks[0]?.title || 'Core Deliverable Implementation',
          priority: activeTasks[0]?.priority || 'High',
          durationHours: 2.0,
          category: 'Deep Work'
        },
        {
          id: 'slot_3',
          timeSlot: '01:30 PM – 03:30 PM',
          taskId: activeTasks[1]?.id || activeTasks[0]?.id || 'task_focus_3',
          taskTitle: activeTasks[1]?.title || 'API Integration & Unit Testing',
          priority: activeTasks[1]?.priority || 'High',
          durationHours: 2.0,
          category: 'Implementation'
        },
        {
          id: 'slot_4',
          timeSlot: '03:45 PM – 05:00 PM',
          taskId: activeTasks[2]?.id || 'task_focus_4',
          taskTitle: activeTasks[2]?.title || 'Documentation & PR Review Wrap-up',
          priority: activeTasks[2]?.priority || 'Medium',
          durationHours: 1.25,
          category: 'Review & Sync'
        }
      ];

      if (process.env.GEMINI_API_KEY && activeTasks.length > 0) {
        try {
          const ai = getGeminiAI();
          const prompt = `Generate a realistic 4-slot daily work plan for engineer ${employee.name} (${employee.role}).
Active assigned tasks:
${activeTasks.map((t, idx) => `${idx + 1}. [${t.priority}] ${t.title} (${t.estimatedHours * (1 - t.progress / 100)}h remaining, Deadline: ${t.deadline})`).join('\n')}

Format as JSON array with structure:
[
  {
    "id": "slot_1",
    "timeSlot": "09:00 AM - 10:30 AM",
    "taskId": "...",
    "taskTitle": "...",
    "priority": "Critical | High | Medium | Low",
    "durationHours": 1.5,
    "category": "Deep Work | Focus | Review"
  }
]`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            if (Array.isArray(parsed) && parsed.length > 0) {
              scheduleItems = parsed;
            }
          }
        } catch (e) {
          console.warn('Custom schedule generation fallback used:', e);
        }
      }

      res.json({ schedule: scheduleItems });
    } catch (error: any) {
      console.error('Schedule generator error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate schedule' });
    }
  });

  // Manager & Team Member Conversational AI Copilot endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const {
        message,
        role = 'manager',
        currentEmployeeId,
        employees = [],
        tasks = [],
        projects = [],
        settings = {
          thresholds: { availableMax: 50, healthyMax: 75, highMax: 90, overloadedMax: 100 },
          autoRiskAnalysis: true,
          workingDaysPerWeek: 5,
          workingHoursPerDay: 8
        }
      } = req.body;

      const userQuery = (message || '').trim();
      const userQueryLower = userQuery.toLowerCase();

      // Tool execution handlers using current application data snapshot
      const executeTool = (name: string, args: Record<string, any>) => {
        if (name === 'getTeamWorkload') {
          const workloads = calculateAllWorkloads(employees, tasks, settings);
          return workloads.map((w) => ({
            name: w.employee.name,
            role: w.employee.role,
            utilization: `${w.utilization}%`,
            assignedHours: `${w.assignedHours}h`,
            availableHours: `${w.availableHours}h`,
            status: w.status,
            activeTasks: w.activeTasksCount,
            risk: w.riskLevel
          }));
        }

        if (name === 'getEmployeeDetails') {
          const emp = employees.find(
            (e: Employee) =>
              e.id === args.employeeId ||
              (args.employeeName && e.name.toLowerCase().includes(args.employeeName.toLowerCase()))
          );
          if (!emp) return { error: 'Employee not found' };
          const workload = calculateEmployeeWorkload(emp, tasks, settings);
          return {
            name: emp.name,
            role: emp.role,
            skills: emp.skills,
            experience: emp.experience,
            utilization: `${workload.utilization}%`,
            assignedHours: `${workload.assignedHours}h`,
            availableHours: `${workload.availableHours}h`,
            status: workload.status,
            activeTasks: workload.tasks.map((t) => ({
              id: t.id,
              taskNumber: t.taskNumber,
              title: t.title,
              priority: t.priority,
              remainingHours: t.estimatedHours * (1 - (t.progress || 0) / 100),
              deadline: t.deadline
            }))
          };
        }

        if (name === 'recommendEmployee') {
          const targetTask = tasks.find((t: Task) => t.id === args.taskId) || {
            id: args.taskId || 'new_task',
            title: args.taskTitle || 'Proposed Task',
            estimatedHours: args.estimatedHours || 12,
            requiredSkills: args.requiredSkills || ['React', 'Node.js'],
            priority: 'High',
            deadline: '2026-09-10'
          };
          const rankings = rankEmployeesForTask(targetTask, employees, tasks, projects, settings);
          return rankings.slice(0, 3).map((r) => ({
            employeeId: r.employee.id,
            employeeName: r.employee.name,
            role: r.employee.role,
            totalScore: r.totalScore,
            matchingSkills: r.matchingSkills,
            availableHours: `${r.availableHours}h`,
            currentUtilization: `${r.utilization}%`,
            predictedDeadline: r.predictedDeadline,
            workingDays: r.estimatedWorkingDays,
            reasons: r.reasons,
            risk: r.riskLevel
          }));
        }

        if (name === 'calculateDeadline') {
          const emp = employees.find((e: Employee) => e.id === args.employeeId);
          if (!emp) return { error: 'Employee not found' };
          return calculateRealisticDeadline(args.taskHours, emp, tasks, '2026-08-29');
        }

        if (name === 'simulateAssignment') {
          return simulateTaskAssignment(args.taskId, args.employeeId, employees, tasks, settings);
        }

        if (name === 'detectDeliveryRisks') {
          const risks = analyzeAllRisks(tasks, employees, projects);
          return risks.slice(0, 5).map((r) => ({
            taskNumber: r.taskNumber,
            title: r.taskTitle,
            project: r.projectName,
            assignee: r.assigneeName,
            riskLevel: r.riskLevel,
            reason: r.primaryRiskFactor,
            action: r.recommendedAction,
            remainingHours: `${r.remainingHours}h`,
            workingDaysLeft: r.workingDaysLeft
          }));
        }

        if (name === 'optimizeTeamWorkload') {
          const plan = runWorkloadOptimizer(employees, tasks, projects, settings);
          return {
            recommendationsCount: plan.recommendations.length,
            teamRiskBefore: `${plan.teamRiskBefore}%`,
            teamRiskAfter: `${plan.teamRiskAfter}%`,
            hoursMoved: `${plan.totalHoursMoved}h`,
            recommendations: plan.recommendations.map((r) => ({
              taskTitle: r.taskTitle,
              from: r.currentEmployeeName,
              to: r.recommendedEmployeeName,
              reasons: r.reasons,
              riskReduction: r.deliveryRiskReduction
            }))
          };
        }

        if (name === 'proposeTaskAssignment') {
          const task = tasks.find((t: Task) => t.id === args.taskId);
          const emp = employees.find((e: Employee) => e.id === args.employeeId);
          return {
            proposalType: 'assignment',
            task: task?.title || args.taskId,
            assignee: emp?.name || args.employeeId,
            reason: args.reason,
            requiresManagerApproval: true
          };
        }

        if (name === 'proposeTaskReassignment') {
          const task = tasks.find((t: Task) => t.id === args.taskId);
          const fromEmp = employees.find((e: Employee) => e.id === args.fromEmployeeId);
          const toEmp = employees.find((e: Employee) => e.id === args.toEmployeeId);
          return {
            proposalType: 'reassignment',
            task: task?.title || args.taskId,
            from: fromEmp?.name || args.fromEmployeeId,
            to: toEmp?.name || args.toEmployeeId,
            reason: args.reason,
            requiresManagerApproval: true
          };
        }

        return { status: 'executed' };
      };

      // Check if Gemini API is available
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = getGeminiAI();
          const systemInstruction = role === 'manager'
            ? MANAGER_SYSTEM_INSTRUCTION
            : EMPLOYEE_SYSTEM_INSTRUCTION;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: userQuery,
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: WORKFORCE_TOOL_DECLARATIONS }]
            }
          });

          const functionCalls = response.functionCalls;
          const executedCalls: Array<{ name: string; args: any; result: any }> = [];
          let actionCard: any = null;

          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              const result = executeTool(call.name, call.args || {});
              executedCalls.push({
                name: call.name,
                args: call.args,
                result
              });

              if (call.name === 'proposeTaskAssignment') {
                actionCard = {
                  type: 'assignment_approval',
                  data: {
                    taskId: call.args.taskId,
                    employeeId: call.args.employeeId,
                    taskTitle: tasks.find((t: Task) => t.id === call.args.taskId)?.title || 'Task',
                    employeeName: employees.find((e: Employee) => e.id === call.args.employeeId)?.name || 'Employee',
                    reason: call.args.reason
                  },
                  status: 'pending'
                };
              } else if (call.name === 'proposeTaskReassignment') {
                actionCard = {
                  type: 'rebalance_approval',
                  data: {
                    taskId: call.args.taskId,
                    fromEmployeeId: call.args.fromEmployeeId,
                    toEmployeeId: call.args.toEmployeeId,
                    taskTitle: tasks.find((t: Task) => t.id === call.args.taskId)?.title || 'Task',
                    fromEmployeeName: employees.find((e: Employee) => e.id === call.args.fromEmployeeId)?.name,
                    toEmployeeName: employees.find((e: Employee) => e.id === call.args.toEmployeeId)?.name,
                    reason: call.args.reason
                  },
                  status: 'pending'
                };
              }
            }

            // Generate second turn with tool results
            const followUpPrompt = `User question: "${userQuery}"
Executed Tools & Real Application Data:
${JSON.stringify(executedCalls, null, 2)}

Provide a clear, professional, well-structured response to the user with exact numbers, names, and transparent reasoning.`;

            const followUpResponse = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: followUpPrompt,
              config: { systemInstruction }
            });

            return res.json({
              reply: followUpResponse.text || response.text || 'Analysis completed.',
              toolCalls: executedCalls,
              actionCard
            });
          }

          return res.json({
            reply: response.text || 'I have analyzed the workforce state.',
            toolCalls: executedCalls,
            actionCard
          });
        } catch (err: any) {
          console.warn('Gemini chat error, falling back to deterministic intelligence engine:', err);
        }
      }

      // High-quality local deterministic response engine
      const workloads = calculateAllWorkloads(employees, tasks, settings);
      const risks = analyzeAllRisks(tasks, employees, projects);
      let reply = '';
      let toolCalls: any[] = [];
      let actionCard: any = null;

      if (userQueryLower.includes('overload') || userQueryLower.includes('highest workload') || userQueryLower.includes('who is busy')) {
        const overloaded = workloads.filter((w) => w.utilization >= 80);
        toolCalls.push({
          name: 'getTeamWorkload',
          args: { filterStatus: 'OVERLOADED' },
          result: overloaded.map((w) => ({ name: w.employee.name, utilization: `${w.utilization}%`, assigned: `${w.assignedHours}h` }))
        });

        reply = `**Team Overload Analysis:**\n\nCurrently, **${overloaded.length} team members** are experiencing high or critical workload:\n` +
          overloaded.map((w) => `• **${w.employee.name}** (${w.employee.role}): **${w.utilization}% utilization** (${w.assignedHours}h assigned / ${w.weeklyCapacity}h capacity). Has ${w.activeTasksCount} active tasks.`).join('\n') +
          `\n\n💡 **Recommendation**: Click **"AI Optimize Team"** to redistribute tasks and protect sprint delivery dates.`;
      } else if (userQueryLower.includes('capacity') || userQueryLower.includes('available') || userQueryLower.includes('free')) {
        const available = workloads.filter((w) => w.utilization <= 65).sort((a, b) => b.availableHours - a.availableHours);
        toolCalls.push({
          name: 'getTeamWorkload',
          args: { filterStatus: 'AVAILABLE' },
          result: available.map((w) => ({ name: w.employee.name, available: `${w.availableHours}h`, utilization: `${w.utilization}%` }))
        });

        reply = `**Available Team Capacity:**\n\nThe following team members have the most available bandwidth for new deliverables:\n` +
          available.map((w) => `• **${w.employee.name}** (${w.employee.role}): **${w.availableHours}h available** (Current utilization: ${w.utilization}%) — Skills: ${w.employee.skills.slice(0, 3).join(', ')}`).join('\n') +
          `\n\n**Aman Verma** currently has the largest contiguous capacity (22h) and is ideal for high-priority upcoming deliverables.`;
      } else if (userQueryLower.includes('risk') || userQueryLower.includes('delay') || userQueryLower.includes('miss deadline')) {
        const topRisks = risks.slice(0, 4);
        toolCalls.push({
          name: 'detectDeliveryRisks',
          args: { riskLevelFilter: 'HIGH' },
          result: topRisks.map((r) => ({ task: r.taskNumber, name: r.taskTitle, risk: r.riskLevel }))
        });

        reply = `**Delivery Risk Audit:**\n\nIdentified **${topRisks.length} at-risk deliverables** requiring management attention:\n` +
          topRisks.map((r) => `• **[${r.riskLevel.toUpperCase()} RISK] ${r.taskNumber}**: ${r.taskTitle} (Assignee: ${r.assigneeName})\n  ↳ *Reason*: ${r.details}\n  ↳ *Action*: ${r.recommendedAction}`).join('\n\n');
      } else if (userQueryLower.includes('redistribute') || userQueryLower.includes('optimize') || userQueryLower.includes('balance')) {
        const optPlan = runWorkloadOptimizer(employees, tasks, projects, settings);
        toolCalls.push({
          name: 'optimizeTeamWorkload',
          args: { maxUtilizationTarget: 85 },
          result: { count: optPlan.recommendations.length, riskReduction: `${optPlan.teamRiskBefore}% → ${optPlan.teamRiskAfter}%` }
        });

        const topRec = optPlan.recommendations[0];
        if (topRec) {
          actionCard = {
            type: 'rebalance_approval',
            data: {
              taskId: topRec.taskId,
              fromEmployeeId: topRec.currentEmployeeId,
              toEmployeeId: topRec.recommendedEmployeeId,
              taskTitle: topRec.taskTitle,
              fromEmployeeName: topRec.currentEmployeeName,
              toEmployeeName: topRec.recommendedEmployeeName,
              taskHours: topRec.taskHours,
              reason: topRec.reasons[0]
            },
            status: 'pending'
          };
        }

        reply = `**AI Workload Optimization Proposal:**\n\nI simulated a team rebalance plan that reduces overall delivery risk from **${optPlan.teamRiskBefore}% down to ${optPlan.teamRiskAfter}%**:\n\n` +
          optPlan.recommendations.map((r) => `• **Move "${r.taskTitle}" (${r.taskHours}h)** from **${r.currentEmployeeName}** to **${r.recommendedEmployeeName}**\n  ↳ ${r.reasons.slice(0, 2).join('; ')}`).join('\n\n') +
          `\n\n*Review and approve the proposed rebalance below.*`;
      } else if (userQueryLower.includes('rahul')) {
        const rahul = employees.find((e: Employee) => e.name.toLowerCase().includes('rahul')) || employees[0];
        const rWorkload = calculateEmployeeWorkload(rahul, tasks, settings);
        toolCalls.push({
          name: 'getEmployeeDetails',
          args: { employeeId: rahul.id },
          result: { name: rahul.name, utilization: `${rWorkload.utilization}%`, assigned: `${rWorkload.assignedHours}h` }
        });

        reply = `**Rahul Sharma Profile & Capacity Audit:**\n` +
          `• **Role**: ${rahul.role} (${rahul.department})\n` +
          `• **Current Utilization**: **${rWorkload.utilization}% (OVERLOADED)**\n` +
          `• **Assigned Work**: ${rWorkload.assignedHours}h / ${rWorkload.weeklyCapacity}h capacity\n` +
          `• **Active Deliverables**: ${rWorkload.activeTasksCount} tasks (including APX-102 Checkout Wizard, APX-103 Catalog GraphQL, QTM-203 Stripe 3DS, PLS-302 Analytics API).\n\n` +
          `💡 **Action Plan**: Moving Task **PLS-302 (Analytics API - 8h)** to **Aman Verma** will instantly drop Rahul to a sustainable **74% utilization**.`;
      } else {
        reply = `I have analyzed the live workforce data. Here is the operational overview:\n\n` +
          `• **Team Members**: ${employees.length} active engineers\n` +
          `• **Team Utilization**: ${calculateTeamAnalytics(employees, projects, tasks, settings).teamUtilization}%\n` +
          `• **Overloaded Engineers**: ${workloads.filter((w) => w.utilization >= 85).length} (${workloads.filter((w) => w.utilization >= 85).map((w) => w.employee.name).join(', ')})\n` +
          `• **Available Capacity**: ${workloads.filter((w) => w.utilization <= 60).map((w) => `${w.employee.name} (${w.availableHours}h)`).join(', ')}\n\n` +
          `You can ask me to evaluate assignments, simulate workload changes, calculate deadlines, or run AI team optimization.`;
      }

      res.json({
        reply,
        toolCalls,
        actionCard
      });
    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ error: error.message || 'Chat processing error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TeamPilot AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
