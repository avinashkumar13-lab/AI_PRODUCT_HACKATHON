import { Task, Employee, Project, RiskLevel } from '../types';
import { calculateRealisticDeadline, getWorkingDaysBetween } from './deadlineEngine';

export interface TaskRiskAssessment {
  taskId: string;
  taskTitle: string;
  taskNumber: string;
  projectId: string;
  projectName: string;
  assigneeName: string;
  assigneeId?: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  primaryRiskFactor: string;
  details: string;
  recommendedAction: string;
  remainingHours: number;
  workingDaysLeft: number;
  isBlockedByDependency: boolean;
  blockingTaskTitle?: string;
}

export function analyzeTaskRisk(
  task: Task,
  employees: Employee[],
  projects: Project[],
  allTasks: Task[],
  currentDateStr: string = '2026-08-29'
): TaskRiskAssessment {
  const project = projects.find((p) => p.id === task.projectId);
  const employee = employees.find((e) => e.id === task.assignedEmployeeId);
  const remainingHours = Math.round(task.estimatedHours * (1 - (task.progress || 0) / 100) * 10) / 10;
  const workingDaysLeft = getWorkingDaysBetween(currentDateStr, task.deadline);

  // Check dependencies
  let isBlockedByDependency = false;
  let blockingTaskTitle: string | undefined;
  if (task.dependencies && task.dependencies.length > 0) {
    const uncompletedDependency = allTasks.find(
      (dep) => task.dependencies.includes(dep.id) && dep.status !== 'Completed'
    );
    if (uncompletedDependency) {
      isBlockedByDependency = true;
      blockingTaskTitle = `${uncompletedDependency.taskNumber}: ${uncompletedDependency.title}`;
    }
  }

  let riskLevel: RiskLevel = 'Low';
  let riskScore = 15;
  let primaryRiskFactor = 'Schedule & Capacity Optimal';
  let details = 'Deliverable is progressing within expected capacity buffers.';
  let recommendedAction = 'Maintain current pace and monitoring.';

  if (task.status === 'Completed') {
    return {
      taskId: task.id,
      taskTitle: task.title,
      taskNumber: task.taskNumber,
      projectId: task.projectId,
      projectName: project?.name || 'Unknown Project',
      assigneeName: employee?.name || 'Unassigned',
      assigneeId: employee?.id,
      riskLevel: 'Low',
      riskScore: 0,
      primaryRiskFactor: 'Completed',
      details: 'Task has been completed.',
      recommendedAction: 'None needed.',
      remainingHours: 0,
      workingDaysLeft,
      isBlockedByDependency: false
    };
  }

  // Check if unassigned
  if (!employee) {
    riskLevel = 'Medium';
    riskScore = 55;
    primaryRiskFactor = 'Unassigned Task';
    details = `Task requires ${remainingHours}h effort with ${workingDaysLeft} working days to deadline, but has no assigned engineer.`;
    recommendedAction = 'Use TeamPilot AI recommendation to assign a capable team member.';
  } else {
    // Assigned task checks
    const deadlineCalc = calculateRealisticDeadline(
      remainingHours,
      employee,
      allTasks,
      currentDateStr,
      task.deadline
    );

    const employeeActiveTasks = allTasks.filter(
      (t) => t.assignedEmployeeId === employee.id && t.status !== 'Completed'
    );
    const employeeTotalAssigned = employeeActiveTasks.reduce(
      (acc, t) => acc + t.estimatedHours * (1 - (t.progress || 0) / 100),
      0
    );
    const isEmployeeOverloaded = employeeTotalAssigned > employee.weeklyCapacity * 0.9;

    if (workingDaysLeft <= 0) {
      riskLevel = 'Critical';
      riskScore = 95;
      primaryRiskFactor = 'Overdue / Past Deadline';
      details = `Deadline was ${task.deadline}. Outstanding effort: ${remainingHours} hours.`;
      recommendedAction = 'Immediately extend deadline or pair assign with an available engineer.';
    } else if (isBlockedByDependency) {
      riskLevel = 'High';
      riskScore = 80;
      primaryRiskFactor = 'Blocked by Prerequisite Task';
      details = `Progress is hindered waiting on '${blockingTaskTitle}' to complete.`;
      recommendedAction = 'Expedite blocking dependency or decouple integration milestones.';
    } else if (!deadlineCalc.isFeasible || (workingDaysLeft > 0 && remainingHours / (workingDaysLeft * 4) > 1.2)) {
      riskLevel = isEmployeeOverloaded ? 'Critical' : 'High';
      riskScore = isEmployeeOverloaded ? 90 : 75;
      primaryRiskFactor = 'Severe Capacity Deficit';
      details = `${employee.name} has only ${deadlineCalc.availableHoursPerDay}h/day available, requiring ${deadlineCalc.estimatedWorkingDays} working days to complete, but only ${workingDaysLeft} days remain.`;
      recommendedAction = 'Reassign task or offload non-critical assignments using AI Optimizer.';
    } else if (isEmployeeOverloaded) {
      riskLevel = 'Medium';
      riskScore = 60;
      primaryRiskFactor = 'High Assignee Workload';
      details = `${employee.name} is running at ${Math.round((employeeTotalAssigned / employee.weeklyCapacity) * 100)}% weekly capacity.`;
      recommendedAction = 'Monitor progress closely in daily standups; consider shifting secondary tasks.';
    }
  }

  return {
    taskId: task.id,
    taskTitle: task.title,
    taskNumber: task.taskNumber,
    projectId: task.projectId,
    projectName: project?.name || 'Unknown Project',
    assigneeName: employee?.name || 'Unassigned',
    assigneeId: employee?.id,
    riskLevel,
    riskScore,
    primaryRiskFactor,
    details,
    recommendedAction,
    remainingHours,
    workingDaysLeft,
    isBlockedByDependency,
    blockingTaskTitle
  };
}

export function analyzeAllRisks(
  tasks: Task[],
  employees: Employee[],
  projects: Project[]
): TaskRiskAssessment[] {
  return tasks
    .filter((t) => t.status !== 'Completed')
    .map((task) => analyzeTaskRisk(task, employees, projects, tasks))
    .sort((a, b) => b.riskScore - a.riskScore);
}
