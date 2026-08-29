import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Check
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openTaskDetailModal,
    tasks
  } = useApp();

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">System & AI Notifications</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              {notifications.length} Alerts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of AI rebalancing proposals, task milestones, and capacity alerts.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => {
              markNotificationAsRead(notif.id);
              if (notif.relatedId) {
                const target = tasks.find((t) => t.id === notif.relatedId);
                if (target) openTaskDetailModal(target);
              }
            }}
            className={`p-4 rounded-2xl border shadow-md transition cursor-pointer flex items-start gap-3.5 text-xs ${
              notif.read
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-slate-800/90 border-slate-700 text-slate-200'
            }`}
          >
            {notif.type === 'alert' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {notif.type === 'warning' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {notif.type === 'info' && <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-100">{notif.title}</p>
                <span className="text-[10px] text-slate-500">{notif.timestamp}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
