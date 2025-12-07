import { NextResponse } from "next/server"; 
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kvaoiwbayieglyyxjadj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2YW9pd2JheWllZ2x5eXhqYWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ2MTM3MywiZXhwIjoyMDc4MDM3MzczfQ.2qraWqxnWPs7IbkEKJz-R9qeLvkeyh0y2FLsvw-n3ws"
);

interface TrackEvent {
  type: string;
  sessionId: string;
  timestamp: string;
  url: string;
  title: string;
  referrer: string;
  userAgent: string;
  payload: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const { apiKey, events } = await req.json();

    if (!apiKey || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const forwardedFor =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";
    const ip = forwardedFor.split(",")[0].trim() || "0.0.0.0";

    let location = null;
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await geoRes.json();

      location = {
        ip,
        city: geo.city,
        region: geo.region,
        country: geo.country_name,
        country_code: geo.country,
        latitude: geo.latitude,
        longitude: geo.longitude,
        timezone: geo.timezone,
      };
    } catch (err) {
      console.error("Geo lookup failed:", err);
      location = null;
    }

    const enhancedEvents = events.map((evt: TrackEvent) => ({
      ...evt,
      location,
    }));

    const sessionId = events[0].sessionId;

    // ----------------------------------------------------
    // ✅ LIMIT CHECK — Max 10 unique session_ids per project
   // Get all session_ids for this project
const { data: sessionRows, error: sessionErr } = await supabase
  .from("events")
  .select("session_id")
  .eq("project_id", project.id);

if (sessionErr) {
  console.error("Session check failed:", sessionErr);
}

// Get unique session IDs
const sessionList = Array.from(new Set(sessionRows?.map(s => s.session_id) || []));

// Check if current session is already known
const alreadyKnown = sessionList.includes(sessionId);

// Enforce max 10 sessions
if (sessionList.length >= 10  && !alreadyKnown) {
  return NextResponse.json({
    message: "Session limit reached. Ignoring new session.",
    allowed: false,
  });
}

    // ----------------------------------------------------

    const { error } = await supabase.from("events").insert({
      project_id: project.id,
      session_id: sessionId,
      events: enhancedEvents,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in /api/track:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
