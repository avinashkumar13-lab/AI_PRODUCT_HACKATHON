import { Employee, Task, AppSettings, EmployeeWorkloadSummary, WorkloadStatus, RiskLevel, TeamAnalyticsSummary, Project } from '../types';

export function getWorkloadStatus(utilization: number, settings: AppSettings): WorkloadStatus {
  const { availableMax, healthyMax, highMax, overloadedMax } = settings.thresholds;
  if (utilization <= availableMax) return 'AVAILABLE';
  if (utilization <= healthyMax) return 'HEALTHY';
  if (utilization <= highMax) return 'HIGH WORKLOAD';
  if (utilization <= overloadedMax) return 'OVERLOADED';
  return 'CRITICAL';
}

export function calculateEmployeeWorkload(
  employee: Employee,
  allTasks: Task[],
  settings: AppSettings
): EmployeeWorkloadSummary {
  const employeeTasks = allTasks.filter(
    (t) => t.assignedEmployeeId === employee.id && t.status !== 'Completed'
  );

  // Assigned remaining hours = sum(estimatedHours * (1 - progress / 100))
  const assignedHours = employeeTasks.reduce((acc, task) => {
    const remainingFraction = Math.max(0, 1 - (task.progress || 0) / 100);
    return acc + task.estimatedHours * remainingFraction;
  }, 0);

  const roundedAssigned = Math.round(assignedHours * 10) / 10;
  const weeklyCapacity = employee.weeklyCapacity || 40;
  const availableHours = Math.max(0, Math.round((weeklyCapacity - roundedAssigned) * 10) / 10);
  const utilization = Math.round((roundedAssigned / weeklyCapacity) * 100);
  const status = getWorkloadStatus(utilization, settings);

  const activeTasksCount = employeeTasks.length;
  
  // Overdue check against current date (2026-08-29)
  const now = new Date('2026-08-29');
  const overdueTasksCount = employeeTasks.filter((t) => {
    const deadline = new Date(t.deadline);
    return deadline < now && t.status !== 'Completed';
  }).length;

  let riskLevel: RiskLevel = 'Low';
  if (utilization > 100 || overdueTasksCount > 1) {
    riskLevel = 'Critical';
  } else if (utilization >= 90 || overdueTasksCount === 1) {
    riskLevel = 'High';
  } else if (utilization >= 75) {
    riskLevel = 'Medium';
  }

  return {
    employee,
    assignedHours: roundedAssigned,
    availableHours,
    weeklyCapacity,
    utilization,
    status,
    activeTasksCount,
    overdueTasksCount,
    riskLevel,
    tasks: employeeTasks
  };
}

export function calculateAllWorkloads(
  employees: Employee[],
  allTasks: Task[],
  settings: AppSettings
): EmployeeWorkloadSummary[] {
  return employees.map((emp) => calculateEmployeeWorkload(emp, allTasks, settings));
}

export function calculateTeamAnalytics(
  employees: Employee[],
  projects: Project[],
  tasks: Task[],
  settings: AppSettings
): TeamAnalyticsSummary {
  const workloads = calculateAllWorkloads(employees, tasks, settings);
  
  const totalTeamMembers = employees.length;
  const activeProjects = projects.filter((p) => p.status !== 'Completed').length;
  const activeTasks = tasks.filter((t) => t.status !== 'Completed').length;
  
  const now = new Date('2026-08-29');
  const overdueTasks = tasks.filter((t) => {
    return t.status !== 'Completed' && new Date(t.deadline) < now;
  }).length;

  const atRiskTasks = tasks.filter(
    (t) => (t.riskLevel === 'High' || t.riskLevel === 'Critical') && t.status !== 'Completed'
  ).length;

  const overloadedEmployeesCount = workloads.filter(
    (w) => w.status === 'OVERLOADED' || w.status === 'CRITICAL'
  ).length;

  const totalTeamCapacity = employees.reduce((acc, e) => acc + (e.weeklyCapacity || 40), 0);
  const totalAssignedHours = Math.round(
    workloads.reduce((acc, w) => acc + w.assignedHours, 0) * 10
  ) / 10;

  const teamUtilization = totalTeamCapacity > 0
    ? Math.round((totalAssignedHours / totalTeamCapacity) * 100)
    : 0;

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const totalFinishedOrDue = completedTasks + overdueTasks;
  const onTimeCompletionRate = totalFinishedOrDue > 0
    ? Math.round((completedTasks / totalFinishedOrDue) * 100)
    : 92;

  const totalAvailableHours = Math.max(0, totalTeamCapacity - totalAssignedHours);

  return {
    totalTeamMembers,
    activeProjects,
    activeTasks,
    totalActiveTasks: activeTasks,
    completedTasksCount: completedTasks,
    overdueTasks,
    atRiskTasks,
    overloadedEmployeesCount,
    totalTeamCapacity,
    totalAssignedHours,
    totalAvailableHours,
    teamUtilization,
    onTimeCompletionRate
  };
}
