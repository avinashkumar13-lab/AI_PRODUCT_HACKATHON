import express, { Request, Response, NextFunction } from 'express';
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
import { Employee, Task, Project, AppSettings, UserRole } from './src/types';
import { DEMO_EMPLOYEES, DEMO_TASKS, DEMO_PROJECTS, INITIAL_SETTINGS } from './src/data/initialData';
import {
  signUpUser,
  loginUser,
  requestPasswordReset,
  resetPasswordWithCode,
  verifyJwtToken,
  getUserWorkspace,
  setUserWorkspace,
  seedStarterTemplate,
  getDemoGuestWorkspace
} from './src/server/authStore';

// Extend Express Request for authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    company?: string;
  };
}

// Authentication Middleware (Extracts JWT Bearer token)
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwtToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = decoded;
  next();
}

// Optional Auth Middleware (Allows guest / demo access if no token)
function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyJwtToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

// Shared in-memory active store for fallback operations
let activeEmployeesStore: Employee[] = [...DEMO_EMPLOYEES];
let activeTasksStore: Task[] = [...DEMO_TASKS];



async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TeamPilot AI Workforce Planning Engine',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      elevenlabsConfigured: !!(process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_AGENT_ID || process.env.VITE_ELEVENLABS_AGENT_ID)
    });
  });

  // ElevenLabs Configuration status endpoint (safe for frontend)
  app.get('/api/elevenlabs/config', (req, res) => {
    const rawAgentId = process.env.VITE_ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_AGENT_ID || '';
    const rawApiKey = process.env.ELEVENLABS_API_KEY || '';

    const isValidAgentId =
      Boolean(rawAgentId) &&
      rawAgentId.trim().length >= 10 &&
      !rawAgentId.startsWith('MY_') &&
      !rawAgentId.includes('PLACEHOLDER');

    const isValidApiKey =
      Boolean(rawApiKey) &&
      rawApiKey.trim().length >= 10 &&
      !rawApiKey.startsWith('MY_') &&
      !rawApiKey.includes('PLACEHOLDER');

    res.json({
      configured: Boolean(isValidAgentId && isValidApiKey),
      agentId: isValidAgentId ? rawAgentId : null,
      hasApiKey: isValidApiKey,
      hasAgentId: isValidAgentId
    });
  });

  // ElevenLabs Signed URL generation endpoint
  app.get('/api/elevenlabs/signed-url', async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const agentId = (req.query.agent_id as string) || process.env.ELEVENLABS_AGENT_ID || process.env.VITE_ELEVENLABS_AGENT_ID;

      if (!apiKey || apiKey.startsWith('MY_') || apiKey.length < 10) {
        return res.status(400).json({ error: 'ELEVENLABS_API_KEY is not configured or invalid on the server.' });
      }
      if (!agentId || agentId.startsWith('MY_') || agentId.length < 10) {
        return res.status(400).json({ error: 'ELEVENLABS_AGENT_ID is required and must be valid.' });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `ElevenLabs API error: ${errorText}` });
      }

      const data: any = await response.json();
      res.json({ signedUrl: data.signed_url });
    } catch (err: any) {
      console.warn('ElevenLabs signed URL error:', err);
      res.status(500).json({ error: err.message || 'Failed to acquire ElevenLabs signed URL' });
    }
  });

  // ==========================================
  // AUTHENTICATION & WORKSPACE ENDPOINTS
  // ==========================================

  // Signup Endpoint
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { name, email, password, role = 'manager', company = 'My Enterprise' } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const result = signUpUser(name, email, password, role, company);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Signup failed' });
    }
  });

  // Login Endpoint
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const result = loginUser(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  });

  // Forgot Password Endpoint
  app.post('/api/auth/forgot-password', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      const result = requestPasswordReset(email);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to initiate password recovery' });
    }
  });

  // Reset Password with Code Endpoint
  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { email, resetCode, newPassword } = req.body;
      if (!email || !resetCode || !newPassword) {
        return res.status(400).json({ error: 'Email, recovery code, and new password are required.' });
      }

      const success = resetPasswordWithCode(email, resetCode, newPassword);
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired recovery code.' });
      }

      res.json({ success: true, message: 'Password has been successfully updated.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reset password' });
    }
  });

  // Get Current Authenticated User & Workspace
  app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const workspace = getUserWorkspace(userId);
      res.json({
        user: req.user,
        workspace
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve user workspace' });
    }
  });

  // Get Workspace (authenticated or guest fallback)
  app.get('/api/workspace', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      if (req.user) {
        const ws = getUserWorkspace(req.user.userId);
        return res.json(ws);
      }
      // Demo / Guest mode
      res.json(getDemoGuestWorkspace());
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch workspace' });
    }
  });

  // Sync / Persist Workspace
  app.post('/api/workspace/sync', optionalAuthMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const workspaceData = req.body;
      if (req.user) {
        const updated = setUserWorkspace(req.user.userId, workspaceData);
        return res.json({ success: true, workspace: updated });
      }
      // Fallback updates to in-memory active store
      if (Array.isArray(workspaceData.employees)) {
        activeEmployeesStore = workspaceData.employees;
      }
      if (Array.isArray(workspaceData.tasks)) {
        activeTasksStore = workspaceData.tasks;
      }
      res.json({ success: true, mode: 'demo' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to sync workspace' });
    }
  });

  // Seed Starter Sample Template for Authenticated User
  app.post('/api/workspace/seed-demo', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const populated = seedStarterTemplate(req.user!.userId);
      res.json({ success: true, workspace: populated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to seed sample template' });
    }
  });


  // ==========================================
  // VOICE AGENT TOOLS & BACKEND REST APIS
  // ==========================================

  // 1. Team Workload Tool API
  app.all('/api/voice/team-workload', (req, res) => {
    try {
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;
      const settings = req.body?.settings || INITIAL_SETTINGS;

      const workloads = calculateAllWorkloads(employees, tasks, settings);
      const analytics = calculateTeamAnalytics(employees, req.body?.projects || DEMO_PROJECTS, tasks, settings);

      const overloaded = workloads
        .filter((w) => w.status === 'OVERLOADED' || w.status === 'CRITICAL' || w.utilization >= 85)
        .map((w) => ({
          employeeId: w.employee.id,
          name: w.employee.name,
          role: w.employee.role,
          utilization: w.utilization,
          assignedHours: w.assignedHours,
          availableHours: w.availableHours,
          activeTasks: w.activeTasksCount,
          weeklyCapacity: w.weeklyCapacity,
          status: w.status,
          riskLevel: w.riskLevel
        }));

      const available = workloads
        .filter((w) => w.status === 'AVAILABLE' || w.utilization <= 65)
        .sort((a, b) => b.availableHours - a.availableHours)
        .map((w) => ({
          employeeId: w.employee.id,
          name: w.employee.name,
          role: w.employee.role,
          utilization: w.utilization,
          assignedHours: w.assignedHours,
          availableHours: w.availableHours,
          activeTasks: w.activeTasksCount,
          weeklyCapacity: w.weeklyCapacity,
          status: w.status,
          skills: w.employee.skills
        }));

      const healthy = workloads
        .filter((w) => w.status === 'HEALTHY' || (w.utilization > 65 && w.utilization < 85))
        .map((w) => ({
          employeeId: w.employee.id,
          name: w.employee.name,
          role: w.employee.role,
          utilization: w.utilization,
          assignedHours: w.assignedHours,
          availableHours: w.availableHours,
          activeTasks: w.activeTasksCount,
          status: w.status
        }));

      res.json({
        teamSize: employees.length,
        teamUtilization: analytics.teamUtilization,
        totalAssignedHours: analytics.totalAssignedHours,
        totalAvailableHours: analytics.totalAvailableHours,
        overloaded,
        available,
        healthy,
        summary: `${overloaded.length} overloaded (${overloaded.map((o) => o.name).join(', ') || 'None'}), ${available.length} available with capacity.`
      });
    } catch (err: any) {
      console.error('Voice team workload error:', err);
      res.status(500).json({ error: err.message || 'Failed to calculate team workload' });
    }
  });

  // 2. Individual Employee Workload Tool API
  app.all(['/api/voice/employee-workload', '/api/voice/employee-workload/:employeeId'], (req, res) => {
    try {
      const employeeId =
        req.params?.employeeId ||
        req.query?.employeeId ||
        req.body?.employeeId ||
        req.query?.name ||
        req.body?.name;
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;
      const settings = req.body?.settings || INITIAL_SETTINGS;

      let emp = employees.find((e: Employee) => e.id === employeeId);
      if (!emp && typeof employeeId === 'string') {
        emp = employees.find((e: Employee) =>
          e.name.toLowerCase().includes(employeeId.toLowerCase())
        );
      }
      if (!emp) {
        emp = employees[0]; // fallback
      }

      const workload = calculateEmployeeWorkload(emp, tasks, settings);
      const activeTasks = workload.tasks.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        priority: t.priority,
        remainingHours: Math.round(t.estimatedHours * (1 - (t.progress || 0) / 100) * 10) / 10,
        deadline: t.deadline,
        requiredSkills: t.requiredSkills
      }));
      const highPriorityTasks = activeTasks.filter(
        (t) => t.priority === 'High' || t.priority === 'Critical'
      );

      res.json({
        employeeId: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        skills: emp.skills,
        utilization: workload.utilization,
        capacity: workload.weeklyCapacity,
        usedCapacity: workload.assignedHours,
        availableCapacity: workload.availableHours,
        activeTasks: activeTasks.length,
        highPriorityTasks,
        upcomingDeadlines: activeTasks.map((t) => ({ title: t.title, deadline: t.deadline })),
        workloadStatus: workload.status,
        riskLevel: workload.riskLevel,
        tasks: activeTasks
      });
    } catch (err: any) {
      console.error('Voice employee workload error:', err);
      res.status(500).json({ error: err.message || 'Failed to calculate employee workload' });
    }
  });

  // 3. Delivery Risks Tool API
  app.all('/api/voice/delivery-risks', (req, res) => {
    try {
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;
      const projects = req.body?.projects || DEMO_PROJECTS;

      const risks = analyzeAllRisks(tasks, employees, projects);
      const formattedRisks = risks.map((r) => ({
        taskId: r.taskId,
        taskNumber: r.taskNumber,
        taskTitle: r.taskTitle,
        project: r.projectName,
        assignee: r.assigneeName,
        priority: tasks.find((t: Task) => t.id === r.taskId)?.priority || 'High',
        deadline: tasks.find((t: Task) => t.id === r.taskId)?.deadline || '2026-09-10',
        remainingEffort: `${r.remainingHours}h`,
        remainingHours: r.remainingHours,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        reason: r.primaryRiskFactor,
        recommendedAction: r.recommendedAction,
        workingDaysLeft: r.workingDaysLeft
      }));

      res.json({
        totalRisks: formattedRisks.length,
        highRisks: formattedRisks.filter((r) => r.riskLevel === 'High' || r.riskLevel === 'Critical'),
        risks: formattedRisks
      });
    } catch (err: any) {
      console.error('Voice delivery risks error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze delivery risks' });
    }
  });

  // 4. Simulate Task Reassignment Tool API
  app.post('/api/voice/simulate-reassignment', (req, res) => {
    try {
      const { taskId, targetEmployeeId, taskTitle, employeeName } = req.body;
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;
      const settings = req.body?.settings || INITIAL_SETTINGS;

      let targetEmp = employees.find((e: Employee) => e.id === targetEmployeeId);
      if (!targetEmp && employeeName) {
        targetEmp = employees.find((e: Employee) =>
          e.name.toLowerCase().includes(employeeName.toLowerCase())
        );
      }
      if (!targetEmp) targetEmp = employees.find((e: Employee) => e.id === 'emp_aman') || employees[1];

      let targetTask = tasks.find((t: Task) => t.id === taskId);
      if (!targetTask && taskTitle) {
        targetTask = tasks.find((t: Task) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase())
        );
      }
      if (!targetTask) targetTask = tasks.find((t: Task) => t.assignedEmployeeId === 'emp_rahul') || tasks[0];

      const currentAssignee =
        employees.find((e: Employee) => e.id === targetTask.assignedEmployeeId) || employees[0];
      const simulation = simulateTaskAssignment(targetTask.id, targetEmp.id, employees, tasks, settings);

      const sourceCurrent = calculateEmployeeWorkload(currentAssignee, tasks, settings);
      const remainingHours = targetTask.estimatedHours * (1 - (targetTask.progress || 0) / 100);
      const sourceProjectedHours = Math.max(0, sourceCurrent.assignedHours - remainingHours);
      const sourceProjectedUtil = Math.round(
        (sourceProjectedHours / sourceCurrent.weeklyCapacity) * 100
      );

      res.json({
        task: targetTask.title,
        taskId: targetTask.id,
        currentAssignee: currentAssignee.name,
        currentAssigneeId: currentAssignee.id,
        targetEmployee: targetEmp.name,
        targetEmployeeId: targetEmp.id,
        currentUtilization: sourceCurrent.utilization,
        projectedCurrentUtilization: sourceProjectedUtil,
        targetCurrentUtilization: simulation.currentUtilization,
        projectedTargetUtilization: simulation.newUtilization,
        riskBefore: sourceCurrent.riskLevel,
        riskAfter: simulation.riskAfter,
        recommendation: simulation.verdict,
        reason: simulation.recommendationReason,
        insights: simulation.keyInsights
      });
    } catch (err: any) {
      console.error('Voice simulate reassignment error:', err);
      res.status(500).json({ error: err.message || 'Failed to simulate reassignment' });
    }
  });

  // 5. Propose Task Reassignment Tool API
  app.post('/api/voice/propose-reassignment', (req, res) => {
    try {
      const {
        taskId,
        fromEmployeeId,
        toEmployeeId,
        reason,
        taskTitle,
        fromEmployeeName,
        toEmployeeName
      } = req.body;
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;

      const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const task = tasks.find(
        (t: Task) =>
          t.id === taskId || (taskTitle && t.title.toLowerCase().includes(taskTitle.toLowerCase()))
      );
      const fromEmp = employees.find(
        (e: Employee) =>
          e.id === fromEmployeeId ||
          (fromEmployeeName && e.name.toLowerCase().includes(fromEmployeeName.toLowerCase()))
      );
      const toEmp = employees.find(
        (e: Employee) =>
          e.id === toEmployeeId ||
          (toEmployeeName && e.name.toLowerCase().includes(toEmployeeName.toLowerCase()))
      );

      res.json({
        proposalId,
        requiresApproval: true,
        status: 'PENDING',
        taskId: task?.id || taskId,
        taskTitle: task?.title || taskTitle || 'Payment Gateway',
        fromEmployeeId: fromEmp?.id || fromEmployeeId,
        fromEmployeeName: fromEmp?.name || fromEmployeeName || 'Rahul Sharma',
        toEmployeeId: toEmp?.id || toEmployeeId,
        toEmployeeName: toEmp?.name || toEmployeeName || 'Aman Verma',
        reason:
          reason ||
          `Workload rebalancing: ${fromEmp?.name || 'Rahul'} is overloaded and ${toEmp?.name || 'Aman'} has available capacity.`
      });
    } catch (err: any) {
      console.error('Voice propose reassignment error:', err);
      res.status(500).json({ error: err.message || 'Failed to propose reassignment' });
    }
  });

  // 6. Execute Task Reassignment Tool API
  app.post('/api/voice/execute-reassignment', (req, res) => {
    try {
      const { taskId, toEmployeeId, fromEmployeeId } = req.body;
      const employees = req.body?.employees || activeEmployeesStore;
      let tasks = req.body?.tasks || activeTasksStore;
      const settings = req.body?.settings || INITIAL_SETTINGS;

      let targetTask = tasks.find((t: Task) => t.id === taskId);
      if (!targetTask && req.body?.taskTitle) {
        targetTask = tasks.find((t: Task) =>
          t.title.toLowerCase().includes(req.body.taskTitle.toLowerCase())
        );
      }
      if (!targetTask) {
        targetTask = tasks.find((t: Task) => t.assignedEmployeeId === 'emp_rahul') || tasks[0];
      }

      let newEmp = employees.find((e: Employee) => e.id === toEmployeeId);
      if (!newEmp && req.body?.toEmployeeName) {
        newEmp = employees.find((e: Employee) =>
          e.name.toLowerCase().includes(req.body.toEmployeeName.toLowerCase())
        );
      }
      if (!newEmp) newEmp = employees.find((e: Employee) => e.id === 'emp_aman') || employees[1];

      // Reassign in server activeTasksStore as well
      targetTask.assignedEmployeeId = newEmp.id;
      targetTask.status = targetTask.status === 'Backlog' ? 'Assigned' : targetTask.status;
      targetTask.updatedAt = new Date().toISOString();

      activeTasksStore = activeTasksStore.map((t) =>
        t.id === targetTask!.id ? { ...targetTask! } : t
      );

      const updatedWorkloads = calculateAllWorkloads(employees, activeTasksStore, settings);
      const updatedRisks = analyzeAllRisks(activeTasksStore, employees, req.body?.projects || DEMO_PROJECTS);

      res.json({
        success: true,
        message: `Task "${targetTask.title}" successfully reassigned to ${newEmp.name}.`,
        task: targetTask,
        reassignedTo: {
          id: newEmp.id,
          name: newEmp.name
        },
        workloads: updatedWorkloads.map((w) => ({
          name: w.employee.name,
          utilization: w.utilization,
          status: w.status
        })),
        riskCount: updatedRisks.filter((r) => r.riskLevel === 'High' || r.riskLevel === 'Critical').length
      });
    } catch (err: any) {
      console.error('Voice execute reassignment error:', err);
      res.status(500).json({ error: err.message || 'Failed to execute reassignment' });
    }
  });

  // 7. Optimize Team Workload Tool API
  app.post('/api/voice/optimize', (req, res) => {
    try {
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;
      const projects = req.body?.projects || DEMO_PROJECTS;
      const settings = req.body?.settings || INITIAL_SETTINGS;

      const plan = runWorkloadOptimizer(employees, tasks, projects, settings);

      const formattedRecommendations = plan.recommendations.map((r) => ({
        taskId: r.taskId,
        taskTitle: r.taskTitle,
        from: r.currentEmployeeName,
        to: r.recommendedEmployeeName,
        fromEmployeeId: r.currentEmployeeId,
        toEmployeeId: r.recommendedEmployeeId,
        taskHours: r.taskHours,
        reason: r.reasons[0],
        riskImpact: r.deliveryRiskReduction
      }));

      res.json({
        success: true,
        count: formattedRecommendations.length,
        teamRiskBefore: `${plan.teamRiskBefore}%`,
        teamRiskAfter: `${plan.teamRiskAfter}%`,
        totalHoursMoved: plan.totalHoursMoved,
        recommendations: formattedRecommendations,
        summary: `Found ${formattedRecommendations.length} recommendations reducing team delivery risk from ${plan.teamRiskBefore}% to ${plan.teamRiskAfter}%.`
      });
    } catch (err: any) {
      console.error('Voice optimize error:', err);
      res.status(500).json({ error: err.message || 'Failed to optimize team workload' });
    }
  });

  // 8. Team Summary Tool API
  app.all('/api/voice/team-summary', (req, res) => {
    try {
      const employees = req.body?.employees || activeEmployeesStore;
      const tasks = req.body?.tasks || activeTasksStore;
      const projects = req.body?.projects || DEMO_PROJECTS;
      const settings = req.body?.settings || INITIAL_SETTINGS;

      const analytics = calculateTeamAnalytics(employees, projects, tasks, settings);
      const workloads = calculateAllWorkloads(employees, tasks, settings);
      const overloaded = workloads.filter((w) => w.utilization >= 85);
      const available = workloads.filter((w) => w.utilization <= 65);

      res.json({
        teamSize: employees.length,
        activeTasks: analytics.activeTasks,
        activeProjects: analytics.activeProjects,
        teamUtilization: `${analytics.teamUtilization}%`,
        overloadedCount: overloaded.length,
        overloadedNames: overloaded.map((o) => o.employee.name),
        availableCount: available.length,
        availableNames: available.map((a) => a.employee.name),
        onTimeRate: `${analytics.onTimeCompletionRate}%`
      });
    } catch (err: any) {
      console.error('Voice team summary error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate team summary' });
    }
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
      } else if (userQueryLower.includes('recommend') || userQueryLower.includes('who should') || userQueryLower.includes('who can do') || userQueryLower.includes('assignee for')) {
        const dummyTask = {
          id: 'custom_query_task',
          title: userQuery.replace(/recommend|assignee|who should|who can do|for/gi, '').trim() || 'New Deliverable',
          estimatedHours: 16,
          requiredSkills: ['Node.js', 'React', 'TypeScript', 'API'],
          priority: 'High' as const,
          deadline: '2026-09-12'
        };
        const rankings = rankEmployeesForTask(dummyTask, employees, tasks, projects, settings);
        const top = rankings[0];
        toolCalls.push({
          name: 'recommendEmployee',
          args: { taskTitle: dummyTask.title, estimatedHours: 16 },
          result: rankings.slice(0, 3).map((r) => ({
            name: r.employee.name,
            score: r.totalScore,
            utilization: `${r.utilization}%`,
            available: `${r.availableHours}h`,
            predictedDeadline: r.predictedDeadline
          }))
        });

        reply = `**AI Task Assignment Recommendation for "${dummyTask.title}":**\n\n` +
          `🥇 **Top Ranked: ${top.employee.name} (${top.employee.role})** — **Score: ${top.totalScore}/100**\n` +
          `• **Available Bandwidth**: ${top.availableHours}h (Current utilization: ${top.utilization}%)\n` +
          `• **Skill Match**: ${top.matchingSkills.join(', ') || 'Full stack competency'}\n` +
          `• **Projected Completion**: ${top.predictedDeadline} (${top.estimatedWorkingDays} working days)\n` +
          `• **Risk Assessment**: ${top.riskLevel} (${top.reasons[0]})\n\n` +
          `**Alternative Candidates**:\n` +
          rankings.slice(1, 3).map((r, i) => `${i + 2}. **${r.employee.name}** (Score: ${r.totalScore}/100, ${r.availableHours}h available, ${r.riskLevel} risk)`).join('\n');
      } else if (employees.some((e: Employee) => userQueryLower.includes(e.name.toLowerCase().split(' ')[0]))) {
        const matchedEmp = employees.find((e: Employee) => userQueryLower.includes(e.name.toLowerCase().split(' ')[0])) || employees[0];
        const empWorkload = calculateEmployeeWorkload(matchedEmp, tasks, settings);
        toolCalls.push({
          name: 'getEmployeeDetails',
          args: { employeeId: matchedEmp.id },
          result: {
            name: matchedEmp.name,
            role: matchedEmp.role,
            utilization: `${empWorkload.utilization}%`,
            assignedHours: `${empWorkload.assignedHours}h`,
            availableHours: `${empWorkload.availableHours}h`,
            tasksCount: empWorkload.activeTasksCount
          }
        });

        reply = `**${matchedEmp.name} — Profile & Capacity Audit:**\n` +
          `• **Role & Department**: ${matchedEmp.role} • ${matchedEmp.department}\n` +
          `• **Workload Status**: **${empWorkload.status} (${empWorkload.utilization}% utilization)**\n` +
          `• **Capacity**: ${empWorkload.assignedHours}h assigned / ${empWorkload.weeklyCapacity}h total (${empWorkload.availableHours}h available)\n` +
          `• **Skills**: ${matchedEmp.skills.join(', ')}\n` +
          `• **Active Deliverables (${empWorkload.activeTasksCount})**:\n` +
          empWorkload.tasks.map((t) => `  - **${t.taskNumber}**: ${t.title} (${t.priority}, ${Math.round(t.estimatedHours * (1 - (t.progress || 0) / 100))}h left, Due: ${t.deadline})`).join('\n');
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

  // AI Email Drafting Endpoint
  app.post('/api/gemini/draft-email', async (req, res) => {
    try {
      const { prompt, tone = 'professional', context = {} } = req.body;
      const { recipientName, subject, employeeName, taskTitle, projectKey, deadline, priority } = context;

      let emailSubject = subject || 'Workforce Update & Next Steps';
      let emailBody = '';

      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = getGeminiAI();
          const userPrompt = `Draft an email based on the following request:
Request: ${prompt || 'Draft an update email'}
Tone: ${tone}
Context:
${recipientName ? `- Recipient: ${recipientName}` : ''}
${employeeName ? `- Employee / Assignee: ${employeeName}` : ''}
${taskTitle ? `- Related Task: ${taskTitle}` : ''}
${projectKey ? `- Project: ${projectKey}` : ''}
${deadline ? `- Deadline: ${deadline}` : ''}
${priority ? `- Priority: ${priority}` : ''}

Output JSON format:
{
  "subject": "Clear, concise email subject line",
  "body": "Formatted email body in plain text with clear paragraphs",
  "bodyHtml": "Rich HTML formatted body with <p>, <strong>, <ul><li> tags as appropriate"
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: userPrompt,
            config: {
              responseMimeType: 'application/json',
              systemInstruction: 'You are TeamPilot AI executive email assistant. Create polite, clear, high-impact enterprise correspondence.'
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json(parsed);
          }
        } catch (err) {
          console.warn('Gemini draft email error, using fallback:', err);
        }
      }

      // Fallback draft template
      res.json({
        subject: emailSubject,
        body: `Hi ${recipientName || 'Team'},\n\nI am writing to share a brief update regarding ${taskTitle || 'our ongoing milestones'}.\n\nPlease let me know if you have any questions or require additional support.\n\nBest regards,\nTeam Pilot AI Workspace`,
        bodyHtml: `<p>Hi ${recipientName || 'Team'},</p><p>I am writing to share a brief update regarding <strong>${taskTitle || 'our ongoing milestones'}</strong>.</p><p>Please let me know if you have any questions or require additional support.</p><p>Best regards,<br/><strong>Team Pilot AI Workspace</strong></p>`
      });
    } catch (error: any) {
      console.error('Draft email error:', error);
      res.status(500).json({ error: error.message || 'Failed to draft email' });
    }
  });

  // AI Email to Task Parser Endpoint
  app.post('/api/gemini/email-to-task', async (req, res) => {
    try {
      const { emailSubject, emailBody, emailFrom, employees = [], projects = [] } = req.body;

      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = getGeminiAI();
          const prompt = `Extract a structured project task from this email content:
Sender: ${emailFrom}
Subject: ${emailSubject}
Body:
${(emailBody || '').substring(0, 3000)}

Available Projects:
${projects.map((p: Project) => `- ID: ${p.id}, Key: ${p.key}, Name: ${p.name}`).join('\n')}

Available Team Members:
${employees.map((e: Employee) => `- ID: ${e.id}, Name: ${e.name}, Role: ${e.role}, Skills: ${e.skills.join(', ')}`).join('\n')}

Output JSON format:
{
  "title": "Concise imperative task title (e.g. 'Implement Stripe Webhook Validation')",
  "description": "Clear 2-3 sentence task description summarizing requirements and acceptance criteria",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "estimatedHours": 8,
  "requiredSkills": ["Skill 1", "Skill 2"],
  "suggestedProjectId": "matching project ID from list or default",
  "suggestedEmployeeId": "matching employee ID based on skills or null",
  "deadlineDaysFromNow": 5
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              systemInstruction: 'You are TeamPilot AI Task Extraction Engine. Turn unstructured client or team emails into actionable engineering deliverables.'
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json(parsed);
          }
        } catch (err) {
          console.warn('Gemini email-to-task error, using fallback:', err);
        }
      }

      // Fallback extraction
      const fallbackProject = projects[0]?.id || 'proj_alpha';
      const fallbackEmployee = employees[0]?.id || null;

      res.json({
        title: (emailSubject || 'New Task from Email').replace(/^(Re|Fwd):\s*/i, ''),
        description: (emailBody || '').slice(0, 300).trim() || 'Task extracted from Gmail message.',
        priority: 'Medium',
        estimatedHours: 8,
        requiredSkills: ['Full Stack', 'API'],
        suggestedProjectId: fallbackProject,
        suggestedEmployeeId: fallbackEmployee,
        deadlineDaysFromNow: 7
      });
    } catch (error: any) {
      console.error('Email to task error:', error);
      res.status(500).json({ error: error.message || 'Failed to extract task from email' });
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
