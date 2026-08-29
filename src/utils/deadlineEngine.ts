import { Employee, Task, AppSettings, RiskLevel } from '../types';

export interface DeadlineCalculationResult {
  estimatedHours: number;
  availableHoursPerDay: number;
  estimatedWorkingDays: number;
  recommendedDeadline: string; // YYYY-MM-DD
  riskLevel: RiskLevel;
  riskReason: string;
  isFeasible: boolean;
  warnings: string[];
}

export function addWorkingDays(startDateStr: string, workingDays: number): string {
  const date = new Date(startDateStr);
  let daysAdded = 0;
  
  while (daysAdded < workingDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWorkingDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (end <= start) return 0;

  let count = 0;
  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return count;
}

export function calculateRealisticDeadline(
  taskHours: number,
  employee: Employee,
  allTasks: Task[],
  startDateStr: string = '2026-08-29',
  requestedDeadlineStr?: string,
  _settings?: AppSettings
): DeadlineCalculationResult {
  const employeeTasks = allTasks.filter(
    (t) => t.assignedEmployeeId === employee.id && t.status !== 'Completed'
  );

  const currentAssignedHours = employeeTasks.reduce((acc, t) => {
    const remainingFraction = Math.max(0, 1 - (t.progress || 0) / 100);
    return acc + t.estimatedHours * remainingFraction;
  }, 0);

  const weeklyCapacity = employee.weeklyCapacity || 40;
  const availableWeeklyHours = Math.max(0, weeklyCapacity - currentAssignedHours);

  // Available hours per day for new work (over a 5-day work week)
  // If employee is 100%+ overloaded, give a minimum 0.5h allocation with a critical warning
  let availableHoursPerDay = availableWeeklyHours > 0 
    ? Math.max(0.5, Math.round((availableWeeklyHours / 5) * 10) / 10)
    : 0.5;

  // Working days needed = taskHours / availableHoursPerDay
  const estimatedWorkingDays = Math.max(1, Math.ceil(taskHours / availableHoursPerDay));
  const recommendedDeadline = addWorkingDays(startDateStr, estimatedWorkingDays);

  const warnings: string[] = [];
  let riskLevel: RiskLevel = 'Low';
  let riskReason = 'Employee has sufficient available capacity and no conflicting deadlines.';
  let isFeasible = true;

  if (availableWeeklyHours <= 4) {
    riskLevel = 'Critical';
    riskReason = `${employee.name} is nearly or fully overloaded (${Math.round((currentAssignedHours / weeklyCapacity) * 100)}% capacity). Daily throughput is severely constrained.`;
    warnings.push(`Employee has only ${availableWeeklyHours.toFixed(1)}h free capacity this week.`);
    isFeasible = false;
  } else if (availableWeeklyHours <= 10) {
    riskLevel = 'High';
    riskReason = `${employee.name} has only ${availableHoursPerDay.toFixed(1)}h/day available, stretching duration to ${estimatedWorkingDays} working days.`;
    warnings.push('High workload may cause competition with existing active deliverables.');
  } else if (availableWeeklyHours <= 18) {
    riskLevel = 'Medium';
    riskReason = `Comfortable pace (${availableHoursPerDay.toFixed(1)}h/day), estimated completion in ${estimatedWorkingDays} working days.`;
  }

  // If a requested target deadline was specified, check if realistic completion lands after it
  if (requestedDeadlineStr) {
    const availableWorkingDaysToRequested = getWorkingDaysBetween(startDateStr, requestedDeadlineStr);
    if (estimatedWorkingDays > availableWorkingDaysToRequested) {
      const daysShort = estimatedWorkingDays - availableWorkingDaysToRequested;
      riskLevel = 'Critical';
      riskReason = `Cannot meet requested deadline ${requestedDeadlineStr}. Estimated to finish ${daysShort} working day(s) late (${recommendedDeadline}).`;
      warnings.push(`Target deadline ${requestedDeadlineStr} is unachievable without reassigning other work.`);
      isFeasible = false;
    }
  }

  return {
    estimatedHours: taskHours,
    availableHoursPerDay,
    estimatedWorkingDays,
    recommendedDeadline,
    riskLevel,
    riskReason,
    isFeasible,
    warnings
  };
}
