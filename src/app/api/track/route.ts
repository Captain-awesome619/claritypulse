import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  'https://kvaoiwbayieglyyxjadj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2YW9pd2JheWllZ2x5eXhqYWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ2MTM3MywiZXhwIjoyMDc4MDM3MzczfQ.2qraWqxnWPs7IbkEKJz-R9qeLvkeyh0y2FLsvw-n3ws'
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

    // Validate
    if (!apiKey || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // All events share the same sessionId
    const sessionId = events[0].sessionId;

    // Insert **one row** containing all events
    const { error } = await supabase.from("events").insert({
      project_id: project.id,
      session_id: sessionId,
      events: events, // store whole array
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