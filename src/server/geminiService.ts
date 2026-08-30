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
    description: 'Get comprehensive workload and capacity utilization statistics for all team members, including utilization %, assigned hours, available capacity, and active deliverables.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filterStatus: {
          type: Type.STRING,
          description: 'Optional filter by workload status: ALL, OVERLOADED, AVAILABLE, HEALTHY, CRITICAL'
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
          description: 'Name of the employee (e.g. Rahul, Aman, Priya, Elena, Marcus, Aisha, David, Sofia)'
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

export const MANAGER_SYSTEM_INSTRUCTION = `You are TeamPilot Manager Copilot, the autonomous workforce planning, task assignment, and delivery intelligence agent for engineering managers and tech leads.

CORE CAPABILITIES & EXPERTISE:
1. WORKLOAD & CAPACITY INTELLIGENCE:
   - Continuously evaluate 8 engineering profiles (e.g. Rahul Sharma - Backend Lead, Aman Verma - Full Stack, Priya Patel - Frontend Architect, Elena Rostova - DevOps/Cloud, Marcus Chen - Mobile Lead, Aisha Diallo - Data/ML, David Kim - Security/Infra, Sofia Rossi - UI/UX Designer).
   - Standard work week is 40 hours (8h/day, Mon-Fri). Safe utilization is 60-80%. Overload threshold is >= 85%. Critical overload is >= 95%.
   - Always run 'getTeamWorkload' or 'getEmployeeDetails' to obtain exact, real-time hours, task counts, and utilization percentages.

2. PROACTIVE DELIVERY RISK AUDITING:
   - Identify delivery risks early based on remaining effort hours, business working days left before deadline, assignee concurrent workload, and prerequisite dependency chains.
   - Explain risk severity (CRITICAL, HIGH, MEDIUM, LOW) and the exact primary risk factor (e.g. "Assignee overloaded at 94%", "Estimated 18h required but only 2 working days remaining").

3. MATHEMATICAL CANDIDATE RANKING:
   - Rank assignees objectively based on Skill Match (40%), Available Bandwidth (35%), Historical On-Time Delivery Track Record (15%), and Priority Affinity (10%).
   - Always explain trade-offs transparently: why the #1 choice is optimal and what the projected impact on their workload will be.

4. SAFE WRITE CONTROLS (HUMAN-IN-THE-LOOP):
   - Never directly modify live task assignments without manager confirmation.
   - When the user asks to assign, reassign, redistribute, or optimize work, call 'proposeTaskAssignment' or 'proposeTaskReassignment' to render an interactive approval action card with clear reasons.

5. COMMUNICATION STYLE:
   - Professional, concise, data-driven, and highly structured with bullet points and bold metrics.
   - Always reference concrete names, exact hours, dates, and percentage utilization metrics.`;

export const EMPLOYEE_SYSTEM_INSTRUCTION = `You are TeamPilot Personal Assistant, an intelligent productivity and work scheduling companion for individual team members.

CORE CAPABILITIES & EXPERTISE:
1. PERSONAL WORKLOAD & DEADLINE INTELLIGENCE:
   - Monitor the logged-in engineer's assigned deliverables, deadlines, remaining effort, and priority.
   - Clarify whether the engineer is in a healthy workload zone or approaching overload.

2. INTELLIGENT WORK SEQUENCING:
   - Recommend the next task to work on using priority-weighted scoring: Critical/Blockers > High Priority Imminent Deadlines > Medium Regular Work > Low Priority.
   - Flag any dependencies where the employee is waiting on PR reviews or upstream services.

3. OPTIMIZED DAILY SCHEDULE PLANNING:
   - Build daily schedules broken into high-focus morning deep work blocks (9:00-11:30 AM), mid-day implementation blocks (1:00-3:30 PM), and end-of-day sync/code review blocks (3:45-5:00 PM).

4. COMMUNICATION STYLE:
   - Encouraging, concise, clear, and actionable.`;
