import React from 'react';
import { ConversationProvider } from '@elevenlabs/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/manager/DashboardView';
import { WorkloadTableView } from './components/manager/WorkloadTableView';
import { TeamView } from './components/manager/TeamView';
import { TaskManagementView } from './components/manager/TaskManagementView';
import { ProjectManagementView } from './components/manager/ProjectManagementView';
import { CalendarView } from './components/manager/CalendarView';
import { RiskEngineView } from './components/manager/RiskEngineView';
import { AICopilotView } from './components/manager/AICopilotView';
import { AnalyticsView } from './components/manager/AnalyticsView';
import { SettingsView } from './components/manager/SettingsView';

import { EmployeeDashboardView } from './components/employee/EmployeeDashboardView';
import { EmployeeTasksView } from './components/employee/EmployeeTasksView';
import { EmployeeProjectsView } from './components/employee/EmployeeProjectsView';
import { EmployeeCalendarView } from './components/employee/EmployeeCalendarView';
import { EmployeeWorkloadView } from './components/employee/EmployeeWorkloadView';
import { EmployeeAIAssistantView } from './components/employee/EmployeeAIAssistantView';
import { EmployeeProfileView } from './components/employee/EmployeeProfileView';

import { NotificationsView } from './components/common/NotificationsView';

import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { OptimizerModal } from './components/modals/OptimizerModal';
import { SimulateModal } from './components/modals/SimulateModal';
import { EmployeeDetailModal } from './components/modals/EmployeeDetailModal';
import { TaskDetailModal } from './components/modals/TaskDetailModal';
import { AuthModal } from './components/modals/AuthModal';

const AppContent: React.FC = () => {

  const { currentRole, activeTab } = useApp();

  const renderActiveView = () => {
    if (currentRole === 'manager') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardView />;
        case 'workload':
          return <WorkloadTableView />;
        case 'team':
          return <TeamView />;
        case 'tasks':
          return <TaskManagementView />;
        case 'projects':
          return <ProjectManagementView />;
        case 'calendar':
          return <CalendarView />;
        case 'risks':
          return <RiskEngineView />;
        case 'ai_copilot':
          return <AICopilotView />;
        case 'analytics':
          return <AnalyticsView />;
        case 'notifications':
          return <NotificationsView />;
        case 'settings':
          return <SettingsView />;
        default:
          return <DashboardView />;
      }
    } else {
      switch (activeTab) {
        case 'my_dashboard':
          return <EmployeeDashboardView />;
        case 'my_tasks':
          return <EmployeeTasksView />;
        case 'my_projects':
          return <EmployeeProjectsView />;
        case 'my_calendar':
          return <EmployeeCalendarView />;
        case 'my_workload':
          return <EmployeeWorkloadView />;
        case 'ai_assistant':
          return <EmployeeAIAssistantView />;
        case 'notifications':
          return <NotificationsView />;
        case 'profile':
          return <EmployeeProfileView />;
        default:
          return <EmployeeDashboardView />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-[#FF3D00] selection:text-black relative overflow-hidden">
      {/* Ambient background glow from Bold Typography theme */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#FF3D00] rounded-full blur-[180px] opacity-15 pointer-events-none z-0"></div>
      <div className="fixed -top-24 -left-24 w-80 h-80 bg-white rounded-full blur-[200px] opacity-5 pointer-events-none z-0"></div>

      {/* Top Navigation */}
      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#050505]/95">
          <div className="max-w-7xl mx-auto pb-12">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* All Application Modals */}
      <CreateTaskModal />
      <OptimizerModal />
      <SimulateModal />
      <EmployeeDetailModal />
      <TaskDetailModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <ConversationProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ConversationProvider>
  );
}
