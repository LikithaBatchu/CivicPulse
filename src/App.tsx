import React, { useState, useEffect } from "react";
import CivicMap, { categoryColors, CategoryIcon } from "./components/CivicMap.js";
import ReportForm from "./components/ReportForm.js";
import OfficialDashboard from "./components/OfficialDashboard.js";
import StatsGrid from "./components/StatsGrid.js";
import { IssueReport, IssueStatus, IssueCategory } from "./types.js";
import {
  Sparkles,
  MapPin,
  Building2,
  Users,
  Grid,
  Map as MapIcon,
  Layers,
  Heart,
  ChevronRight,
  MessageSquare,
  Send,
  Loader2,
  ThumbsUp,
  AlertCircle
} from "lucide-react";

// Indian cities list
const INDIAN_CITIES = [
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, zoom: 12 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, zoom: 12 },
  { name: "New Delhi", lat: 28.6304, lng: 77.2177, zoom: 12 }
];

export default function App() {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout and view states
  const [portalView, setPortalView] = useState<"citizen" | "official">("citizen");
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [activeCity, setActiveCity] = useState(INDIAN_CITIES[0]);

  // Comment submission states
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Fetch all issues
  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/issues");
      const data = await res.json();
      if (data.success) {
        setIssues(data.issues);
        // Set default selected issue if available
        if (data.issues.length > 0 && !selectedIssue) {
          setSelectedIssue(data.issues[0]);
        }
      } else {
        throw new Error(data.error || "Failed to load issues");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to CivicPulse server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Handle reporting a new issue successfully
  const handleReportSubmitSuccess = (newIssue: IssueReport) => {
    setIssues((prev) => [...prev, newIssue]);
    setSelectedIssue(newIssue);
    setTempMarker(null);
  };

  // Upvote an issue
  const handleUpvote = async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}/upvote`, {
        method: "PATCH"
      });
      const data = await response.json();
      if (data.success) {
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === id ? { ...issue, upvotes: data.upvotes } : issue
          )
        );
        if (selectedIssue?.id === id) {
          setSelectedIssue((prev) => (prev ? { ...prev, upvotes: data.upvotes } : null));
        }
      }
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !commentAuthor.trim() || !commentText.trim()) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: commentAuthor,
          text: commentText,
          isAdmin: portalView === "official"
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedComments = [...(selectedIssue.comments || []), data.comment];
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === selectedIssue.id
              ? { ...issue, comments: updatedComments }
              : issue
          )
        );
        setSelectedIssue((prev) => (prev ? { ...prev, comments: updatedComments } : null));
        setCommentText("");
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  // Update status (officials)
  const handleUpdateStatus = async (id: string, status: IssueStatus, comment: string) => {
    try {
      const response = await fetch(`/api/issues/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, officialComment: comment })
      });
      const data = await response.json();
      if (data.success) {
        setIssues((prev) =>
          prev.map((issue) => (issue.id === id ? data.issue : issue))
        );
        setSelectedIssue(data.issue);
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  // Switch city and auto-center map
  const handleCityChange = (cityName: string) => {
    const city = INDIAN_CITIES.find((c) => c.name === cityName);
    if (city) {
      setActiveCity(city);
      setTempMarker(null);
      // Try to select the first issue in this city if matches
      const cityIssues = issues.filter((i) => i.address.toLowerCase().includes(cityName.toLowerCase()));
      if (cityIssues.length > 0) {
        setSelectedIssue(cityIssues[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800 relative overflow-hidden font-sans">
      {/* Visual Ambient Blur Decor - Stunning glow backdrops for premium aesthetic */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-emerald-200/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-10 w-[300px] h-[300px] bg-rose-200/10 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Dynamic Navigation Header with Sleek Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-600/25 relative overflow-hidden group">
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Sparkles className="w-5 h-5 relative z-10 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-2">
              CivicPulse
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Smart City Hub
              </span>
            </h1>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Real-Time Citizen Coordination
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* City Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-indigo-500 transition shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={activeCity.name}
              onChange={(e) => handleCityChange(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none focus:ring-0 font-bold text-slate-700 cursor-pointer"
            >
              {INDIAN_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} Metro
                </option>
              ))}
            </select>
          </div>

          {/* Heatmap Toggle Switch */}
          <button
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all duration-200 ${
              heatmapMode
                ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-100 ring-2 ring-rose-100"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${heatmapMode ? "animate-spin text-rose-600" : "text-slate-400"}`} style={{ animationDuration: "10s" }} />
            <span>{heatmapMode ? "Visual Density Map Active" : "Show Heatmap"}</span>
          </button>

          {/* Portal Switcher Tabs */}
          <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 flex items-center shadow-inner">
            <button
              onClick={() => {
                setPortalView("citizen");
                setTempMarker(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                portalView === "citizen"
                  ? "bg-white text-indigo-700 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Citizen Portal</span>
            </button>
            <button
              onClick={() => {
                setPortalView("official");
                setTempMarker(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                portalView === "official"
                  ? "bg-white text-indigo-950 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Officials Control</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Dynamic Dispatcher Ticker - Highly creative addition simulating smart city telemetry */}
      <div className="bg-slate-900 text-white border-b border-indigo-950/40 text-[10px] font-mono py-1 px-4 md:px-8 flex items-center justify-between gap-4 overflow-hidden relative shadow-inner">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <span className="bg-indigo-950 px-1.5 py-0.5 rounded text-[9px] font-bold text-indigo-400 border border-indigo-900 uppercase">
            LIVE DISPATCH
          </span>
        </div>
        <div className="flex-grow overflow-hidden relative">
          <div className="animate-marquee whitespace-nowrap inline-block text-slate-300 font-medium">
            COM_TRANSIT [{activeCity.name}]: Unit dispatched to investigate latest reported issues • Total active citizen monitors: {issues.length * 3 + 12} • Geotagging services active via Google Maps Platform API • AI automated routing status: OPTIMAL
          </div>
        </div>
        <div className="text-[9px] text-slate-500 flex-shrink-0 font-bold hidden sm:block">
          SECURE ENCRYPTED NODE
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto relative z-10">
        
        {/* Metrics Grid */}
        <StatsGrid issues={issues} />

        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Retrieving city logs & initializing maps...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center max-w-md mx-auto space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="font-display font-bold text-slate-800">Connection Failed</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <button
              onClick={fetchIssues}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : portalView === "citizen" ? (
          /* CITIZEN INTERFACE (Map and side reporter details) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Massive Maps Area */}
            <div className="lg:col-span-2 h-[520px] rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white">
              <CivicMap
                issues={issues}
                selectedIssue={selectedIssue}
                onSelectIssue={(issue) => {
                  setSelectedIssue(issue);
                  setTempMarker(null);
                }}
                tempMarker={tempMarker}
                onPlaceTempMarker={(marker) => {
                  setTempMarker(marker);
                  setSelectedIssue(null);
                }}
                heatmapMode={heatmapMode}
                activeCity={activeCity}
              />
            </div>

            {/* Right Column: Case Inspector / Dynamic Submission Drawer */}
            <div className="space-y-4">
              {tempMarker ? (
                /* Report Form (active when clicking the map) */
                <ReportForm
                  lat={tempMarker.lat}
                  lng={tempMarker.lng}
                  address={tempMarker.address}
                  onCancel={() => setTempMarker(null)}
                  onSubmitSuccess={handleReportSubmitSuccess}
                />
              ) : selectedIssue ? (
                /* Selected Issue Inspector */
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${categoryColors[selectedIssue.category]?.bg} ${categoryColors[selectedIssue.category]?.text}`}>
                        {selectedIssue.category}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        {selectedIssue.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-800 mt-2 leading-tight">
                      {selectedIssue.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      Geotagged: {selectedIssue.address}
                    </p>
                  </div>

                  {/* Citizen details */}
                  <div className="space-y-3 text-xs text-slate-600">
                    <p className="leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedIssue.description}
                    </p>

                    <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reporter</p>
                        <p className="font-semibold text-slate-700">{selectedIssue.reporterName}</p>
                      </div>
                      <button
                        onClick={() => handleUpvote(selectedIssue.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-[11px] transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Upvote ({selectedIssue.upvotes})</span>
                      </button>
                    </div>

                    {/* AI Reassuring response */}
                    {selectedIssue.aiResponse && (
                      <div className="bg-indigo-50/80 border border-indigo-100/50 p-3.5 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: "3s" }} />
                          <span>CivicPulse AI Assessment</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-normal font-medium">
                          {selectedIssue.aiResponse}
                        </p>
                        {selectedIssue.department && (
                          <p className="text-[10px] text-indigo-900 font-bold bg-indigo-100/60 inline-block px-2 py-0.5 rounded">
                            Division: {selectedIssue.department}
                          </p>
                        )}
                        {selectedIssue.aiRemedy && (
                          <p className="text-[10px] text-slate-500 leading-normal border-t border-indigo-100/30 pt-1.5 mt-1">
                            <strong className="text-amber-800 font-bold">Safety Tip:</strong> {selectedIssue.aiRemedy}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comments section */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Community Discussion ({selectedIssue.comments?.length || 0})</span>
                    </h4>

                    {/* Comments list */}
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {(!selectedIssue.comments || selectedIssue.comments.length === 0) ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-2">No comments yet. Start the conversation!</p>
                      ) : (
                        selectedIssue.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-2.5 rounded-xl text-xs space-y-1 ${
                              comment.isAdmin
                                ? "bg-indigo-950 text-white border border-indigo-900 shadow-sm"
                                : "bg-slate-50 text-slate-600 border border-slate-100"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[10px] block truncate max-w-[150px]">
                                {comment.author}
                              </span>
                              <span className="text-[8px] text-slate-400 font-semibold">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="leading-normal font-medium">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          placeholder="Your Name"
                          className="text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 font-semibold"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isCommenting}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition disabled:opacity-50"
                        >
                          {isCommenting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          <span>Post Note</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add your local update or verify this hazard..."
                        className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 font-medium"
                        required
                      />
                    </form>
                  </div>
                </div>
              ) : (
                /* Default Info State */
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center space-y-4 h-[320px] flex flex-col items-center justify-center">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display font-bold text-slate-800 text-sm">Select or Place a Pin</p>
                    <p className="text-xs text-slate-400 leading-normal max-w-xs mx-auto">
                      Click any registered hazard marker to view active status, read comments, or upvote.
                    </p>
                    <div className="border-t border-slate-100 pt-3 mt-3">
                      <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-100">
                        Or click anywhere on the map to log a new issue!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Card List of Issues for simulation (specifically useful if Maps API key is not yet set up!) */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-1">
                  Active City Reports Feed
                </p>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {issues
                    .filter((issue) => issue.address.toLowerCase().includes(activeCity.name.toLowerCase()))
                    .map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => {
                          setSelectedIssue(issue);
                          setTempMarker(null);
                        }}
                        className={`p-2.5 rounded-xl border transition text-left cursor-pointer flex items-center gap-2 ${
                          selectedIssue?.id === issue.id
                            ? "bg-indigo-50/30 border-indigo-200"
                            : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <CategoryIcon category={issue.category} className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{issue.title}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{issue.address}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* OFFICIALS INTERFACE (Dashboards, trends analysis, etc.) */
          <OfficialDashboard
            issues={issues}
            onUpdateStatus={handleUpdateStatus}
            selectedIssue={selectedIssue}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              setTempMarker(null);
            }}
          />
        )}
      </main>

      {/* Elegant Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/60 py-5 px-4 md:px-8 text-center text-xs text-slate-400 font-medium">
        <p className="flex items-center justify-center gap-1 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
          <span>CivicPulse Smart City Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-600">Active Live</span>
        </p>
        <p className="mt-1">Empowering citizens to build smarter, safer, and cleaner communities across India.</p>
      </footer>
    </div>
  );
}
