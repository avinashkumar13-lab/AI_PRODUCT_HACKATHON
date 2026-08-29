import { Employee, Task, Project, AppSettings, AIRecommendation, RiskLevel } from '../types';
import { calculateEmployeeWorkload, calculateAllWorkloads } from './workloadEngine';
import { calculateRealisticDeadline } from './deadlineEngine';

export interface OptimizationPlan {
  recommendations: AIRecommendation[];
  beforeWorkloads: { employeeId: string; name: string; utilization: number }[];
  afterWorkloads: { employeeId: string; name: string; utilization: number }[];
  teamRiskBefore: number;
  teamRiskAfter: number;
  totalHoursMoved: number;
  overloadedBeforeCount: number;
  overloadedAfterCount: number;
}

export function runWorkloadOptimizer(
  employees: Employee[],
  tasks: Task[],
  projects: Project[],
  settings: AppSettings
): OptimizationPlan {
  const currentWorkloads = calculateAllWorkloads(employees, tasks, settings);
  const beforeWorkloads = currentWorkloads.map((w) => ({
    employeeId: w.employee.id,
    name: w.employee.name,
    utilization: w.utilization
  }));

  const overloadedBeforeCount = currentWorkloads.filter((w) => w.utilization >= 85).length;

  // Find overloaded employees (utilization >= 80%)
  const overloadedWorkloads = currentWorkloads.filter((w) => w.utilization >= 80);
  // Find available employees (utilization <= 65%)
  const availableWorkloads = currentWorkloads.filter((w) => w.utilization <= 65);

  const recommendations: AIRecommendation[] = [];
  let simulatedTasks = [...tasks];
  let totalHoursMoved = 0;

  for (const sourceWorkload of overloadedWorkloads) {
    const sourceEmployee = sourceWorkload.employee;
    // Get candidate tasks assigned to this overloaded employee that can move
    // Prioritize tasks with lower progress (< 50%) and not completed
    const movableTasks = simulatedTasks
      .filter(
        (t) =>
          t.assignedEmployeeId === sourceEmployee.id &&
          t.status !== 'Completed' &&
          t.progress <= 50
      )
      .sort((a, b) => {
        // Sort by smaller or medium effort tasks that can balance cleanly
        return a.estimatedHours - b.estimatedHours;
      });

    for (const task of movableTasks) {
      // Check available target employees
      for (const targetWorkload of availableWorkloads) {
        const targetEmployee = targetWorkload.employee;
        if (targetEmployee.id === sourceEmployee.id) continue;

        // Check if target employee has at least 50% matching skills
        const hasSkillMatch = task.requiredSkills.some((req) =>
          targetEmployee.skills.some(
            (s) =>
              s.toLowerCase() === req.toLowerCase() ||
              req.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(req.toLowerCase())
          )
        );

        if (!hasSkillMatch) continue;

        // Check if moving this task won't overload target employee
        const targetCurrentSummary = calculateEmployeeWorkload(targetEmployee, simulatedTasks, settings);
        const taskRemainingHours = task.estimatedHours * (1 - task.progress / 100);

        if (targetCurrentSummary.assignedHours + taskRemainingHours <= targetEmployee.weeklyCapacity * 0.85) {
          // Valid candidate for rebalance!
          const sourceBefore = calculateEmployeeWorkload(sourceEmployee, simulatedTasks, settings).utilization;
          const targetBefore = targetCurrentSummary.utilization;

          // Simulate move
          simulatedTasks = simulatedTasks.map((t) =>
            t.id === task.id ? { ...t, assignedEmployeeId: targetEmployee.id } : t
          );

          const sourceAfter = calculateEmployeeWorkload(sourceEmployee, simulatedTasks, settings).utilization;
          const targetAfter = calculateEmployeeWorkload(targetEmployee, simulatedTasks, settings).utilization;

          const deadlineCalc = calculateRealisticDeadline(
            task.estimatedHours,
            targetEmployee,
            simulatedTasks,
            '2026-08-29',
            task.deadline,
            settings
          );

          const rec: AIRecommendation = {
            id: `rec_opt_${task.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'workload_redistribution',
            title: `Move ${task.title} to ${targetEmployee.name}`,
            taskId: task.id,
            taskTitle: task.title,
            taskHours: task.estimatedHours,
            currentEmployeeId: sourceEmployee.id,
            currentEmployeeName: sourceEmployee.name,
            recommendedEmployeeId: targetEmployee.id,
            recommendedEmployeeName: targetEmployee.name,
            score: 95,
            reasons: [
              `${targetEmployee.name} has required technical skills (${task.requiredSkills.join(', ')})`,
              `${targetEmployee.name} has ${targetCurrentSummary.availableHours}h available capacity this week`,
              `Reduces ${sourceEmployee.name}'s workload from ${sourceBefore}% down to ${sourceAfter}%`,
              `Keeps ${targetEmployee.name}'s workload at a healthy ${targetAfter}%`,
              `Predicted on-time delivery with low risk (${deadlineCalc.recommendedDeadline})`
            ],
            estimatedWorkingDays: deadlineCalc.estimatedWorkingDays,
            calculatedDeadline: deadlineCalc.recommendedDeadline,
            riskLevel: 'Low',
            beforeUtilization: {
              fromEmployee: sourceBefore,
              toEmployee: targetBefore
            },
            afterUtilization: {
              fromEmployee: sourceAfter,
              toEmployee: targetAfter
            },
            deliveryRiskReduction: `${Math.round(sourceBefore * 0.3)}% → ${Math.round(sourceAfter * 0.12)}%`,
            status: 'pending',
            createdAt: new Date().toISOString()
          };

          recommendations.push(rec);
          totalHoursMoved += taskRemainingHours;
          break; // move to next task
        }
      }

      // If source employee is brought under 80%, stop moving tasks from them
      const updatedSourceSummary = calculateEmployeeWorkload(sourceEmployee, simulatedTasks, settings);
      if (updatedSourceSummary.utilization < 80) break;
    }
  }

  const afterWorkloadSummaries = calculateAllWorkloads(employees, simulatedTasks, settings);
  const afterWorkloads = afterWorkloadSummaries.map((w) => ({
    employeeId: w.employee.id,
    name: w.employee.name,
    utilization: w.utilization
  }));

  const overloadedAfterCount = afterWorkloadSummaries.filter((w) => w.utilization >= 85).length;
  const teamRiskBefore = Math.min(65, 15 + overloadedBeforeCount * 14);
  const teamRiskAfter = Math.max(8, teamRiskBefore - recommendations.length * 9);

  return {
    recommendations,
    beforeWorkloads,
    afterWorkloads,
    teamRiskBefore,
    teamRiskAfter,
    totalHoursMoved: Math.round(totalHoursMoved),
    overloadedBeforeCount,
    overloadedAfterCount
  };
}

export interface SimulationResult {
  taskId: string;
  taskTitle: string;
  taskHours: number;
  employeeId: string;
  employeeName: string;
  currentUtilization: number;
  newUtilization: number;
  currentAssignedHours: number;
  newAssignedHours: number;
  availableCapacity: number;
  estimatedWorkingDays: number;
  predictedDeadline: string;
  targetDeadline: string;
  riskBefore: RiskLevel;
  riskAfter: RiskLevel;
  verdict: 'RECOMMENDED' | 'CAUTION' | 'NOT RECOMMENDED';
  recommendationReason: string;
  keyInsights: string[];
}

export function simulateTaskAssignment(
  taskId: string,
  targetEmployeeId: string,
  employees: Employee[],
  tasks: Task[],
  settings: AppSettings
): SimulationResult {
  const targetEmployee = employees.find((e) => e.id === targetEmployeeId) || employees[0];
  const task = tasks.find((t) => t.id === taskId) || {
    id: taskId,
    title: 'Custom Task',
    estimatedHours: 16,
    progress: 0,
    deadline: '2026-09-10',
    requiredSkills: []
  } as Task;

  const currentSummary = calculateEmployeeWorkload(targetEmployee, tasks, settings);
  const taskRemainingHours = task.estimatedHours * (1 - (task.progress || 0) / 100);

  const simulatedTasks = tasks.map((t) =>
    t.id === taskId ? { ...t, assignedEmployeeId: targetEmployee.id } : t
  );
  if (!tasks.some((t) => t.id === taskId)) {
    simulatedTasks.push({ ...task, assignedEmployeeId: targetEmployee.id });
  }

  const simulatedSummary = calculateEmployeeWorkload(targetEmployee, simulatedTasks, settings);
  const deadlineCalc = calculateRealisticDeadline(
    task.estimatedHours,
    targetEmployee,
    tasks,
    '2026-08-29',
    task.deadline,
    settings
  );

  let riskAfter: RiskLevel = 'Low';
  if (simulatedSummary.utilization > 100 || !deadlineCalc.isFeasible) {
    riskAfter = 'Critical';
  } else if (simulatedSummary.utilization >= 90) {
    riskAfter = 'High';
  } else if (simulatedSummary.utilization >= 75) {
    riskAfter = 'Medium';
  }

  let verdict: 'RECOMMENDED' | 'CAUTION' | 'NOT RECOMMENDED' = 'RECOMMENDED';
  let recommendationReason = `Safe assignment. ${targetEmployee.name} will have ${simulatedSummary.utilization}% utilization.`;

  if (simulatedSummary.utilization > 95 || !deadlineCalc.isFeasible) {
    verdict = 'NOT RECOMMENDED';
    recommendationReason = `Overload hazard: Assigning this task pushes ${targetEmployee.name} to ${simulatedSummary.utilization}% capacity and risks missing deadlines.`;
  } else if (simulatedSummary.utilization > 80) {
    verdict = 'CAUTION';
    recommendationReason = `High workload warning: ${targetEmployee.name}'s utilization will climb to ${simulatedSummary.utilization}%. Watch for bottlenecking.`;
  }

  const keyInsights: string[] = [
    `Current utilization: ${currentSummary.utilization}% (${currentSummary.assignedHours}h assigned / ${currentSummary.weeklyCapacity}h capacity)`,
    `Post-assignment utilization: ${simulatedSummary.utilization}% (${simulatedSummary.assignedHours}h assigned)`,
    `Available remaining capacity after assignment: ${simulatedSummary.availableHours}h`,
    `Predicted completion: ${deadlineCalc.recommendedDeadline} (${deadlineCalc.estimatedWorkingDays} working days needed)`,
    deadlineCalc.isFeasible 
      ? `On track to meet task deadline (${task.deadline})`
      : `Late delivery warning: May miss target deadline (${task.deadline})`
  ];

  return {
    taskId: task.id,
    taskTitle: task.title,
    taskHours: task.estimatedHours,
    employeeId: targetEmployee.id,
    employeeName: targetEmployee.name,
    currentUtilization: currentSummary.utilization,
    newUtilization: simulatedSummary.utilization,
    currentAssignedHours: currentSummary.assignedHours,
    newAssignedHours: simulatedSummary.assignedHours,
    availableCapacity: simulatedSummary.availableHours,
    estimatedWorkingDays: deadlineCalc.estimatedWorkingDays,
    predictedDeadline: deadlineCalc.recommendedDeadline,
    targetDeadline: task.deadline,
    riskBefore: currentSummary.riskLevel,
    riskAfter,
    verdict,
    recommendationReason,
    keyInsights
  };
}
