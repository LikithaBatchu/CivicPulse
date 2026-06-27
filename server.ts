import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { IssueReport, IssueCategory, IssuePriority, IssueStatus } from "./src/types.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// File persistence setup
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "issues.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed data
const seedIssues: IssueReport[] = [
  {
    id: "seed-1",
    title: "Massive Crater-like Pothole",
    description: "A huge pothole right at the Sony World Signal intersection. It is extremely dangerous for two-wheelers, especially during night or rain, as it fills up with water and becomes invisible.",
    category: "pothole",
    status: "reported",
    priority: "high",
    lat: 12.9345,
    lng: 77.6192,
    address: "Sony World Signal, Koramangala 4th Block, Bengaluru, Karnataka 560034",
    reporterName: "Arjun Mehta",
    reporterPhone: "+91 98765 43210",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    upvotes: 42,
    comments: [
      {
        id: "c1",
        author: "Sneha Sharma",
        text: "I almost fell off my scooter here yesterday! It's incredibly unsafe.",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      }
    ],
    department: "BBMP Road Infrastructure Department",
    aiResponse: "Auto-analyzed: High-severity hazard identified. Located on an active transit corridor. BBMP Road Infrastructure has been notified. Estimated inspection within 24 hours.",
    aiRemedy: "Please slow down when approaching Sony World Signal. Avoid tailgating other vehicles to ensure you have clear visibility of the road surface."
  },
  {
    id: "seed-2",
    title: "Severe Flooding & Waterlogging",
    description: "Outer Ring Road is completely flooded near EcoSpace. Water is about 2 feet deep. Traffic is backed up for 5 kilometers. Drains appear to be fully blocked with plastic waste and silt.",
    category: "flooding",
    status: "in-progress",
    priority: "high",
    lat: 12.9279,
    lng: 77.6801,
    address: "Outer Ring Road, opposite EcoSpace, Bellandur, Bengaluru, Karnataka 560103",
    reporterName: "Sneha Rao",
    reporterPhone: "+91 99000 12345",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    upvotes: 118,
    comments: [
      {
        id: "c2",
        author: "Kiran Paul",
        text: "Avoid this route completely! It took me 2 hours to cross a 1km stretch.",
        createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
      {
        id: "c3",
        author: "Municipal Control Room",
        text: "Emergency response team with suction pumps has been deployed to clear the clogged culvert.",
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        isAdmin: true,
      }
    ],
    department: "BBMP Stormwater Drain Department",
    aiResponse: "Auto-analyzed: Critical flooding incident. Direct correlation with severe drainage blockages detected. Suction pumps and storm drainage crews dispatched.",
    aiRemedy: "Take the Sarjapur road diversion if possible. Do not attempt to walk or drive through flowing water as depth can be deceptive."
  },
  {
    id: "seed-3",
    title: "Entire Block in Darkness - Broken Streetlights",
    description: "All 5 streetlights along 12th Main Road Indiranagar (near the public library) are non-functional. It is pitch black. Senior citizens find it impossible to walk, and there is high risk of chain snatching.",
    category: "light",
    status: "acknowledged",
    priority: "medium",
    lat: 12.9784,
    lng: 77.6408,
    address: "12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560008",
    reporterName: "Ramesh Kumar",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    upvotes: 19,
    comments: [],
    department: "BESCOM Electrical Division",
    aiResponse: "Auto-analyzed: Public safety concern. Street lighting failures elevate security risks. Ticket routed to Indiranagar Sub-station for line checking.",
    aiRemedy: "Carry a flashlight or use your mobile torch when walking at night. Avoid solo walks along this stretch after 9 PM until fixed."
  },
  {
    id: "seed-4",
    title: "Overflowing Garbage Dumpster near Beach",
    description: "The main municipal bin is overflowing onto the main road. Street dogs are scattering garbage everywhere, and the smell is unbearable. It is posing a serious sanitation risk for local shops and walkers.",
    category: "sanitation",
    status: "reported",
    priority: "medium",
    lat: 19.1025,
    lng: 72.8264,
    address: "Juhu Tara Road, near Juhu Beach, Santacruz West, Mumbai, Maharashtra 400049",
    reporterName: "Priya Sharma",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    upvotes: 68,
    comments: [],
    department: "BMC Solid Waste Management",
    aiResponse: "Auto-analyzed: High public health priority. Garbage spillover in highly congested public zone. BMC solid waste pickup vehicle scheduled for immediate clearing.",
    aiRemedy: "Avoid disposal outside the bin. Keep pets away from scattered trash to prevent potential pathogen transmission."
  },
  {
    id: "seed-5",
    title: "Hanging Live Electrical Wire",
    description: "A high-tension electrical cable has snapped and is hanging extremely low over the pedestrian pathway right outside the Metro Station gate. Water pools are nearby, posing an imminent shock hazard.",
    category: "safety",
    status: "reported",
    priority: "high",
    lat: 28.6304,
    lng: 77.2177,
    address: "Gate No. 2, Connaught Place Metro Station, New Delhi, Delhi 110001",
    reporterName: "Amit Verma",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    upvotes: 152,
    comments: [
      {
        id: "c4",
        author: "Rajesh G",
        text: "This is a deathtrap! I saw sparkings 15 mins ago! Please stay away!",
        createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      }
    ],
    department: "NDMC Power Division",
    aiResponse: "Auto-analyzed: LIFE-THREATENING HAZARD. snap-alert triggered. Immediate emergency line shut-off protocol recommended for the Connaught Place Metro grid.",
    aiRemedy: "DO NOT GO NEAR the pathway. Maintain a distance of at least 15 meters. Warn other commuters exiting the metro station."
  }
];

// Helper to read database
function readIssues(): IssueReport[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading database file, using seeds:", err);
  }
  // Write seeds if missing
  writeIssues(seedIssues);
  return seedIssues;
}

// Helper to write database
function writeIssues(issues: IssueReport[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(issues, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// --- API ENDPOINTS ---

// GET: All reported issues
app.get("/api/issues", (req, res) => {
  try {
    const issues = readIssues();
    res.json({ success: true, issues });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to read issues" });
  }
});

// POST: Report a new issue
app.post("/api/issues", async (req, res) => {
  try {
    const { title, description, category, lat, lng, address, reporterName, reporterPhone, photoUrl } = req.body;

    if (!title || !description || !category || !lat || !lng) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const issues = readIssues();

    const newIssue: IssueReport = {
      id: "issue-" + Date.now(),
      title,
      description,
      category,
      status: "reported",
      priority: "medium", // default, will be updated by AI if available
      lat,
      lng,
      address: address || "Location in India",
      reporterName: reporterName || "Anonymous Citizen",
      reporterPhone,
      photoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      comments: []
    };

    // Perform AI analysis if Gemini is available
    if (ai) {
      try {
        const prompt = `You are CivicPulse AI, a smart assistant for municipal corporations in India.
Analyze the following citizen report:
Title: "${title}"
Description: "${description}"
Category: "${category}"

Provide your assessment in strict JSON format. Do not include markdown code block formatting like \`\`\`json. Just provide raw JSON with keys:
"category": (re-evaluate if category is accurate. Choose from: "pothole", "light", "flooding", "sanitation", "safety", "other")
"priority": (choose from: "low", "medium", "high" based on danger, traffic impact, and public risk)
"department": (suggest an Indian municipal department, e.g., "BBMP Road Infrastructure Department", "BMC Solid Waste Management", "BESCOM Power", "Traffic Police")
"aiResponse": (a short, professional, encouraging, and reassuring message back to the citizen, up to 3 sentences)
"aiRemedy": (a practical temporary safety advice for other citizens, up to 2 sentences)

Return only the valid JSON object.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const textOutput = response.text || "{}";
        const aiAnalysis = JSON.parse(textOutput.trim());

        if (aiAnalysis.category) newIssue.category = aiAnalysis.category;
        if (aiAnalysis.priority) newIssue.priority = aiAnalysis.priority;
        if (aiAnalysis.department) newIssue.department = aiAnalysis.department;
        if (aiAnalysis.aiResponse) newIssue.aiResponse = aiAnalysis.aiResponse;
        if (aiAnalysis.aiRemedy) newIssue.aiRemedy = aiAnalysis.aiRemedy;

      } catch (geminiError) {
        console.error("Gemini analysis failed, using fallback rules:", geminiError);
        // Fallback simple priority categorization
        if (description.toLowerCase().includes("wire") || description.toLowerCase().includes("current") || description.toLowerCase().includes("safety") || title.toLowerCase().includes("danger")) {
          newIssue.priority = "high";
        }
        newIssue.department = "Municipal General Works Department";
        newIssue.aiResponse = "Report logged. Thank you for reporting! The Municipal General Works department has been notified for assessment.";
        newIssue.aiRemedy = "Be careful and keep safe distance from this spot.";
      }
    } else {
      // Local rules fallback
      if (description.toLowerCase().includes("wire") || description.toLowerCase().includes("shock") || description.toLowerCase().includes("dangerous")) {
        newIssue.priority = "high";
      }
      newIssue.department = "Municipal General Works Department";
      newIssue.aiResponse = "Report logged successfully. The concerned city department has been notified.";
      newIssue.aiRemedy = "Keep a safe distance from the reported area.";
    }

    issues.push(newIssue);
    writeIssues(issues);

    res.json({ success: true, issue: newIssue });
  } catch (error) {
    console.error("Failed to report issue:", error);
    res.status(500).json({ success: false, error: "Failed to create issue" });
  }
});

// PATCH: Upvote an issue
app.patch("/api/issues/:id/upvote", (req, res) => {
  try {
    const { id } = req.params;
    const issues = readIssues();
    const issue = issues.find(i => i.id === id);

    if (!issue) {
      return res.status(404).json({ success: false, error: "Issue not found" });
    }

    issue.upvotes += 1;
    issue.updatedAt = new Date().toISOString();
    writeIssues(issues);

    res.json({ success: true, upvotes: issue.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to upvote" });
  }
});

// POST: Add a comment to an issue
app.post("/api/issues/:id/comments", (req, res) => {
  try {
    const { id } = req.params;
    const { author, text, isAdmin } = req.body;

    if (!author || !text) {
      return res.status(400).json({ success: false, error: "Author and text are required" });
    }

    const issues = readIssues();
    const issue = issues.find(i => i.id === id);

    if (!issue) {
      return res.status(404).json({ success: false, error: "Issue not found" });
    }

    const newComment = {
      id: "comment-" + Date.now(),
      author,
      text,
      createdAt: new Date().toISOString(),
      isAdmin: !!isAdmin
    };

    issue.comments.push(newComment);
    issue.updatedAt = new Date().toISOString();
    writeIssues(issues);

    res.json({ success: true, comment: newComment });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add comment" });
  }
});

// PATCH: Update issue status (by official)
app.patch("/api/issues/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status, officialComment } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    const issues = readIssues();
    const issue = issues.find(i => i.id === id);

    if (!issue) {
      return res.status(404).json({ success: false, error: "Issue not found" });
    }

    issue.status = status;
    issue.updatedAt = new Date().toISOString();

    if (officialComment) {
      issue.comments.push({
        id: "comment-off-" + Date.now(),
        author: "Municipal Control Room",
        text: `Status changed to [${status.toUpperCase()}]. Note: ${officialComment}`,
        createdAt: new Date().toISOString(),
        isAdmin: true
      });
    }

    writeIssues(issues);
    res.json({ success: true, issue });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

// GET: Gemini Smart City Health Analysis
app.get("/api/gemini/summary", async (req, res) => {
  if (!ai) {
    return res.json({
      success: true,
      summary: "City Health Dashboard summary: Active issues are being monitored. AI features are ready once GEMINI_API_KEY is configured in Secrets."
    });
  }

  try {
    const issues = readIssues();
    const activeIssues = issues.filter(i => i.status !== "resolved");

    const categoryCounts = activeIssues.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityCounts = activeIssues.reduce((acc, curr) => {
      acc[curr.priority] = (acc[curr.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issueSummaries = activeIssues.map(i => `- [${i.category.toUpperCase()}] [${i.priority.toUpperCase()}] ${i.title} in ${i.address.split(",")[1] || "Area"}: ${i.description.slice(0, 100)}...`).join("\n");

    const prompt = `You are CivicPulse AI, the Senior Smart City Consultant advising the Municipal Corporation Commissioner.
We have ${activeIssues.length} active municipal issues reported by citizens. Here is the statistical breakdown:
Categories: ${JSON.stringify(categoryCounts)}
Priorities: ${JSON.stringify(priorityCounts)}

List of active reports:
${issueSummaries}

Provide a concise, professional, and actionable "Smart City Health Summary" for the Commissioner's dashboard.
Structure your response in markdown:
1. **Current City Health Assessment**: (Give a Grade from A to F, explain why based on reports density and high priority cases like snapping wire or waterlogging).
2. **Critical Areas & Warning Signals**: (Call out the most urgent problems, particularly in Bengaluru/Delhi/Mumbai context).
3. **Actionable Recommendations for Resource Deployment**: (Suggest which teams/budgets should be redeployed immediately. Keep it highly practical and India-centric, referencing Indian civic structures).
4. **Social Impact Potential**: (Summarize how resolving these quick wins improves safety, trust, and quality of life).

Provide highly professional, executive advisory content. Avoid generic filler.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, summary: response.text });
  } catch (error) {
    console.error("Gemini summary generation failed:", error);
    res.status(500).json({ success: false, error: "Failed to generate AI executive summary" });
  }
});

// Serve frontend assets and listen
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicPulse Backend running on http://0.0.0.0:${PORT}`);
  });
}
initServer();
