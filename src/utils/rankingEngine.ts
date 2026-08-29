import { Employee, Task, Project, AppSettings, RiskLevel } from '../types';
import { calculateEmployeeWorkload } from './workloadEngine';
import { calculateRealisticDeadline, getWorkingDaysBetween } from './deadlineEngine';

export interface EmployeeMatchScore {
  employee: Employee;
  totalScore: number;
  skillMatchScore: number;
  capacityScore: number;
  deadlineScore: number;
  experienceScore: number;
  projectScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  utilization: number;
  assignedHours: number;
  availableHours: number;
  estimatedWorkingDays: number;
  predictedDeadline: string;
  riskLevel: RiskLevel;
  reasons: string[];
  isRecommended: boolean;
}

export function rankEmployeesForTask(
  task: Partial<Task>,
  employees: Employee[],
  allTasks: Task[],
  projects: Project[],
  settings: AppSettings
): EmployeeMatchScore[] {
  const taskHours = task.estimatedHours || 8;
  const requiredSkills = task.requiredSkills || [];
  const taskPriority = task.priority || 'Medium';
  const targetDeadline = task.deadline || '2026-09-15';
  const projectId = task.projectId;

  const project = projects.find((p) => p.id === projectId);
  const startDate = task.startDate || '2026-08-29';

  const scoredList = employees.map((employee) => {
    const workload = calculateEmployeeWorkload(employee, allTasks, settings);
    const deadlineCalc = calculateRealisticDeadline(
      taskHours,
      employee,
      allTasks,
      startDate,
      targetDeadline,
      settings
    );

    // 1. Skill Match (0 - 40 points)
    const empSkillsLower = employee.skills.map((s) => s.toLowerCase());
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach((req) => {
      const match = employee.skills.find(
        (s) => s.toLowerCase() === req.toLowerCase() ||
               req.toLowerCase().includes(s.toLowerCase()) ||
               s.toLowerCase().includes(req.toLowerCase())
      );
      if (match) {
        matchingSkills.push(match);
      } else {
        missingSkills.push(req);
      }
    });

    const skillRatio = requiredSkills.length > 0
      ? matchingSkills.length / requiredSkills.length
      : 1;
    const skillMatchScore = Math.round(skillRatio * 40);

    // 2. Capacity & Workload Score (0 - 30 points)
    // If utilization <= 50% -> 30 pts
    // If utilization <= 75% -> 22 pts
    // If utilization <= 90% -> 10 pts
    // If utilization > 90% -> -15 penalty
    let capacityScore = 0;
    if (workload.utilization <= 50) {
      capacityScore = 30;
    } else if (workload.utilization <= 75) {
      capacityScore = 24 - Math.round(((workload.utilization - 50) / 25) * 6);
    } else if (workload.utilization <= 90) {
      capacityScore = 12 - Math.round(((workload.utilization - 75) / 15) * 8);
    } else {
      capacityScore = -15; // Heavy penalty for overloaded
    }

    // 3. Deadline Compatibility Score (0 - 20 points)
    let deadlineScore = 0;
    const daysAvailable = getWorkingDaysBetween(startDate, targetDeadline);
    if (deadlineCalc.estimatedWorkingDays <= daysAvailable) {
      const buffer = daysAvailable - deadlineCalc.estimatedWorkingDays;
      deadlineScore = buffer >= 2 ? 20 : 15;
    } else {
      deadlineScore = -20; // Will miss deadline
    }

    // 4. Experience & Role Bonus (0 - 5 points)
    let experienceScore = 3;
    if (employee.experience === 'Lead' || employee.experience === 'Senior') {
      experienceScore = 5;
    } else if (employee.experience === 'Junior' && (taskPriority === 'Critical' || taskPriority === 'High')) {
      experienceScore = 1;
    }

    // 5. Project Familiarity (0 - 5 points)
    let projectScore = 0;
    if (project && project.teamMemberIds.includes(employee.id)) {
      projectScore = 5;
    }

    // Total clamped score (0 to 100)
    let rawTotal = skillMatchScore + capacityScore + deadlineScore + experienceScore + projectScore;
    const totalScore = Math.max(5, Math.min(99, rawTotal));

    // Formulate explainable reasons
    const reasons: string[] = [];
    if (skillRatio === 1) {
      reasons.push(`100% skill match for required technologies (${matchingSkills.join(', ')})`);
    } else if (skillRatio > 0.5) {
      reasons.push(`Matches ${matchingSkills.length} of ${requiredSkills.length} required skills (${matchingSkills.join(', ')})`);
    } else {
      reasons.push(`Missing key skill(s): ${missingSkills.join(', ')}`);
    }

    if (workload.availableHours >= taskHours) {
      reasons.push(`${workload.availableHours}h available capacity this week (Current utilization: ${workload.utilization}%)`);
    } else {
      reasons.push(`High current workload (${workload.utilization}% utilization with only ${workload.availableHours}h available)`);
    }

    if (deadlineCalc.isFeasible) {
      reasons.push(`Estimated completion in ${deadlineCalc.estimatedWorkingDays} working days (${deadlineCalc.recommendedDeadline}), meeting the target deadline`);
    } else {
      reasons.push(`Predicted completion (${deadlineCalc.recommendedDeadline}) risks missing the deadline`);
    }

    if (projectScore > 0) {
      reasons.push(`Already actively contributing to ${project?.name.split(':')[0] || 'the project'}`);
    }

    const isRecommended = totalScore >= 70 && deadlineCalc.isFeasible && workload.utilization < 90;

    return {
      employee,
      totalScore,
      skillMatchScore,
      capacityScore,
      deadlineScore,
      experienceScore,
      projectScore,
      matchingSkills,
      missingSkills,
      utilization: workload.utilization,
      assignedHours: workload.assignedHours,
      availableHours: workload.availableHours,
      estimatedWorkingDays: deadlineCalc.estimatedWorkingDays,
      predictedDeadline: deadlineCalc.recommendedDeadline,
      riskLevel: deadlineCalc.riskLevel,
      reasons,
      isRecommended
    };
  });

  return scoredList.sort((a, b) => b.totalScore - a.totalScore);
}
