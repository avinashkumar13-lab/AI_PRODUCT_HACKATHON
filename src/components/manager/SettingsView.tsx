import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Sliders,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Clock,
  Sparkles
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = useApp();

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white tracking-tight">System & AI Engine Configuration</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            Workforce Settings
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune capacity threshold zones, working hour limits, and automated AI risk parameters.
        </p>
      </div>

      {/* Workload Thresholds Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <Sliders className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-base font-bold text-white">Capacity & Workload Threshold Rules</h2>
            <p className="text-xs text-slate-400">Configure how utilization percentages classify engineer bandwidth</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-emerald-400">Available Bandwidth Max Limit</span>
              <span className="font-bold text-slate-200">{settings.thresholds.availableMax}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={60}
              value={settings.thresholds.availableMax}
              onChange={(e) =>
                updateSettings({
                  thresholds: { ...settings.thresholds, availableMax: Number(e.target.value) }
                })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-blue-400">Healthy Workload Target Ceiling</span>
              <span className="font-bold text-slate-200">{settings.thresholds.healthyMax}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={85}
              value={settings.thresholds.healthyMax}
              onChange={(e) =>
                updateSettings({
                  thresholds: { ...settings.thresholds, healthyMax: Number(e.target.value) }
                })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-amber-400">High Workload Warning Threshold</span>
              <span className="font-bold text-slate-200">{settings.thresholds.highMax}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={95}
              value={settings.thresholds.highMax}
              onChange={(e) =>
                updateSettings({
                  thresholds: { ...settings.thresholds, highMax: Number(e.target.value) }
                })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-rose-400">Critical Overload Threshold (Burnout Alarm)</span>
              <span className="font-bold text-slate-200">{settings.thresholds.overloadedMax}%</span>
            </div>
            <input
              type="range"
              min={90}
              max={110}
              value={settings.thresholds.overloadedMax}
              onChange={(e) =>
                updateSettings({
                  thresholds: { ...settings.thresholds, overloadedMax: Number(e.target.value) }
                })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Reset Interactive Demo State</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Restore initial demo state with Rahul overloaded (94%) and Aman with bandwidth (42%).
          </p>
        </div>

        <button
          onClick={resetToDemoData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
