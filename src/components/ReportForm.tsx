import React, { useState } from "react";
import { IssueCategory, IssueReport } from "../types.js";
import { AlertTriangle, MapPin, Loader2, Sparkles, User, Phone, CheckCircle, Plus } from "lucide-react";

interface ReportFormProps {
  lat: number;
  lng: number;
  address: string;
  onCancel: () => void;
  onSubmitSuccess: (newIssue: IssueReport) => void;
}

const PRESETS = [
  {
    name: "Koramangala Waterlogging",
    category: "flooding" as IssueCategory,
    title: "Heavy Waterlogging near HSR Flyover",
    description: "After 30 minutes of rain, the entire highway underpass is completely waterlogged. Water depth is nearly 1.5 feet, causing bikes to stall and severe traffic congestion.",
    address: "HSR Flyover Underpass, Outer Ring Road, Bengaluru, Karnataka 560102"
  },
  {
    name: "Open Manhole Danger",
    category: "safety" as IssueCategory,
    title: "Unmarked Open Manhole on Main Path",
    description: "An open sewer manhole has been left uncovered on the pedestrian sidewalk. It is extremely dark at night and is an immediate danger for children and blind walkers.",
    address: "80 Feet Road, opposite National Games Village, Koramangala, Bengaluru, Karnataka 560047"
  },
  {
    name: "Garbage Dump Spillage",
    category: "sanitation" as IssueCategory,
    title: "Uncontrolled Garbage Pile on Roadway",
    description: "Municipal sanitation truck has not cleared this spot for 5 days. Garbage pile has spilled onto 30% of the active driving lane, attracting flies and stray cattle.",
    address: "Hill Road, opposite St. Andrews Church, Bandra West, Mumbai, Maharashtra 400050"
  },
];

export default function ReportForm({ lat, lng, address, onCancel, onSubmitSuccess }: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("pothole");
  const [customAddress, setCustomAddress] = useState(address);
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedIssue, setSubmittedIssue] = useState<IssueReport | null>(null);

  // Auto-populate with preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setCustomAddress(preset.address);
    if (!reporterName) setReporterName("Citizen Tester");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !reporterName.trim()) {
      setError("Please fill out Title, Description, and Reporter Name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          lat,
          lng,
          address: customAddress,
          reporterName,
          reporterPhone,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmittedIssue(data.issue);
        setTimeout(() => {
          onSubmitSuccess(data.issue);
        }, 3500); // Allow user to read the AI output before closing
      } else {
        throw new Error(data.error || "Failed to submit report");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedIssue) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-md text-center max-w-md mx-auto animate-fade-in">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-800 mb-1">Issue Reported Successfully!</h3>
        <p className="text-xs text-slate-500 mb-4">Community Alert logged at GPS ({lat.toFixed(4)}, {lng.toFixed(4)})</p>

        {submittedIssue.aiResponse && (
          <div className="bg-indigo-50/80 border border-indigo-100/50 p-4 rounded-xl text-left space-y-2 mb-4 animate-pulse">
            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>CivicPulse AI Auto-Analysis</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-indigo-900 block mb-0.5">Automated Official Response:</strong>
              {submittedIssue.aiResponse}
            </p>
            {submittedIssue.department && (
              <p className="text-[11px] text-indigo-900 font-semibold bg-indigo-100/60 inline-block px-2 py-0.5 rounded">
                Assigned Department: {submittedIssue.department}
              </p>
            )}
            {submittedIssue.aiRemedy && (
              <p className="text-[11px] text-slate-600 leading-relaxed pt-1.5 border-t border-indigo-100/30">
                <strong className="text-amber-800 font-bold block">Safety Recommendation:</strong>
                {submittedIssue.aiRemedy}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Synchronizing community database...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h3 className="font-display text-base font-bold text-slate-800">Report Civic Issue</h3>
          <p className="text-[10px] text-slate-400">GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-50 font-semibold transition"
        >
          Cancel
        </button>
      </div>

      {/* Preset Testers */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Testing Presets</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2 text-xs text-red-600">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Category selection */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Issue Category</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(["pothole", "light", "flooding", "sanitation", "safety", "other"] as IssueCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg border text-center transition capitalize cursor-pointer ${
                category === cat
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="title-input" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Report Title</label>
        <input
          id="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., Large trench on 80ft road near Metro station"
          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="desc-input" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Description & Details</label>
        <textarea
          id="desc-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue. Mention specific landmarks, depth/severity, or safe alternatives..."
          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 resize-none"
          required
        />
      </div>

      {/* Geotagged Address */}
      <div className="space-y-1">
        <label htmlFor="addr-input" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Geotagged Address</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="addr-input"
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Reporter Info */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-50">
        <div className="space-y-1">
          <label htmlFor="name-input" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Your Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              id="name-input"
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Full Name"
              className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="phone-input" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact Phone (Optional)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              id="phone-input"
              type="text"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI Analyzing Citizen Report...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Submit Civic Report (AI Assisted)</span>
          </>
        )}
      </button>
    </form>
  );
}
