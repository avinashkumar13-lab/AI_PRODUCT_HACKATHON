import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  Employee,
  Project,
  Task,
  AIRecommendation,
  Notification,
  AppSettings,
  TaskStatus,
  EmployeeWorkloadSummary,
  TeamAnalyticsSummary
} from '../types';
import {
  DEMO_MANAGER_USER,
  DEMO_EMPLOYEES,
  DEMO_PROJECTS,
  DEMO_TASKS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS
} from '../data/initialData';
import { calculateAllWorkloads, calculateTeamAnalytics } from '../utils/workloadEngine';
import { runWorkloadOptimizer } from '../utils/optimizerEngine';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  isDemoMode: boolean;
  token: string | null;
  currentUser: User;
  currentRole: UserRole;
  isWorkspaceEmpty: boolean;

  // Auth modal controls
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot_password' | 'reset_password';
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot_password' | 'reset_password') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot_password' | 'reset_password') => void;

  // Auth operations
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role?: UserRole, company?: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetCode?: string }>;
  resetPassword: (email: string, resetCode: string, newPassword: string) => Promise<boolean>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  seedDemoData: () => Promise<void>;

  // Data state
  selectedEmployeeId: string;
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  recommendations: AIRecommendation[];
  notifications: Notification[];
  settings: AppSettings;
  activeTab: string;

  // Modals state
  selectedEmployeeForModal: Employee | null;
  selectedTaskForModal: Task | null;
  isCreateTaskModalOpen: boolean;
  isOptimizerModalOpen: boolean;
  isSimulateModalOpen: boolean;
  isEmployeeDetailModalOpen: boolean;
  isTaskDetailModalOpen: boolean;
  
  // Computed values
  workloads: EmployeeWorkloadSummary[];
  teamAnalytics: TeamAnalyticsSummary;
  unreadNotificationsCount: number;
  pendingRecommendationsCount: number;

  // Data mutation actions
  setActiveTab: (tab: string) => void;
  switchRole: (role: UserRole, employeeId?: string) => void;
  createTask: (taskData: Partial<Task>, autoAssignEmployeeId?: string | null) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  assignTask: (taskId: string, employeeId: string | null) => void;
  reassignTask: (taskId: string, newEmployeeId: string) => void;
  updateTaskProgress: (taskId: string, progress: number, newStatus?: TaskStatus) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  approveRecommendation: (recId: string) => void;
  rejectRecommendation: (recId: string) => void;
  applyAllPendingOptimizations: () => void;
  runOptimizer: () => void;
  addEmployee: (employee: Partial<Employee>) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  createProject: (project: Partial<Project>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  resetToDemoData: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  openCreateTaskModal: () => void;
  closeCreateTaskModal: () => void;
  openOptimizerModal: () => void;
  closeOptimizerModal: () => void;
  openSimulateModal: () => void;
  closeSimulateModal: () => void;
  openEmployeeDetailModal: (employee: Employee) => void;
  closeEmployeeDetailModal: () => void;
  openTaskDetailModal: (task: Task) => void;
  closeTaskDetailModal: () => void;
  triggerCelebration: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TOKEN_KEY = 'teampilot_jwt_token';
const USER_KEY = 'teampilot_auth_user';
const STORAGE_PREFIX = 'teampilot_ws_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => !localStorage.getItem(TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : DEMO_MANAGER_USER;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved).role : 'manager';
  });

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot_password' | 'reset_password'>('login');

  // Workspace data states (initialized based on auth status)
  const currentUserId = isAuthenticated ? currentUser.id : 'demo_guest';
  const getStorageKey = (key: string) => `${STORAGE_PREFIX}${currentUserId}_${key}`;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp_aman');
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (!isAuthenticated) return DEMO_EMPLOYEES;
    const saved = localStorage.getItem(getStorageKey('employees'));
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    if (!isAuthenticated) return DEMO_PROJECTS;
    const saved = localStorage.getItem(getStorageKey('projects'));
    return saved ? JSON.parse(saved) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!isAuthenticated) return DEMO_TASKS;
    const saved = localStorage.getItem(getStorageKey('tasks'));
    return saved ? JSON.parse(saved) : [];
  });
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => {
    if (!isAuthenticated) return INITIAL_RECOMMENDATIONS;
    const saved = localStorage.getItem(getStorageKey('recommendations'));
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (!isAuthenticated) return INITIAL_NOTIFICATIONS;
    const saved = localStorage.getItem(getStorageKey('notifications'));
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(getStorageKey('settings'));
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  // Modal visibility states
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState<boolean>(false);
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState<boolean>(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState<boolean>(false);

  // Check if authenticated workspace is empty
  const isWorkspaceEmpty = isAuthenticated && employees.length === 0 && projects.length === 0 && tasks.length === 0;

  // Persist state to local storage and sync to backend
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(getStorageKey('employees'), JSON.stringify(employees));
    }
  }, [employees, isAuthenticated, currentUserId]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(getStorageKey('projects'), JSON.stringify(projects));
    }
  }, [projects, isAuthenticated, currentUserId]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(getStorageKey('tasks'), JSON.stringify(tasks));
    }
  }, [tasks, isAuthenticated, currentUserId]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(getStorageKey('recommendations'), JSON.stringify(recommendations));
    }
  }, [recommendations, isAuthenticated, currentUserId]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(getStorageKey('notifications'), JSON.stringify(notifications));
    }
  }, [notifications, isAuthenticated, currentUserId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('settings'), JSON.stringify(settings));
  }, [settings, currentUserId]);

  // Sync to backend periodically or on major change
  const syncWorkspaceToBackend = useCallback(async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/workspace/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employees,
          projects,
          tasks,
          recommendations,
          notifications,
          settings
        })
      });
    } catch (e) {
      // Background sync silent failover
    }
  }, [token, employees, projects, tasks, recommendations, notifications, settings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncWorkspaceToBackend();
    }, 1500);
    return () => clearTimeout(timer);
  }, [syncWorkspaceToBackend]);

  // Load user data on startup if token exists
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Token expired');
        })
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            setCurrentRole(data.user.role);
            if (data.workspace) {
              setEmployees(data.workspace.employees || []);
              setProjects(data.workspace.projects || []);
              setTasks(data.workspace.tasks || []);
              setRecommendations(data.workspace.recommendations || []);
              setNotifications(data.workspace.notifications || []);
              if (data.workspace.settings) setSettings(data.workspace.settings);
            }
          }
        })
        .catch(() => {
          // Token invalid, logout gracefully
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setIsAuthenticated(false);
          setIsDemoMode(true);
        });
    }
  }, []);

  // Compute live workloads & team analytics
  const workloads = calculateAllWorkloads(employees, tasks, settings);
  const teamAnalytics = calculateTeamAnalytics(employees, projects, tasks, settings);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const pendingRecommendationsCount = recommendations.filter((r) => r.status === 'pending').length;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  // Auth Functions
  const openAuthModal = (mode: 'login' | 'signup' | 'forgot_password' | 'reset_password' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) return false;

      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      setCurrentRole(data.user.role);
      setIsAuthenticated(true);
      setIsDemoMode(false);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      if (data.workspace) {
        setEmployees(data.workspace.employees || []);
        setProjects(data.workspace.projects || []);
        setTasks(data.workspace.tasks || []);
        setRecommendations(data.workspace.recommendations || []);
        setNotifications(data.workspace.notifications || []);
        if (data.workspace.settings) setSettings(data.workspace.settings);
      }

      triggerCelebration();
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'manager',
    company = 'My Enterprise'
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, company })
      });

      if (!res.ok) return false;

      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      setCurrentRole(data.user.role);
      setIsAuthenticated(true);
      setIsDemoMode(false);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Brand new isolated workspace starts completely empty
      setEmployees([]);
      setProjects([]);
      setTasks([]);
      setRecommendations([]);
      setNotifications(data.workspace?.notifications || [
        {
          id: `notif_${Date.now()}`,
          title: 'Welcome to Team Pilot AI',
          message: 'Workspace initialized. Start adding team members or creating projects.',
          type: 'info',
          timestamp: 'Just now',
          read: false
        }
      ]);

      triggerCelebration();
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setIsAuthenticated(false);
    setIsDemoMode(true);
    setCurrentUser(DEMO_MANAGER_USER);
    setCurrentRole('manager');
    setEmployees(DEMO_EMPLOYEES);
    setProjects(DEMO_PROJECTS);
    setTasks(DEMO_TASKS);
    setRecommendations(INITIAL_RECOMMENDATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    setActiveTab('dashboard');
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to send recovery code' };
    }
  };

  const resetPassword = async (email: string, resetCode: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode, newPassword })
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setEmployees(DEMO_EMPLOYEES);
    setProjects(DEMO_PROJECTS);
    setTasks(DEMO_TASKS);
    setRecommendations(INITIAL_RECOMMENDATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
  };

  const exitDemoMode = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    }
  };

  const seedDemoData = async () => {
    if (token) {
      try {
        const res = await fetch('/api/workspace/seed-demo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.workspace) {
            setEmployees(data.workspace.employees);
            setProjects(data.workspace.projects);
            setTasks(data.workspace.tasks);
            setRecommendations(data.workspace.recommendations);
            setNotifications(data.workspace.notifications);
            triggerCelebration();
            return;
          }
        }
      } catch {
        // Fallback local seed
      }
    }

    setEmployees(DEMO_EMPLOYEES.map((e) => ({ ...e, userId: currentUser.id })));
    setProjects(DEMO_PROJECTS.map((p) => ({ ...p, userId: currentUser.id })));
    setTasks(DEMO_TASKS.map((t) => ({ ...t, userId: currentUser.id })));
    setRecommendations(INITIAL_RECOMMENDATIONS.map((r) => ({ ...r, userId: currentUser.id })));
    setNotifications([
      {
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        title: 'Starter Template Loaded',
        message: 'Successfully populated workspace with sample engineering team, projects, and active tasks.',
        type: 'success',
        timestamp: 'Just now',
        read: false
      }
    ]);
    triggerCelebration();
  };

  const switchRole = (role: UserRole, empId?: string) => {
    setCurrentRole(role);
    if (role === 'manager') {
      setCurrentUser(isAuthenticated ? { ...currentUser, role: 'manager' } : DEMO_MANAGER_USER);
      setActiveTab('dashboard');
    } else {
      const targetEmpId = empId || selectedEmployeeId || (employees[0]?.id || 'emp_aman');
      setSelectedEmployeeId(targetEmpId);
      const emp = employees.find((e) => e.id === targetEmpId) || employees[0];
      if (emp) {
        setCurrentUser({
          id: `usr_${emp.id}`,
          name: emp.name,
          email: emp.email,
          role: 'team_member',
          employeeId: emp.id,
          title: emp.role,
          avatar: emp.avatar
        });
      }
      setActiveTab('my_dashboard');
    }
  };

  const createTask = (taskData: Partial<Task>, autoAssignEmployeeId?: string | null): Task => {
    const nextNumber = tasks.length + 101;
    const project = projects.find((p) => p.id === taskData.projectId) || projects[0];
    const projectKey = project?.key || 'TASK';

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      taskNumber: `${projectKey}-${nextNumber}`,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      projectId: taskData.projectId || projects[0]?.id || 'proj_default',
      priority: taskData.priority || 'Medium',
      estimatedHours: Number(taskData.estimatedHours) || 8,
      actualHours: 0,
      assignedEmployeeId: autoAssignEmployeeId !== undefined ? autoAssignEmployeeId : (taskData.assignedEmployeeId || null),
      requiredSkills: taskData.requiredSkills || [],
      dependencies: taskData.dependencies || [],
      preferredEmployeeId: taskData.preferredEmployeeId || null,
      startDate: taskData.startDate || '2026-08-29',
      deadline: taskData.deadline || '2026-09-15',
      status: autoAssignEmployeeId ? 'Assigned' : (taskData.status || 'Backlog'),
      progress: 0,
      riskLevel: taskData.riskLevel || 'Low',
      riskReason: taskData.riskReason,
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);

    // Add notification
    const assignedEmp = employees.find((e) => e.id === newTask.assignedEmployeeId);
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: 'New Task Created',
      message: assignedEmp 
        ? `Task ${newTask.taskNumber} assigned to ${assignedEmp.name}.`
        : `Task ${newTask.taskNumber} created in Backlog.`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      relatedId: newTask.id
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const assignTask = (taskId: string, employeeId: string | null) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = employeeId ? (t.status === 'Backlog' ? 'Assigned' : t.status) : 'Backlog';
          return {
            ...t,
            assignedEmployeeId: employeeId,
            status: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );

    if (employeeId) {
      const emp = employees.find((e) => e.id === employeeId);
      const targetTask = tasks.find((t) => t.id === taskId);
      if (emp && targetTask) {
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            userId: currentUser.id,
            title: 'Task Assigned',
            message: `Task ${targetTask.taskNumber} (${targetTask.title}) assigned to ${emp.name}.`,
            type: 'info',
            timestamp: 'Just now',
            read: false,
            relatedId: taskId
          },
          ...prev
        ]);
      }
    }
  };

  const reassignTask = (taskId: string, newEmployeeId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const oldEmp = employees.find((e) => e.id === targetTask?.assignedEmployeeId);
    const newEmp = employees.find((e) => e.id === newEmployeeId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignedEmployeeId: newEmployeeId, updatedAt: new Date().toISOString() }
          : t
      )
    );

    if (targetTask && newEmp) {
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          userId: currentUser.id,
          title: 'Workload Rebalanced',
          message: `Reassigned "${targetTask.title}" from ${oldEmp?.name || 'Unassigned'} to ${newEmp.name}.`,
          type: 'success',
          timestamp: 'Just now',
          read: false,
          relatedId: taskId
        },
        ...prev
      ]);
    }
  };

  const updateTaskProgress = (taskId: string, progress: number, newStatus?: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          let status = newStatus || t.status;
          if (progress === 100) status = 'Completed';
          else if (progress > 0 && status === 'Assigned') status = 'In Progress';
          else if (progress === 0 && status === 'Completed') status = 'In Progress';

          return {
            ...t,
            progress,
            status,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );

    if (progress === 100) {
      triggerCelebration();
    }
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const progress = status === 'Completed' ? 100 : (t.progress === 100 ? 50 : t.progress);
          return {
            ...t,
            status,
            progress,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );

    if (status === 'Completed') {
      triggerCelebration();
    }
  };

  const approveRecommendation = (recId: string) => {
    const rec = recommendations.find((r) => r.id === recId);
    if (!rec) return;

    if (rec.type === 'workload_redistribution' || rec.type === 'task_assignment') {
      reassignTask(rec.taskId, rec.recommendedEmployeeId);
      if (rec.calculatedDeadline) {
        updateTask(rec.taskId, { deadline: rec.calculatedDeadline });
      }
    }

    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'approved' } : r))
    );

    triggerCelebration();

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        title: 'AI Recommendation Approved',
        message: `Approved: ${rec.title}. Workload and deadlines updated.`,
        type: 'success',
        timestamp: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const rejectRecommendation = (recId: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'rejected' } : r))
    );
  };

  const applyAllPendingOptimizations = () => {
    const pending = recommendations.filter((r) => r.status === 'pending');
    pending.forEach((rec) => {
      if (rec.type === 'workload_redistribution' || rec.type === 'task_assignment') {
        reassignTask(rec.taskId, rec.recommendedEmployeeId);
      }
    });

    setRecommendations((prev) =>
      prev.map((r) => (r.status === 'pending' ? { ...r, status: 'approved' } : r))
    );

    triggerCelebration();

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        title: 'Team Workload Fully Optimized',
        message: `Applied ${pending.length} AI task redistributions. Team utilization balanced!`,
        type: 'success',
        timestamp: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const runOptimizer = () => {
    const plan = runWorkloadOptimizer(employees, tasks, projects, settings);
    setRecommendations((prev) => {
      const existingIds = new Set(plan.recommendations.map((r) => r.taskId));
      const filtered = prev.filter((r) => !existingIds.has(r.taskId) || r.status !== 'pending');
      return [...plan.recommendations, ...filtered];
    });

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        title: 'AI Optimization Complete',
        message: `Generated ${plan.recommendations.length} recommendations. Potential risk reduction: ${plan.teamRiskBefore}% → ${plan.teamRiskAfter}%.`,
        type: 'info',
        timestamp: 'Just now',
        read: false
      },
      ...prev
    ]);

    setIsOptimizerModalOpen(true);
  };

  const addEmployee = (newEmp: Partial<Employee>) => {
    const id = `emp_${Date.now()}`;
    const employee: Employee = {
      id,
      userId: currentUser.id,
      name: newEmp.name || 'New Engineer',
      email: newEmp.email || `${id}@teampilot.ai`,
      role: newEmp.role || 'Software Engineer',
      department: newEmp.department || 'Engineering',
      skills: newEmp.skills || ['React', 'TypeScript', 'Node.js'],
      experience: newEmp.experience || 'Mid',
      workingHoursPerDay: newEmp.workingHoursPerDay || 8,
      weeklyCapacity: newEmp.weeklyCapacity || 40,
      avatar: newEmp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: newEmp.phone || '+1 (555) 000-0000',
      location: newEmp.location || 'Remote',
      performanceRating: 4.8,
      completedTasksCount: 0
    };
    setEmployees((prev) => [...prev, employee]);
    triggerCelebration();
  };

  const updateEmployee = (empId: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, ...updates } : e))
    );
  };

  const createProject = (proj: Partial<Project>) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      userId: currentUser.id,
      name: proj.name || 'New Project',
      key: proj.key || 'PROJ',
      description: proj.description || '',
      client: proj.client || 'Internal',
      priority: proj.priority || 'Medium',
      startDate: proj.startDate || '2026-08-29',
      deadline: proj.deadline || '2026-10-30',
      status: proj.status || 'On Track',
      teamMemberIds: proj.teamMemberIds || employees.slice(0, 3).map((e) => e.id),
      taskIds: [],
      budgetHours: proj.budgetHours || 200,
      spentHours: 0,
      milestones: proj.milestones || [
        { id: `ms_${Date.now()}`, title: 'Initial Milestone', dueDate: '2026-09-15', completed: false }
      ]
    };
    setProjects((prev) => [...prev, newProject]);
    triggerCelebration();
  };

  const updateProject = (projId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, ...updates } : p))
    );
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetToDemoData = () => {
    if (!isAuthenticated) {
      setEmployees(DEMO_EMPLOYEES);
      setProjects(DEMO_PROJECTS);
      setTasks(DEMO_TASKS);
      setRecommendations(INITIAL_RECOMMENDATIONS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setSettings(INITIAL_SETTINGS);
      setCurrentRole('manager');
      setCurrentUser(DEMO_MANAGER_USER);
      setActiveTab('dashboard');
      triggerCelebration();
    } else {
      seedDemoData();
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const openCreateTaskModal = () => setIsCreateTaskModalOpen(true);
  const closeCreateTaskModal = () => setIsCreateTaskModalOpen(false);
  const openOptimizerModal = () => setIsOptimizerModalOpen(true);
  const closeOptimizerModal = () => setIsOptimizerModalOpen(false);
  const openSimulateModal = () => setIsSimulateModalOpen(true);
  const closeSimulateModal = () => setIsSimulateModalOpen(false);

  const openEmployeeDetailModal = (emp: Employee) => {
    setSelectedEmployeeForModal(emp);
    setIsEmployeeDetailModalOpen(true);
  };
  const closeEmployeeDetailModal = () => {
    setSelectedEmployeeForModal(null);
    setIsEmployeeDetailModalOpen(false);
  };

  const openTaskDetailModal = (task: Task) => {
    setSelectedTaskForModal(task);
    setIsTaskDetailModalOpen(true);
  };
  const closeTaskDetailModal = () => {
    setSelectedTaskForModal(null);
    setIsTaskDetailModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isDemoMode,
        token,
        currentUser,
        currentRole,
        isWorkspaceEmpty,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        signup,
        logout,
        forgotPassword,
        resetPassword,
        enterDemoMode,
        exitDemoMode,
        seedDemoData,
        selectedEmployeeId,
        employees,
        projects,
        tasks,
        recommendations,
        notifications,
        settings,
        activeTab,
        selectedEmployeeForModal,
        selectedTaskForModal,
        isCreateTaskModalOpen,
        isOptimizerModalOpen,
        isSimulateModalOpen,
        isEmployeeDetailModalOpen,
        isTaskDetailModalOpen,
        workloads,
        teamAnalytics,
        unreadNotificationsCount,
        pendingRecommendationsCount,
        setActiveTab,
        switchRole,
        createTask,
        updateTask,
        deleteTask,
        assignTask,
        reassignTask,
        updateTaskProgress,
        updateTaskStatus,
        approveRecommendation,
        rejectRecommendation,
        applyAllPendingOptimizations,
        runOptimizer,
        addEmployee,
        updateEmployee,
        createProject,
        updateProject,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetToDemoData,
        updateSettings,
        openCreateTaskModal,
        closeCreateTaskModal,
        openOptimizerModal,
        closeOptimizerModal,
        openSimulateModal,
        closeSimulateModal,
        openEmployeeDetailModal,
        closeEmployeeDetailModal,
        openTaskDetailModal,
        closeTaskDetailModal,
        triggerCelebration
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
