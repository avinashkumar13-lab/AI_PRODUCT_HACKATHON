export type UserRole = 'manager' | 'team_member';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Backlog' | 'Assigned' | 'In Progress' | 'Review' | 'Blocked' | 'Completed' | 'Overdue';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Completed';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type WorkloadStatus = 'AVAILABLE' | 'HEALTHY' | 'HIGH WORKLOAD' | 'OVERLOADED' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  title: string;
  avatar: string;
  company?: string;
  isDemo?: boolean;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Employee {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  experience: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  workingHoursPerDay: number;
  weeklyCapacity: number;
  avatar: string;
  phone?: string;
  location?: string;
  performanceRating?: number;
  completedTasksCount?: number;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  key: string;
  description: string;
  client: string;
  priority: Priority;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  teamMemberIds: string[];
  taskIds: string[];
  budgetHours: number;
  spentHours: number;
  milestones: Milestone[];
}

export interface Task {
  id: string;
  userId?: string;
  taskNumber: string;
  title: string;
  description: string;
  projectId: string;
  priority: Priority;
  estimatedHours: number;
  actualHours: number;
  assignedEmployeeId: string | null;
  requiredSkills: string[];
  dependencies: string[]; // task IDs
  preferredEmployeeId?: string | null;
  startDate: string;
  deadline: string;
  status: TaskStatus;
  progress: number; // 0, 25, 50, 75, 100
  riskLevel: RiskLevel;
  riskReason?: string;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  employeeId: string;
  hours: number;
  date: string;
  note: string;
}

export interface AIRecommendation {
  id: string;
  type: 'task_assignment' | 'workload_redistribution' | 'deadline_risk' | 'schedule_optimization';
  title: string;
  taskId: string;
  taskTitle: string;
  taskHours: number;
  currentEmployeeId?: string | null;
  currentEmployeeName?: string;
  recommendedEmployeeId: string;
  recommendedEmployeeName: string;
  score?: number;
  reasons: string[];
  estimatedWorkingDays: number;
  calculatedDeadline: string;
  riskLevel: RiskLevel;
  beforeUtilization?: {
    fromEmployee: number;
    toEmployee: number;
  };
  afterUtilization?: {
    fromEmployee: number;
    toEmployee: number;
  };
  deliveryRiskReduction?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  relatedId?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginResponse {
  token: string;
  user: User;
  workspace: {
    employeesCount: number;
    projectsCount: number;
    tasksCount: number;
  };
}

export interface ThresholdSettings {
  availableMax: number; // default 50
  healthyMax: number;   // default 75
  highMax: number;      // default 90
  overloadedMax: number;// default 100
}

export interface AppSettings {
  thresholds: ThresholdSettings;
  autoRiskAnalysis: boolean;
  workingDaysPerWeek: number;
  workingHoursPerDay: number;
}

export interface EmployeeWorkloadSummary {
  employee: Employee;
  assignedHours: number;
  availableHours: number;
  weeklyCapacity: number;
  utilization: number;
  status: WorkloadStatus;
  activeTasksCount: number;
  overdueTasksCount: number;
  riskLevel: RiskLevel;
  tasks: Task[];
}

export interface TeamAnalyticsSummary {
  totalTeamMembers: number;
  activeProjects: number;
  activeTasks: number;
  totalActiveTasks?: number;
  completedTasksCount?: number;
  overdueTasks: number;
  atRiskTasks: number;
  overloadedEmployeesCount: number;
  totalTeamCapacity: number;
  totalAssignedHours: number;
  totalAvailableHours?: number;
  teamUtilization: number;
  onTimeCompletionRate: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
  actionCard?: {
    type: 'assignment_approval' | 'rebalance_approval' | 'simulation_result' | 'work_plan';
    data: any;
    status?: 'pending' | 'approved' | 'rejected';
  };
}

export interface DailyScheduleItem {
  id: string;
  timeSlot: string;
  taskId: string;
  taskTitle: string;
  priority: Priority;
  durationHours: number;
  category: string;
}
