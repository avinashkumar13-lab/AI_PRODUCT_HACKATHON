import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Bot,
  Zap,
  Sliders,
  Plus,
  Bell,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const {
    currentRole,
    currentUser,
    switchRole,
    employees,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openCreateTaskModal,
    openOptimizerModal,
    openSimulateModal,
    resetToDemoData,
    teamAnalytics
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white text-black flex items-center justify-center font-black text-sm tracking-tighter border border-white">
            <span className="font-display font-black text-base">TP</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg tracking-tighter uppercase text-white">
                TEAM PILOT
              </span>
              <span className="bg-[#FF3D00] text-black font-black text-[9px] px-1.5 py-0.2 uppercase tracking-widest">
                CORE
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-semibold hidden sm:block">
              Workforce Intelligence System
            </p>
          </div>
        </div>

        {/* AI Engine Pulse Status */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/70">
          <span className="w-2 h-2 rounded-full bg-[#FF3D00] animate-ping inline-block"></span>
          <span className="font-mono text-white/90 font-bold">GEMINI 3.7 ACTIVE</span>
        </div>
      </div>

      {/* Center Actions / Quick Stats */}
      <div className="hidden lg:flex items-center gap-3">
        {currentRole === 'manager' && (
          <>
            {teamAnalytics.overloadedEmployeesCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border-l-2 border-[#FF3D00] border-y border-r border-white/10 text-[#FF3D00] text-[10px] uppercase tracking-widest font-bold">
                <Flame className="w-3.5 h-3.5 text-[#FF3D00]" />
                <span>{teamAnalytics.overloadedEmployeesCount} Overloaded</span>
              </div>
            )}
            {teamAnalytics.atRiskTasks > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border-l-2 border-white/40 border-y border-r border-white/10 text-white/90 text-[10px] uppercase tracking-widest font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-white/80" />
                <span>{teamAnalytics.atRiskTasks} At-Risk</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest">
              <span className="text-white/40 font-semibold">Load:</span>
              <span className={`font-mono font-bold ${teamAnalytics.teamUtilization > 85 ? 'text-[#FF3D00]' : 'text-white'}`}>
                {teamAnalytics.teamUtilization}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Manager AI Actions */}
        {currentRole === 'manager' && (
          <>
            {/* AI OPTIMIZE TEAM Button */}
            <button
              id="btn-nav-optimize-team"
              onClick={openOptimizerModal}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#FF3D00] hover:bg-[#ff5722] text-black text-[11px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg shadow-[#FF3D00]/20"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>AI OPTIMIZE</span>
            </button>

            {/* Simulate Mode */}
            <button
              id="btn-nav-simulate-mode"
              onClick={openSimulateModal}
              title="Simulate Task Assignments"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-white hover:bg-white hover:text-black text-[10px] uppercase tracking-widest font-bold transition active:scale-95 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>Simulate</span>
            </button>

            {/* Create Task Button */}
            <button
              id="btn-nav-create-task"
              onClick={openCreateTaskModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-[#FF3D00] hover:text-black text-[10px] uppercase tracking-widest font-bold transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="btn-nav-notifications"
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="relative p-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white bg-white/5 transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3D00] text-black font-mono text-[9px] font-black flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-white/20 shadow-2xl p-4 z-50"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#FF3D00]">LIVE NOTIFICATIONS</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] uppercase tracking-wider text-white/60 hover:text-white font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-white/5 my-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-[10px] uppercase tracking-widest text-white/30 font-semibold">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3 transition cursor-pointer border-l-2 ${
                          notif.read ? 'border-transparent bg-transparent text-white/50' : 'border-[#FF3D00] bg-white/[0.03] text-white font-medium'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-[#FF3D00] shrink-0 mt-0.5" />}
                          {notif.type === 'warning' && <ShieldAlert className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                          {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#FF3D00] shrink-0 mt-0.5" />}
                          {notif.type === 'info' && <Sparkles className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <p className="font-bold text-xs text-white tracking-tight uppercase">{notif.title}</p>
                            <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-1 block">{notif.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset Demo Data Button */}
        <button
          id="btn-nav-reset-demo"
          onClick={resetToDemoData}
          title="Reset to Initial Demo State"
          className="p-2 border border-white/20 hover:border-white text-white/50 hover:text-white bg-white/5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Role Switcher & Profile Dropdown */}
        <div className="relative">
          <button
            id="btn-nav-role-switcher"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 border border-white/20 hover:border-white bg-white/5 transition cursor-pointer active:scale-95"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 object-cover border border-white/30"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight flex items-center gap-1.5 uppercase tracking-tight">
                {currentUser.name}
                <span className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.2 ${
                  currentRole === 'manager' ? 'bg-[#FF3D00] text-black' : 'bg-white text-black'
                }`}>
                  {currentRole === 'manager' ? 'MGR' : 'DEV'}
                </span>
              </p>
              <p className="text-[9px] font-mono text-white/40 truncate max-w-[110px]">{currentUser.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          </button>

          <AnimatePresence>
            {isRoleDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute right-0 mt-2 w-72 bg-[#0a0a0a] border border-white/20 shadow-2xl p-4 z-50"
              >
                <div className="text-[10px] uppercase tracking-[0.3em] font-black text-white/40 mb-3 pb-2 border-b border-white/10">
                  Role Switcher
                </div>

                {/* Role 1: Manager Demo */}
                <div
                  id="role-select-manager"
                  onClick={() => {
                    switchRole('manager');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`p-3 border mb-2 cursor-pointer transition flex items-center justify-between ${
                    currentRole === 'manager'
                      ? 'border-[#FF3D00] bg-white/5 text-white'
                      : 'border-white/10 hover:border-white/30 bg-transparent text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#FF3D00] text-black font-black flex items-center justify-center text-xs">
                      M
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white uppercase tracking-wider">Manager View</p>
                      <p className="text-[10px] font-mono text-white/40">manager@teampilot.ai</p>
                    </div>
                  </div>
                  {currentRole === 'manager' && <CheckCircle2 className="w-4 h-4 text-[#FF3D00]" />}
                </div>

                {/* Role 2: Team Member Demo (Aman Verma) */}
                <div
                  id="role-select-employee-aman"
                  onClick={() => {
                    switchRole('team_member', 'emp_aman');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`p-3 border mb-3 cursor-pointer transition flex items-center justify-between ${
                    currentRole === 'team_member' && currentUser.email === 'employee@teampilot.ai'
                      ? 'border-[#FF3D00] bg-white/5 text-white'
                      : 'border-white/10 hover:border-white/30 bg-transparent text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-white text-black font-black flex items-center justify-center text-xs">
                      E
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white uppercase tracking-wider">Engineer View (Aman)</p>
                      <p className="text-[10px] font-mono text-white/40">employee@teampilot.ai</p>
                    </div>
                  </div>
                  {currentRole === 'team_member' && currentUser.email === 'employee@teampilot.ai' && (
                    <CheckCircle2 className="w-4 h-4 text-[#FF3D00]" />
                  )}
                </div>

                {/* Switch to any of the 8 employees */}
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40 mb-2">
                  Impersonate Team Members:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-white/5">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        switchRole('team_member', emp.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left py-2 px-1 text-xs flex items-center justify-between hover:bg-white/5 transition ${
                        currentUser.employeeId === emp.id ? 'text-[#FF3D00] font-bold' : 'text-white/70'
                      }`}
                    >
                      <span className="truncate uppercase font-medium">{emp.name} <span className="text-[10px] text-white/40">({emp.role.split(' ')[0]})</span></span>
                      <span className="text-[9px] font-mono text-white/30">{emp.experience}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
