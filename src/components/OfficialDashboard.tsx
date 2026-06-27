import React, { useState } from "react";
import { IssueReport, IssueStatus, IssueCategory, IssuePriority } from "../types.js";
import { categoryColors, CategoryIcon } from "./CivicMap.js";
import { CheckCircle, AlertTriangle, Clock, RefreshCw, FileText, Sparkles, Send, Loader2, ArrowRight, ShieldAlert } from "lucide-react";

interface OfficialDashboardProps {
  issues: IssueReport[];
  onUpdateStatus: (id: string, status: IssueStatus, comment: string) => Promise<void>;
  selectedIssue: IssueReport | null;
  onSelectIssue: (issue: IssueReport) => void;
}

const statusBadges: Record<IssueStatus, { bg: string; text: string; icon: any }> = {
  reported: { bg: "bg-red-100 text-red-800", text: "Reported", icon: AlertTriangle },
  acknowledged: { bg: "bg-amber-100 text-amber-800", text: "Acknowledged", icon: Clock },
  "in-progress": { bg: "bg-blue-100 text-blue-800", text: "In Progress", icon: RefreshCw },
  resolved: { bg: "bg-emerald-100 text-emerald-800", text: "Resolved", icon: CheckCircle },
};

const priorityBadges: Record<IssuePriority, { bg: string; text: string }> = {
  low: { bg: "bg-slate-100 text-slate-700", text: "Low Priority" },
  medium: { bg: "bg-amber-100 text-amber-800", text: "Medium Priority" },
  high: { bg: "bg-red-100 text-red-800", text: "High Priority" },
};

export default function OfficialDashboard({
  issues,
  onUpdateStatus,
  selectedIssue,
  onSelectIssue,
}: OfficialDashboardProps) {
  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Status update form states
  const [newStatus, setNewStatus] = useState<IssueStatus>("acknowledged");
  const [officialComment, setOfficialComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Filter logic
  const filteredIssues = issues.filter((issue) => {
    if (filterCategory !== "all" && issue.category !== filterCategory) return false;
    if (filterStatus !== "all" && issue.status !== filterStatus) return false;
    if (filterPriority !== "all" && issue.priority !== filterPriority) return false;
    return true;
  });

  // Handle status update submission
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(selectedIssue.id, newStatus, officialComment);
      setOfficialComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Generate AI Executive Report
  const generateAiReport = async () => {
    setIsGeneratingSummary(true);
    setAiSummary(null);
    try {
      const response = await fetch("/api/gemini/summary");
      const data = await response.json();
      if (data.success) {
        setAiSummary(data.summary);
      } else {
        setAiSummary("Error generating AI Summary. Check console/network.");
      }
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate report due to backend connection error.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Set default state when selected issue changes
  React.useEffect(() => {
    if (selectedIssue) {
      setNewStatus(selectedIssue.status);
    }
  }, [selectedIssue]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Issues list & search */}
      <div className="xl:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider md:mr-2">Filters</p>
          <div className="grid grid-cols-3 gap-2 flex-grow">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="light">Streetlights</option>
              <option value="flooding">Flooding</option>
              <option value="sanitation">Sanitation</option>
              <option value="safety">Safety Hazard</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>

        {/* List of active reports */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-display text-sm font-bold text-slate-800">
              Active Municipal Cases ({filteredIssues.length})
            </h3>
            <span className="text-[10px] bg-slate-100 font-semibold text-slate-500 px-2 py-0.5 rounded-full">
              Sorted by Recency
            </span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No reported cases match the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
              {filteredIssues.map((issue) => {
                const StatusIcon = statusBadges[issue.status].icon;
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className={`p-4 transition hover:bg-slate-50/80 cursor-pointer flex flex-col md:flex-row md:items-center gap-4 ${
                      isSelected ? "bg-indigo-50/30 border-l-4 border-l-indigo-600" : ""
                    }`}
                  >
                    {/* Category icon indicator */}
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100">
                      <CategoryIcon category={issue.category} className="w-5 h-5" />
                    </div>

                    <div className="flex-grow space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{issue.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadges[issue.status].bg}`}>
                          {statusBadges[issue.status].text}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityBadges[issue.priority].bg}`}>
                          {priorityBadges[issue.priority].text}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{issue.description}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Located: {issue.address}</p>
                    </div>

                    {/* Upvote score and timestamp */}
                    <div className="flex-shrink-0 text-right space-y-1 min-w-[90px]">
                      <div className="text-[10px] font-bold text-slate-600 bg-slate-100 py-1 px-2 rounded-lg inline-block">
                        ▲ {issue.upvotes} Citizens
                      </div>
                      <p className="text-[9px] text-slate-400 block font-semibold">
                        {new Date(issue.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Case inspector and update panels */}
      <div className="space-y-6">
        {selectedIssue ? (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${categoryColors[selectedIssue.category].bg} ${categoryColors[selectedIssue.category].text}`}>
                {selectedIssue.category}
              </span>
              <h3 className="font-display text-base font-bold text-slate-800 mt-2 leading-tight">
                {selectedIssue.title}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                Case ID: {selectedIssue.id} | Reported by {selectedIssue.reporterName}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Details</p>
                <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedIssue.description}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Location Info</p>
                <p className="text-slate-600 font-semibold bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {selectedIssue.address}
                </p>
              </div>

              {selectedIssue.department && (
                <div className="bg-indigo-50/50 border border-indigo-100/30 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>CivicPulse AI Routing</span>
                  </div>
                  <p className="font-semibold text-slate-700 text-[11px]">
                    Department: <span className="text-indigo-900">{selectedIssue.department}</span>
                  </p>
                  {selectedIssue.aiResponse && (
                    <p className="text-[11px] text-slate-500 italic mt-1 leading-normal">
                      "{selectedIssue.aiResponse}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Official Status Update Form */}
            <form onSubmit={handleStatusSubmit} className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                Official Resolution Panel
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="status-select" className="text-[9px] font-bold text-slate-400">Current Status</label>
                  <select
                    id="status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="reported">Reported</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Severity Priority</label>
                  <p className={`p-2 border rounded-lg text-xs font-bold text-center capitalize ${selectedIssue.priority === "high" ? "bg-red-50 border-red-200 text-red-700" : selectedIssue.priority === "medium" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    {selectedIssue.priority}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="comment-input" className="text-[9px] font-bold text-slate-400">Official Municipal Note</label>
                <textarea
                  id="comment-input"
                  rows={2}
                  value={officialComment}
                  onChange={(e) => setOfficialComment(e.target.value)}
                  placeholder="E.g., Suction trucks dispatched. Clear target scheduled by 4:00 PM."
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Update Status & Notify Citizens</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 text-center text-slate-400 text-xs h-[320px] flex flex-col items-center justify-center space-y-2">
            <ArrowRight className="w-8 h-8 text-slate-300 animate-pulse rotate-90 xl:rotate-0" />
            <p className="font-semibold text-slate-600">No Case Inspected</p>
            <p className="text-[11px] max-w-xs text-slate-400">Select any citizen report from the left panel to inspect data, update municipal status, or issue public notices.</p>
          </div>
        )}

        {/* AI Executive Report Panel */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl shadow-md p-5 border border-indigo-950 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-800 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm">Smart City Advisory</h4>
              <p className="text-[10px] text-indigo-200">Generates instant Commissioner briefing brief</p>
            </div>
          </div>

          <button
            onClick={generateAiReport}
            disabled={isGeneratingSummary}
            className="w-full bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-900" />
                <span>Analyzing Municipal Databases...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-indigo-700" />
                <span>Generate Commissioner Advisory</span>
              </>
            )}
          </button>

          {aiSummary ? (
            <div className="bg-indigo-900/60 border border-indigo-800 p-4 rounded-xl text-left max-h-[350px] overflow-y-auto text-xs space-y-3 leading-relaxed text-indigo-100 animate-fade-in">
              {/* Highlight and style headers beautifully inside the summary block */}
              {aiSummary.split("\n").map((line, idx) => {
                if (line.startsWith("#")) {
                  return (
                    <p key={idx} className="font-display font-bold text-white text-sm border-b border-indigo-800 pb-1 mt-3">
                      {line.replace(/#/g, "").trim()}
                    </p>
                  );
                } else if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <p key={idx} className="font-bold text-white mt-2">
                      {line.replace(/\*\*/g, "").trim()}
                    </p>
                  );
                } else {
                  // Replace bold spans in lines inline
                  let formattedLine = line;
                  const regex = /\*\*(.*?)\*\*/g;
                  let match;
                  const parts = [];
                  let lastIndex = 0;
                  while ((match = regex.exec(line)) !== null) {
                    parts.push(line.substring(lastIndex, match.index));
                    parts.push(
                      <strong key={match.index} className="text-white font-bold">
                        {match[1]}
                      </strong>
                    );
                    lastIndex = regex.lastIndex;
                  }
                  parts.push(line.substring(lastIndex));
                  return (
                    <p key={idx} className={line.trim().startsWith("-") ? "pl-3 -indent-3" : ""}>
                      {parts.length > 0 ? parts : line}
                    </p>
                  );
                }
              })}
            </div>
          ) : (
            <p className="text-[11px] text-indigo-300 leading-relaxed text-center py-4 border border-dashed border-indigo-800 rounded-xl">
              Advisory engine ready. Generates deep strategic grade insights based on current live citizen reports.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
