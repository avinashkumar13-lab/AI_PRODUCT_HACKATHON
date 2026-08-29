import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

export const WORKFORCE_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'getTeamWorkload',
    description: 'Get comprehensive workload and capacity utilization statistics for all 8 team members.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filterStatus: {
          type: Type.STRING,
          description: 'Optional filter by workload status: ALL, OVERLOADED, AVAILABLE, HEALTHY'
        }
      }
    }
  },
  {
    name: 'getEmployeeDetails',
    description: 'Get detailed profile, skill set, weekly capacity, available hours, and active assignments for a specific employee.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        employeeId: {
          type: Type.STRING,
          description: 'ID of employee (e.g. emp_rahul, emp_aman, emp_priya, emp_elena, emp_marcus, emp_aisha, emp_david, emp_sofia)'
        },
        employeeName: {
          type: Type.STRING,
          description: 'Name of the employee (e.g. Rahul, Aman, Priya)'
        }
      }
    }
  },
  {
    name: 'recommendEmployee',
    description: 'Analyze skills, current workload, capacity, and deadlines to rank and recommend the best employee for a specific task.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'ID of the task to recommend an assignee for'
        },
        taskTitle: {
          type: Type.STRING,
          description: 'Title of the task'
        },
        estimatedHours: {
          type: Type.NUMBER,
          description: 'Estimated hours of effort required'
        },
        requiredSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of required skill keywords'
        }
      }
    }
  },
  {
    name: 'calculateDeadline',
    description: 'Calculate realistic completion deadline for a task based on employee true available daily capacity, existing workloads, and weekends.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskHours: {
          type: Type.NUMBER,
          description: 'Estimated task duration in hours'
        },
        employeeId: {
          type: Type.STRING,
          description: 'Employee ID'
        }
      },
      required: ['taskHours', 'employeeId']
    }
  },
  {
    name: 'simulateAssignment',
    description: 'Simulate what would happen to an employee capacity, utilization, and deadline risks if assigned a specific task before making any actual changes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: {
          type: Type.STRING,
          description: 'Task ID'
        },
        employeeId: {
          type: Type.STRING,
          description: 'Target Employee ID'
        }
      },
      required: ['taskId', 'employeeId']
    }
  },
  {
    name: 'detectDeliveryRisks',
    description: 'Analyze all active tasks across projects to detect schedule slippage, capacity bottlenecks, and dependency blockers.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        riskLevelFilter: {
          type: Type.STRING,
          description: 'Filter by risk severity: ALL, HIGH, CRITICAL, MEDIUM'
        }
      }
    }
  },
  {
    name: 'optimizeTeamWorkload',
    description: 'Run full team optimization engine to identify overloaded engineers and find optimal work transfers to available team members.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        maxUtilizationTarget: {
          type: Type.NUMBER,
          description: 'Target upper ceiling for utilization (default 85%)'
        }
      }
    }
  },
  {
    name: 'proposeTaskAssignment',
    description: 'Prepare a formal task assignment proposal that requires manager approval before executing the write operation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING, description: 'Task ID' },
        employeeId: { type: Type.STRING, description: 'Target Employee ID' },
        reason: { type: Type.STRING, description: 'Clear reason for assignment' }
      },
      required: ['taskId', 'employeeId', 'reason']
    }
  },
  {
    name: 'proposeTaskReassignment',
    description: 'Prepare a formal task reassignment proposal moving a task from an overloaded employee to an available employee with manager approval.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING, description: 'Task ID to move' },
        fromEmployeeId: { type: Type.STRING, description: 'Current Assignee ID' },
        toEmployeeId: { type: Type.STRING, description: 'New Assignee ID' },
        reason: { type: Type.STRING, description: 'Justification for moving task' }
      },
      required: ['taskId', 'fromEmployeeId', 'toEmployeeId', 'reason']
    }
  },
  {
    name: 'generatePersonalSchedule',
    description: 'Generate an optimized daily work plan with chronological time blocks for an individual team member based on urgency and dependencies.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        employeeId: { type: Type.STRING, description: 'Employee ID' }
      },
      required: ['employeeId']
    }
  }
];

export const MANAGER_SYSTEM_INSTRUCTION = `You are TeamPilot Manager Copilot, an elite AI workforce planning, task assignment, and delivery intelligence agent.
Your mission is to provide engineering managers with instant, transparent visibility into team capacity, automatically identify delivery risk, calculate conservative realistic completion deadlines, and optimize workload distribution.

IMPORTANT PRINCIPLES:
1. Always base answers on the application's actual data. Call tools whenever team, employee, task, project, or capacity info is needed.
2. Separate READ and WRITE operations:
   - For read operations (workload checks, risk audits, simulation, candidate ranking), execute the tool and provide analytical, transparent explanations.
   - For write operations (assigning a task, reassigning, moving work, changing deadlines), explain the recommendation and call proposeTaskAssignment or proposeTaskReassignment so the manager sees an interactive approval card.
3. Be transparent with scores, capacity calculations, and reasons (e.g. Skill Match %, Available Hours, Current Utilization %, Predicted Duration in working days, Risk Level).
4. Never recommend an overloaded employee without issuing a strong warning or stating why no alternative exists.
5. Keep communication polished, direct, objective, and executive-ready.`;

export const EMPLOYEE_SYSTEM_INSTRUCTION = `You are TeamPilot Personal Assistant, an intelligent productivity and work scheduling companion for team members.
Your mission is to help the logged-in team member prioritize their assigned tasks, manage deadlines, identify bottlenecks, and generate optimized daily work schedules.

IMPORTANT PRINCIPLES:
1. Only focus on the logged-in employee's tasks, projects, and personal capacity.
2. Prioritize tasks intelligently based on: Urgency, Deadlines, Priority, Prerequisite Dependencies, and Estimated Remaining Hours.
3. When generating daily work plans, break down the day into clear, realistic time blocks with buffer time.
4. Be supportive, concise, and actionable.`;
