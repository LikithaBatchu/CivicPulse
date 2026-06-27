import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { IssueReport, IssueCategory } from "../types.js";
import { AlertCircle, Lightbulb, Droplets, Trash2, Shield, HelpCircle, MapPin, Eye } from "lucide-react";

// Get API Key safely
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY !== "MY_GOOGLE_MAPS_PLATFORM_KEY";

interface CivicMapProps {
  issues: IssueReport[];
  selectedIssue: IssueReport | null;
  onSelectIssue: (issue: IssueReport) => void;
  tempMarker: { lat: number; lng: number } | null;
  onPlaceTempMarker: (marker: { lat: number; lng: number; address: string } | null) => void;
  heatmapMode: boolean;
  activeCity: { name: string; lat: number; lng: number; zoom: number };
}

// Map category to color
export const categoryColors: Record<IssueCategory, { bg: string; border: string; text: string; pinBg: string }> = {
  pothole: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", pinBg: "#ef4444" },
  light: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", pinBg: "#f59e0b" },
  flooding: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", pinBg: "#3b82f6" },
  sanitation: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", pinBg: "#10b981" },
  safety: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", pinBg: "#f43f5e" },
  other: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", pinBg: "#64748b" },
};

export function CategoryIcon({ category, className = "w-5 h-5" }: { category: IssueCategory; className?: string }) {
  switch (category) {
    case "pothole":
      return <AlertCircle className={`${className} text-red-600`} />;
    case "light":
      return <Lightbulb className={`${className} text-amber-500`} />;
    case "flooding":
      return <Droplets className={`${className} text-blue-500`} />;
    case "sanitation":
      return <Trash2 className={`${className} text-emerald-600`} />;
    case "safety":
      return <Shield className={`${className} text-rose-600`} />;
    default:
      return <HelpCircle className={`${className} text-slate-500`} />;
  }
}

export default function CivicMap({
  issues,
  selectedIssue,
  onSelectIssue,
  tempMarker,
  onPlaceTempMarker,
  heatmapMode,
  activeCity,
}: CivicMapProps) {
  const [mapCenter, setMapCenter] = useState({ lat: activeCity.lat, lng: activeCity.lng });
  const [mapZoom, setMapZoom] = useState(activeCity.zoom);

  // Update map viewport when active city changes
  useEffect(() => {
    setMapCenter({ lat: activeCity.lat, lng: activeCity.lng });
    setMapZoom(activeCity.zoom);
  }, [activeCity]);

  // Stylized simulated landmarks for Indian metros
  const getCitySchematic = (cityName: string) => {
    switch (cityName) {
      case "Mumbai":
        return {
          parks: [
            { name: "Sanjay Gandhi National Park", x: 65, y: 15, w: 25, h: 25 },
            { name: "Oval Maidan", x: 15, y: 85, w: 10, h: 8 }
          ],
          roads: [
            { name: "Western Express Highway", points: "M50,10 L48,50 L45,90" },
            { name: "Marine Drive", points: "M10,75 C12,85 20,95 25,95" },
            { name: "Eastern Freeway", points: "M80,30 L75,70 L60,95" }
          ],
          landmarks: [
            { name: "Bandra-Worli Sea Link", x: 35, y: 55, latOffset: 0.05, lngOffset: -0.05 },
            { name: "Gateway of India", x: 22, y: 92, latOffset: -0.08, lngOffset: -0.01 },
            { name: "Juhu Beach", x: 40, y: 38, latOffset: 0.02, lngOffset: -0.04 },
            { name: "Chhatrapati Shivaji Terminal", x: 30, y: 80, latOffset: -0.04, lngOffset: 0.02 },
            { name: "Andheri West Metro", x: 55, y: 28, latOffset: 0.04, lngOffset: 0.01 }
          ]
        };
      case "New Delhi":
        return {
          parks: [
            { name: "Lodi Gardens", x: 45, y: 55, w: 14, h: 14 },
            { name: "Central Park (Connaught Place)", x: 50, y: 35, w: 10, h: 10 }
          ],
          roads: [
            { name: "Outer Ring Road", points: "M15,50 A35,35 0 1,1 85,50 A35,35 0 1,1 15,50" },
            { name: "Rajpath (Kartavya Path)", points: "M50,35 L50,65" },
            { name: "Mathura Road", points: "M20,20 L50,35 L80,90" }
          ],
          landmarks: [
            { name: "India Gate", x: 50, y: 50, latOffset: 0.0, lngOffset: 0.0 },
            { name: "Connaught Place Hub", x: 50, y: 35, latOffset: 0.03, lngOffset: -0.01 },
            { name: "Red Fort (Lal Qila)", x: 58, y: 18, latOffset: 0.07, lngOffset: 0.04 },
            { name: "Qutub Minar", x: 40, y: 85, latOffset: -0.08, lngOffset: -0.05 },
            { name: "Lotus Temple", x: 75, y: 70, latOffset: -0.04, lngOffset: 0.06 }
          ]
        };
      default: // Bengaluru
        return {
          parks: [
            { name: "Cubbon Park", x: 48, y: 42, w: 16, h: 18 },
            { name: "Lalbagh Botanical Garden", x: 45, y: 70, w: 18, h: 15 }
          ],
          roads: [
            { name: "Outer Ring Road (ORR)", points: "M10,48 L90,48" },
            { name: "MG Road Transit Corridor", points: "M20,38 L80,38" },
            { name: "Hosur Road Link", points: "M48,38 L55,90" }
          ],
          landmarks: [
            { name: "Koramangala 80ft Road", x: 62, y: 68, latOffset: -0.03, lngOffset: 0.04 },
            { name: "Indiranagar 100ft Road", x: 70, y: 32, latOffset: 0.02, lngOffset: 0.06 },
            { name: "Vidhana Soudha (HQ)", x: 40, y: 35, latOffset: 0.03, lngOffset: -0.02 },
            { name: "HSR Layout Sector 1", x: 68, y: 82, latOffset: -0.06, lngOffset: 0.05 },
            { name: "Majestic Bus Station", x: 25, y: 40, latOffset: 0.01, lngOffset: -0.06 }
          ]
        };
    };
  };

  const [activeTab, setActiveTab] = useState<"simulator" | "setup">("simulator");

  // Handle clicks on simulated layout to place report markers
  const handleSimulatedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== "simulator") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert click % coordinates back to virtual lat & lng around activeCity
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    // Center of city + offset scaled by % coordinates
    const deltaLat = ((50 - percentY) / 100) * 0.15;
    const deltaLng = ((percentX - 50) / 100) * 0.15;

    const lat = activeCity.lat + deltaLat;
    const lng = activeCity.lng + deltaLng;
    const address = `Simulated Spot near ${activeCity.name} Sector ${Math.floor(percentX/10)}, Grid (${percentX.toFixed(0)}%, ${percentY.toFixed(0)}%)`;

    onPlaceTempMarker({ lat, lng, address });
  };

  if (!hasValidKey) {
    const schematic = getCitySchematic(activeCity.name);

    return (
      <div className="flex flex-col h-[520px] bg-slate-950 text-slate-100 rounded-2xl overflow-hidden relative shadow-inner">
        {/* Simulator Control Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="font-display text-xs font-bold tracking-tight text-white uppercase">
              {activeCity.name} Interactive Grid Simulator
            </h4>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                activeTab === "simulator"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setActiveTab("setup")}
              className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                activeTab === "setup"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Get Real Google Map
            </button>
          </div>
        </div>

        {activeTab === "setup" ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
            <div className="p-3 bg-indigo-500/10 rounded-full mb-3 border border-indigo-500/20">
              <Eye className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1.5">Load Real Google Satellite & Vector Maps</h3>
            <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
              To activate real mapping and reverse geocoding, save your Google Maps Key in project secrets.
            </p>
            
            <div className="text-left bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-[11px] text-slate-300 space-y-2.5 max-w-md shadow-lg font-sans">
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <p>Visit <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold">Google Maps Portal</a>.</p>
              </div>
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">2</span>
                <p>Click top-right <strong>Settings Gear icon</strong> inside AI Studio.</p>
              </div>
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">3</span>
                <p>Create Secret <code>GOOGLE_MAPS_PLATFORM_KEY</code> & paste your key.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("simulator")}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-all"
            >
              Go Back to Grid Simulator
            </button>
          </div>
        ) : (
          /* FULLY INTERACTIVE VECTOR MAP SIMULATOR GRID */
          <div 
            onClick={handleSimulatedClick}
            className="flex-grow relative cursor-crosshair overflow-hidden select-none bg-slate-950"
            style={{
              backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          >
            {/* Grid coordinates indicator */}
            <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md text-[9px] font-mono text-emerald-400 pointer-events-none z-20 flex items-center gap-1.5 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>SIMULATED CHASSIS ENGAGED: Indian Municipal Outage Grid</span>
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded text-[8px] font-mono text-slate-400 pointer-events-none z-20">
              CLICK ANYWHERE TO RE-ROUTE & LOG OUTAGE
            </div>

            {/* Radar Scan Line Sweep Animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 w-full h-[40%] animate-pulse pointer-events-none" />

            {/* SVG schematic roads & parks layout */}
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
              {schematic.roads.map((road, idx) => (
                <path
                  key={idx}
                  d={road.points}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  className="animate-pulse"
                  style={{ animationDuration: "3s" }}
                />
              ))}
            </svg>

            {/* Schematic park boxes */}
            {schematic.parks.map((park, idx) => (
              <div
                key={idx}
                className="absolute border border-emerald-900/30 bg-emerald-950/20 rounded-xl flex items-center justify-center p-2 text-center text-emerald-500/50 font-display text-[9px] font-bold pointer-events-none"
                style={{
                  left: `${park.x}%`,
                  top: `${park.y}%`,
                  width: `${park.w}%`,
                  height: `${park.h}%`,
                }}
              >
                {park.name}
              </div>
            ))}

            {/* Landmark Hotspots */}
            {schematic.landmarks.map((landmark, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  const lat = activeCity.lat + landmark.latOffset;
                  const lng = activeCity.lng + landmark.lngOffset;
                  onPlaceTempMarker({ lat, lng, address: `${landmark.name}, ${activeCity.name}` });
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}
              >
                <div className="w-5 h-5 bg-indigo-950 hover:bg-indigo-900 rounded-full border border-indigo-500 flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:scale-110 transition duration-150">
                  <MapPin className="w-3 h-3" />
                </div>
                <div className="absolute left-1/2 top-5 transform -translate-x-1/2 bg-slate-900/90 text-slate-300 font-bold border border-slate-800 rounded px-1 text-[8px] whitespace-nowrap opacity-75 group-hover:opacity-100 transition">
                  {landmark.name}
                </div>
              </div>
            ))}

            {/* Interactive active reported issues mapped dynamically onto simulated canvas */}
            {issues
              .filter((issue) => issue.address.toLowerCase().includes(activeCity.name.toLowerCase()))
              .map((issue) => {
                // Map latitude & longitude offsets relative to city center onto percentages 15% to 85%
                const deltaLat = issue.lat - activeCity.lat;
                const deltaLng = issue.lng - activeCity.lng;
                
                // standard delta scales
                const xPercent = 50 + (deltaLng / 0.15) * 100;
                const yPercent = 50 - (deltaLat / 0.15) * 100;

                // Clamp to safe map container boundaries
                const leftPercent = Math.min(Math.max(xPercent, 10), 90);
                const topPercent = Math.min(Math.max(yPercent, 10), 90);

                const colors = categoryColors[issue.category] || categoryColors.other;
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIssue(issue);
                    }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-25 transition-all duration-300 ${
                      isSelected ? "scale-125" : "scale-100"
                    }`}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  >
                    <div 
                      className={`p-1.5 rounded-full border-2 border-slate-950 shadow-md ${
                        isSelected ? "bg-white ring-4 ring-indigo-500" : "bg-slate-900"
                      }`}
                    >
                      <CategoryIcon category={issue.category} className="w-3.5 h-3.5" />
                    </div>
                    
                    {/* Glowing ping outline */}
                    <div 
                      className="absolute inset-0 rounded-full animate-ping pointer-events-none opacity-40"
                      style={{
                        backgroundColor: colors.pinBg,
                        animationDuration: "2.5s"
                      }}
                    />

                    {/* Popover helper text on hover */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 text-white border border-slate-800 text-[8px] font-bold py-0.5 px-1.5 rounded whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      {issue.title} ({issue.status})
                    </div>
                  </div>
                );
              })}

            {/* Currently placing a temporary report marker */}
            {tempMarker && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
                style={{
                  // calculate relative coords
                  left: `${50 + ((tempMarker.lng - activeCity.lng) / 0.15) * 100}%`,
                  top: `${50 - ((tempMarker.lat - activeCity.lat) / 0.15) * 100}%`
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="p-1.5 bg-indigo-600 border border-white text-white rounded-full animate-bounce shadow-xl">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div className="bg-indigo-600 text-white font-extrabold text-[8px] py-0.5 px-1.5 rounded-md mt-1 shadow-md whitespace-nowrap">
                    NEW HAZARD TAGGED
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Click guidance overlay on bottom right */}
        {activeTab === "simulator" && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-[10px] font-medium text-slate-300 max-w-xs pointer-events-none z-10 shadow-lg">
            🗺️ Click grid to place custom pinpoint & log potholes, flooding, streetlights!
          </div>
        )}
      </div>
    );
  }


  // Handle map click to place temporary marker for reporting
  const handleMapClick = async (e: any) => {
    const latLng = e.detail.latLng;
    if (!latLng) return;
    
    // Extract lat, lng safely
    const lat = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng;

    // Use reverse geocoding via standard browser geolocation if available or a generic address
    let address = "Geotagged Spot, India";
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        address = response.results[0].formatted_address;
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    }

    onPlaceTempMarker({ lat, lng, address });
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          center={mapCenter}
          zoom={mapZoom}
          onCenterChanged={(e) => setMapCenter(e.detail.center)}
          onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          style={{ width: "100%", height: "100%" }}
          onClick={handleMapClick}
          disableDefaultUI={false}
          gestureHandling="cooperative"
        >
          {/* Main reported issues markers */}
          {!heatmapMode &&
            issues.map((issue) => (
              <AdvancedMarker
                key={issue.id}
                position={{ lat: issue.lat, lng: issue.lng }}
                title={issue.title}
                onClick={() => onSelectIssue(issue)}
              >
                <Pin
                  background={categoryColors[issue.category]?.pinBg || "#64748b"}
                  borderColor="#fff"
                  glyphColor="#fff"
                  scale={selectedIssue?.id === issue.id ? 1.25 : 1.0}
                />
              </AdvancedMarker>
            ))}

          {/* Heatmap overlay simulation - elegant translucent radial rings that pulse at critical coordinates */}
          {heatmapMode &&
            issues.map((issue) => {
              // Increase size for high priority, and make color map to severity
              const isHigh = issue.priority === "high";
              const isMed = issue.priority === "medium";
              const pulseColor = isHigh ? "rgba(239, 68, 68, 0.4)" : isMed ? "rgba(245, 158, 11, 0.4)" : "rgba(59, 130, 246, 0.4)";
              const coreColor = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#3b82f6";
              const size = isHigh ? 50 : isMed ? 35 : 20;

              return (
                <AdvancedMarker key={`heat-${issue.id}`} position={{ lat: issue.lat, lng: issue.lng }}>
                  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                    {/* Glowing outer ring */}
                    <div
                      className="absolute rounded-full animate-ping"
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: pulseColor,
                        animationDuration: isHigh ? "1.5s" : "2.5s",
                      }}
                    />
                    {/* Glowing static background */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "80%",
                        height: "80%",
                        backgroundColor: pulseColor,
                      }}
                    />
                    {/* Solid core center */}
                    <div
                      className="rounded-full border border-white shadow-sm"
                      style={{
                        width: "30%",
                        height: "30%",
                        backgroundColor: coreColor,
                      }}
                    />
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* Clicked temporary location pin */}
          {tempMarker && (
            <AdvancedMarker position={{ lat: tempMarker.lat, lng: tempMarker.lng }}>
              <div className="relative flex flex-col items-center">
                <span className="animate-bounce p-1.5 bg-indigo-600 text-white rounded-full border-2 border-white shadow-lg z-10">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="w-3 h-1 bg-black/30 rounded-full blur-[1px] transform scale-x-150 mt-0.5"></span>
                <div className="absolute top-8 bg-indigo-950 text-white text-[10px] py-1 px-2.5 rounded-md whitespace-nowrap shadow-md z-20 font-medium">
                  Reporting Here
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Click guidance overlay */}
      <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 rounded-xl shadow-lg flex items-center gap-2.5 pointer-events-none max-w-sm">
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse flex-shrink-0" />
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Click anywhere on the map to mark a new community issue & alert officials.
        </p>
      </div>

      {/* Map Legends */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 p-3 rounded-xl shadow-md space-y-2 text-[10px] font-semibold text-slate-700 pointer-events-auto">
        <p className="text-slate-500 uppercase tracking-wider text-[8px] font-bold mb-1 border-b border-slate-100 pb-1">Legend</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
            <span>Pothole</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
            <span>Streetlight</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
            <span>Waterlogging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
            <span>Sanitation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
            <span>Safety Hazard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-white" />
            <span>Other</span>
          </div>
        </div>
      </div>
    </div>
  );
}
