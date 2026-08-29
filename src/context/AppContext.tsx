import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { calculateAllWorkloads, calculateTeamAnalytics, calculateEmployeeWorkload } from '../utils/workloadEngine';
import { runWorkloadOptimizer } from '../utils/optimizerEngine';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentUser: User;
  currentRole: UserRole;
  selectedEmployeeId: string;
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  recommendations: AIRecommendation[];
  notifications: Notification[];
  settings: AppSettings;
  activeTab: string;
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

  // Actions
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

const STORAGE_KEY = 'teampilot_ai_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from local storage if available
  const [currentRole, setCurrentRole] = useState<UserRole>('manager');
  const [currentUser, setCurrentUser] = useState<User>(DEMO_MANAGER_USER);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp_aman');
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_employees');
    return saved ? JSON.parse(saved) : DEMO_EMPLOYEES;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_projects');
    return saved ? JSON.parse(saved) : DEMO_PROJECTS;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_tasks');
    return saved ? JSON.parse(saved) : DEMO_TASKS;
  });
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_recommendations');
    return saved ? JSON.parse(saved) : INITIAL_RECOMMENDATIONS;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_settings');
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

  // Save to local storage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(settings));
  }, [settings]);

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

  const switchRole = (role: UserRole, empId?: string) => {
    setCurrentRole(role);
    if (role === 'manager') {
      setCurrentUser(DEMO_MANAGER_USER);
      setActiveTab('dashboard');
    } else {
      const targetEmpId = empId || selectedEmployeeId || 'emp_aman';
      setSelectedEmployeeId(targetEmpId);
      const emp = employees.find((e) => e.id === targetEmpId) || employees[1]; // default Aman
      setCurrentUser({
        id: `usr_${emp.id}`,
        name: emp.name,
        email: emp.email,
        role: 'team_member',
        employeeId: emp.id,
        title: emp.role,
        avatar: emp.avatar
      });
      setActiveTab('my_dashboard');
    }
  };

  const createTask = (taskData: Partial<Task>, autoAssignEmployeeId?: string | null): Task => {
    const nextNumber = tasks.length + 101;
    const project = projects.find((p) => p.id === taskData.projectId) || projects[0];
    const projectKey = project.key || 'TASK';

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      taskNumber: `${projectKey}-${nextNumber}`,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      projectId: taskData.projectId || projects[0].id,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);

    // Add notification
    const assignedEmp = employees.find((e) => e.id === newTask.assignedEmployeeId);
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
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
      // Keep existing non-pending and prepend new ones
      const existingIds = new Set(plan.recommendations.map((r) => r.taskId));
      const filtered = prev.filter((r) => !existingIds.has(r.taskId) || r.status !== 'pending');
      return [...plan.recommendations, ...filtered];
    });

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
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
  };

  const updateEmployee = (empId: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, ...updates } : e))
    );
  };

  const createProject = (proj: Partial<Project>) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
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
    localStorage.removeItem(STORAGE_KEY + '_employees');
    localStorage.removeItem(STORAGE_KEY + '_projects');
    localStorage.removeItem(STORAGE_KEY + '_tasks');
    localStorage.removeItem(STORAGE_KEY + '_recommendations');
    localStorage.removeItem(STORAGE_KEY + '_notifications');
    localStorage.removeItem(STORAGE_KEY + '_settings');

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
        currentUser,
        currentRole,
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
