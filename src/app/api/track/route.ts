import { NextResponse } from "next/server"; 
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_KEY!
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
    const { apiKey, events, userId } = await req.json(); // <-- Receive userId from frontend

    if (!apiKey || !userId || !Array.isArray(events) || events.length === 0) {
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

    const sessionId = events[0].sessionId;

    // ------------------------------
    // LIMIT CHECK — Max 10 unique session_ids per project
    const { data: sessionRows, error: sessionErr } = await supabase
      .from("events")
      .select("session_id")
      .eq("project_id", project.id);

    if (sessionErr) {
      console.error("Session check failed:", sessionErr);
    }

    const sessionList = Array.from(new Set(sessionRows?.map(s => s.session_id) || []));
    const alreadyKnownSession = sessionList.includes(sessionId);

    if (sessionList.length >= 10 && !alreadyKnownSession) {
      return NextResponse.json({
        message: "Session limit reached. Ignoring new session.",
        allowed: false,
      });
    }

    // ------------------------------
    // Determine if user is returning based on userId instead of session
    const { data: existingUser } = await supabase
      .from("events")
      .select("id")
      .eq("project_id", project.id)
      .eq("user_id", userId)
      .limit(1);

    const isReturningUser = !!existingUser?.length;

    // Add location to events
    const enhancedEvents = events.map((evt: TrackEvent) => ({
      ...evt,
      location,
    }));

    // Insert into Supabase with userId and is_returning_user
    const { error } = await supabase.from("events").insert({
      project_id: project.id,
      session_id: sessionId,
      user_id: userId, // <-- store the persistent userId
      events: enhancedEvents,
      is_returning_user: isReturningUser,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_returning_user: isReturningUser });
  } catch (err) {
    console.error("Unexpected error in /api/track:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
