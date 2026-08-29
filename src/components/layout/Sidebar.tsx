import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderKanban,
  Gauge,
  Calendar,
  BarChart3,
  Bot,
  Bell,
  Settings,
  ShieldAlert,
  Zap,
  Sliders,
  UserCircle2,
  ListTodo,
  CalendarClock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentRole,
    activeTab,
    setActiveTab,
    pendingRecommendationsCount,
    unreadNotificationsCount,
    teamAnalytics
  } = useApp();

  const managerNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workload', label: 'Workload Matrix', icon: Gauge, badge: teamAnalytics.overloadedEmployeesCount > 0 ? `${teamAnalytics.overloadedEmployeesCount} ALERT` : undefined, badgeColor: 'border border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/10' },
    { id: 'team', label: 'Team Directory', icon: Users },
    { id: 'tasks', label: 'Task Hub & Kanban', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'calendar', label: 'Timeline & Calendar', icon: Calendar },
    { id: 'risks', label: 'Risk Engine', icon: ShieldAlert, badge: teamAnalytics.atRiskTasks > 0 ? `${teamAnalytics.atRiskTasks} AT RISK` : undefined, badgeColor: 'border border-white/40 text-white bg-white/10' },
    { id: 'ai_copilot', label: 'AI Manager Copilot', icon: Bot, isSpecial: true },
    { id: 'analytics', label: 'Analytics & Health', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : undefined, badgeColor: 'bg-[#FF3D00] text-black font-mono font-black' },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const employeeNav = [
    { id: 'my_dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'my_tasks', label: 'Assigned Tasks', icon: ListTodo },
    { id: 'my_projects', label: 'My Projects', icon: FolderKanban },
    { id: 'my_calendar', label: 'My Schedule', icon: CalendarClock },
    { id: 'my_workload', label: 'Capacity Matrix', icon: Gauge },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : undefined, badgeColor: 'bg-[#FF3D00] text-black font-mono font-black' },
    { id: 'profile', label: 'Profile & Skills', icon: UserCircle2 }
  ];

  const currentNav = currentRole === 'manager' ? managerNav : employeeNav;

  return (
    <aside className="w-64 bg-[#050505] border-r border-white/10 flex flex-col justify-between shrink-0 select-none py-6">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="px-3">
          <div className="px-3 mb-3 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.4em] font-black text-white/40">
              {currentRole === 'manager' ? 'MANAGER WORKSPACE' : 'ENGINEER WORKSPACE'}
            </span>
          </div>

          <nav className="space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black border-l-4 border-[#FF3D00] shadow-sm font-black'
                      : item.isSpecial
                      ? 'border border-[#FF3D00]/40 text-[#FF3D00] hover:bg-[#FF3D00]/10 hover:border-[#FF3D00]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-black stroke-[2.5]' : item.isSpecial ? 'text-[#FF3D00]' : 'text-white/40'}`} />
                    <span className="tracking-wider">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 uppercase tracking-tight ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom AI Status Card */}
      <div className="px-4 pt-4 border-t border-white/10">
        <div className="p-4 bg-white/5 border border-white/10 border-l-4 border-l-[#FF3D00]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF3D00] fill-[#FF3D00]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">INTELLIGENCE</span>
            </div>
            <span className="text-[9px] font-mono text-[#FF3D00] font-bold">100%</span>
          </div>
          <p className="text-[10px] text-white/40 leading-snug font-light">
            Continuous workload rebalancing & predictive completion routing.
          </p>
        </div>
      </div>
    </aside>
  );
};
