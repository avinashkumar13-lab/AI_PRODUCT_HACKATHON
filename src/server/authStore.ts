import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  User,
  UserRole,
  Employee,
  Project,
  Task,
  AIRecommendation,
  Notification,
  AppSettings
} from '../types';
import {
  DEMO_EMPLOYEES,
  DEMO_PROJECTS,
  DEMO_TASKS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS
} from '../data/initialData';

export const JWT_SECRET = process.env.JWT_SECRET || 'teampilot_ai_jwt_secret_key_2026_enterprise_production';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  company: string;
  avatar: string;
  title?: string;
  employeeId?: string;
  resetCode?: string;
  resetCodeExpires?: number;
  createdAt: string;
}

export interface WorkspaceData {
  userId: string;
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  recommendations: AIRecommendation[];
  notifications: Notification[];
  settings: AppSettings;
}

// In-memory data store for accounts and workspaces
const usersByEmail = new Map<string, UserRecord>();
const usersById = new Map<string, UserRecord>();
const userWorkspaces = new Map<string, WorkspaceData>();

// Pre-seed default manager and employee accounts
function initializeDefaultAccounts() {
  const salt = bcrypt.genSaltSync(10);

  // 1. Default Manager (Sarah Jenkins)
  const managerId = 'usr_manager_sarah';
  const managerRecord: UserRecord = {
    id: managerId,
    email: 'manager@teampilot.ai',
    passwordHash: bcrypt.hashSync('password123', salt),
    name: 'Sarah Jenkins',
    role: 'manager',
    company: 'TeamPilot Enterprise',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'VP of Engineering',
    createdAt: new Date().toISOString()
  };
  usersByEmail.set(managerRecord.email.toLowerCase(), managerRecord);
  usersById.set(managerRecord.id, managerRecord);

  // Pre-seed manager's workspace with enterprise sample data
  userWorkspaces.set(managerId, {
    userId: managerId,
    employees: DEMO_EMPLOYEES.map((e) => ({ ...e, userId: managerId })),
    projects: DEMO_PROJECTS.map((p) => ({ ...p, userId: managerId })),
    tasks: DEMO_TASKS.map((t) => ({ ...t, userId: managerId })),
    recommendations: INITIAL_RECOMMENDATIONS.map((r) => ({ ...r, userId: managerId })),
    notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n, userId: managerId })),
    settings: { ...INITIAL_SETTINGS }
  });

  // 2. Default Employee (Aman Verma)
  const employeeId = 'usr_emp_aman';
  const employeeRecord: UserRecord = {
    id: employeeId,
    email: 'employee@teampilot.ai',
    passwordHash: bcrypt.hashSync('password123', salt),
    name: 'Aman Verma',
    role: 'team_member',
    company: 'TeamPilot Enterprise',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Frontend Architect',
    employeeId: 'emp_aman',
    createdAt: new Date().toISOString()
  };
  usersByEmail.set(employeeRecord.email.toLowerCase(), employeeRecord);
  usersById.set(employeeRecord.id, employeeRecord);

  // Employee shares manager workspace context for task assignment
  userWorkspaces.set(employeeId, {
    userId: employeeId,
    employees: DEMO_EMPLOYEES.map((e) => ({ ...e, userId: employeeId })),
    projects: DEMO_PROJECTS.map((p) => ({ ...p, userId: employeeId })),
    tasks: DEMO_TASKS.map((t) => ({ ...t, userId: employeeId })),
    recommendations: INITIAL_RECOMMENDATIONS.map((r) => ({ ...r, userId: employeeId })),
    notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n, userId: employeeId })),
    settings: { ...INITIAL_SETTINGS }
  });
}

initializeDefaultAccounts();

/**
 * Sign up a new user and initialize an empty, completely isolated workspace
 */
export function signUpUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'manager',
  company = 'My Enterprise'
): { user: User; token: string; workspace: WorkspaceData } {
  const normalizedEmail = email.trim().toLowerCase();

  if (usersByEmail.has(normalizedEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const defaultAvatar = role === 'manager'
    ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const userRecord: UserRecord = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    name: name.trim(),
    role,
    company: company.trim(),
    avatar: defaultAvatar,
    title: role === 'manager' ? 'Engineering Lead' : 'Software Engineer',
    createdAt: new Date().toISOString()
  };

  usersByEmail.set(normalizedEmail, userRecord);
  usersById.set(userId, userRecord);

  // New users start with a COMPLETELY EMPTY workspace
  const emptyWorkspace: WorkspaceData = {
    userId,
    employees: [],
    projects: [],
    tasks: [],
    recommendations: [],
    notifications: [
      {
        id: `notif_welcome_${Date.now()}`,
        userId,
        title: 'Welcome to Team Pilot AI',
        message: 'Your dedicated enterprise workspace is initialized. Start by adding team members or creating projects.',
        type: 'info',
        timestamp: 'Just now',
        read: false
      }
    ],
    settings: {
      ...INITIAL_SETTINGS
    }
  };

  userWorkspaces.set(userId, emptyWorkspace);

  const token = jwt.sign(
    {
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      company: userRecord.company
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const user: User = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role,
    avatar: userRecord.avatar,
    title: userRecord.title,
    company: userRecord.company,
    employeeId: userRecord.employeeId
  };

  return { user, token, workspace: emptyWorkspace };
}

/**
 * Log in an existing user
 */
export function loginUser(
  email: string,
  password: string
): { user: User; token: string; workspace: WorkspaceData } {
  const normalizedEmail = email.trim().toLowerCase();
  const userRecord = usersByEmail.get(normalizedEmail);

  if (!userRecord) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = bcrypt.compareSync(password, userRecord.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign(
    {
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      company: userRecord.company
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const user: User = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role,
    avatar: userRecord.avatar,
    title: userRecord.title,
    company: userRecord.company,
    employeeId: userRecord.employeeId
  };

  let workspace = userWorkspaces.get(userRecord.id);
  if (!workspace) {
    workspace = {
      userId: userRecord.id,
      employees: [],
      projects: [],
      tasks: [],
      recommendations: [],
      notifications: [],
      settings: { ...INITIAL_SETTINGS }
    };
    userWorkspaces.set(userRecord.id, workspace);
  }

  return { user, token, workspace };
}

/**
 * Request password reset code
 */
export function requestPasswordReset(email: string): { success: boolean; message: string; resetCode: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const user = usersByEmail.get(normalizedEmail);

  if (!user) {
    // Return friendly generic response for security
    return {
      success: true,
      message: 'If an account exists with this email, a recovery code has been generated.',
      resetCode: '849201'
    };
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins

  return {
    success: true,
    message: `Recovery code sent: ${resetCode}`,
    resetCode
  };
}

/**
 * Reset password with verification code
 */
export function resetPasswordWithCode(email: string, resetCode: string, newPassword: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const user = usersByEmail.get(normalizedEmail);

  if (!user) return false;
  if (!user.resetCode || user.resetCode !== resetCode.trim()) return false;
  if (user.resetCodeExpires && user.resetCodeExpires < Date.now()) return false;

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;

  return true;
}

/**
 * Verify JWT token
 */
export function verifyJwtToken(token: string): { userId: string; email: string; name: string; role: UserRole; company?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get workspace for a specific user ID
 */
export function getUserWorkspace(userId: string): WorkspaceData {
  let ws = userWorkspaces.get(userId);
  if (!ws) {
    ws = {
      userId,
      employees: [],
      projects: [],
      tasks: [],
      recommendations: [],
      notifications: [],
      settings: { ...INITIAL_SETTINGS }
    };
    userWorkspaces.set(userId, ws);
  }
  return ws;
}

/**
 * Set/update workspace for a specific user ID
 */
export function setUserWorkspace(userId: string, data: Partial<WorkspaceData>): WorkspaceData {
  const current = getUserWorkspace(userId);
  const updated: WorkspaceData = {
    ...current,
    ...data,
    userId
  };
  userWorkspaces.set(userId, updated);
  return updated;
}

/**
 * Seed starter enterprise template data into a user's isolated workspace
 */
export function seedStarterTemplate(userId: string): WorkspaceData {
  const populated: WorkspaceData = {
    userId,
    employees: DEMO_EMPLOYEES.map((e) => ({ ...e, userId })),
    projects: DEMO_PROJECTS.map((p) => ({ ...p, userId })),
    tasks: DEMO_TASKS.map((t) => ({ ...t, userId })),
    recommendations: INITIAL_RECOMMENDATIONS.map((r) => ({ ...r, userId })),
    notifications: [
      {
        id: `notif_seed_${Date.now()}`,
        userId,
        title: 'Starter Template Loaded',
        message: 'Successfully populated workspace with sample engineering team, projects, and active tasks.',
        type: 'success',
        timestamp: 'Just now',
        read: false
      },
      ...INITIAL_NOTIFICATIONS.map((n) => ({ ...n, userId }))
    ],
    settings: { ...INITIAL_SETTINGS }
  };

  userWorkspaces.set(userId, populated);
  return populated;
}

/**
 * Get unauthenticated / guest demo workspace
 */
export function getDemoGuestWorkspace(): WorkspaceData {
  return {
    userId: 'guest_demo',
    employees: DEMO_EMPLOYEES,
    projects: DEMO_PROJECTS,
    tasks: DEMO_TASKS,
    recommendations: INITIAL_RECOMMENDATIONS,
    notifications: INITIAL_NOTIFICATIONS,
    settings: INITIAL_SETTINGS
  };
}
