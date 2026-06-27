import React from "react";
import { IssueReport, IssueCategory } from "../types.js";
import { AlertCircle, CheckCircle, RefreshCw, BarChart2, Activity, Zap } from "lucide-react";
import { motion } from "motion/react";

interface StatsGridProps {
  issues: IssueReport[];
}

export default function StatsGrid({ issues }: StatsGridProps) {
  const total = issues.length;
  const active = issues.filter((i) => i.status !== "resolved").length;
  const resolved = issues.filter((i) => i.status === "resolved").length;
  const highPriority = issues.filter((i) => i.priority === "high" && i.status !== "resolved").length;

  const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category counts
  const categoryCounts = issues.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<IssueCategory, number>);

  const categories: { label: string; key: IssueCategory; color: string; ringColor: string }[] = [
    { label: "Potholes", key: "pothole", color: "bg-rose-500", ringColor: "ring-rose-100" },
    { label: "Waterlogging", key: "flooding", color: "bg-sky-500", ringColor: "ring-sky-100" },
    { label: "Streetlights", key: "light", color: "bg-amber-500", ringColor: "ring-amber-100" },
    { label: "Sanitation", key: "sanitation", color: "bg-emerald-500", ringColor: "ring-emerald-100" },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {/* Total Reports */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 relative overflow-hidden group transition-all"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl ring-4 ring-indigo-50/50 relative z-10">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reports Logged</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <h4 className="font-display text-3xl font-black text-slate-800 tracking-tight">{total}</h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-emerald-600" /> +100% Real
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Synced with Citizen Ledger</p>
        </div>
      </motion.div>

      {/* Active Cases with Glowing Signal */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 relative overflow-hidden group transition-all"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/30 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl ring-4 ring-rose-50/50 relative z-10">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Outages</p>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <h4 className="font-display text-3xl font-black text-slate-800 mt-0.5 tracking-tight">{active}</h4>
          <p className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            {highPriority} Critical hazards pending
          </p>
        </div>
      </motion.div>

      {/* Resolved Cases with Clean success score */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 relative overflow-hidden group transition-all"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/40 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl ring-4 ring-emerald-50/50 relative z-10">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved Rate</p>
          <h4 className="font-display text-3xl font-black text-slate-800 mt-0.5 tracking-tight">{resolved}</h4>
          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50/60 inline-block px-1.5 py-0.5 rounded-md mt-0.5">
            {resolvedRate}% Action Resolution Rate
          </p>
        </div>
      </motion.div>

      {/* Categories brief progress */}
      <motion.div 
        variants={cardVariants}
        className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-2 relative"
      >
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1 flex items-center justify-between">
          <span>Density Map</span>
          <span className="text-indigo-600 font-extrabold">Distribution</span>
        </p>
        <div className="space-y-2">
          {categories.map((cat) => {
            const count = categoryCounts[cat.key] || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={cat.key} className="space-y-0.5">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                  <span>{cat.label}</span>
                  <span className="text-slate-500">{count} reports</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <motion.div
                    className={`${cat.color} h-full rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

