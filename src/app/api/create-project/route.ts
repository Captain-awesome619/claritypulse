import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const SUPABASE_URL =process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

function normalizeDomain(raw: string) {
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain: rawDomain, project_name } = body ?? {};

    const authHeader = req.headers.get("authorization") ?? "";
    if (!rawDomain) return NextResponse.json({ error: "domain required" }, { status: 400 });
    if (!authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "missing auth token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "invalid token" }, { status: 401 });

    const userId = userData.user.id;
    const domain = normalizeDomain(rawDomain);
    if (!domain) return NextResponse.json({ error: "invalid domain" }, { status: 400 });

    // Check if user already has a project
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("projects")
      .select("id, domain, api_key, project_name, snippet")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingErr) {
      console.error("DB error checking project:", existingErr);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        message: "This project already exists",
        project: existing,
        snippet: existing.snippet,
      });
    }

    // Ensure domain isn't taken by another user
    const { data: other, error: otherErr } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();

    if (otherErr) {
      console.error("DB error checking domain:", otherErr);
      return NextResponse.json({ error: "server error" }, { status: 500 });
    }

    if (other) return NextResponse.json({ error: "domain_already_taken" }, { status: 409 });

    // Generate API key and snippet
    const apiKey = `ingest_${nanoid(24)}`;
    const snippet = `<script async src="https://claritypulse.onrender.com/track.js" data-key="${apiKey}"></script>`;

    // Insert project with snippet into database
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("projects")
      .insert([{ user_id: userId, domain, api_key: apiKey, project_name, snippet }])
      .select("id, user_id, domain, api_key, project_name, snippet, created_at")
      .single();

    if (insertErr || !inserted) {
      console.error("Insert error:", insertErr);
      return NextResponse.json({ error: "failed_to_create" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Your tracking link has been successfully created",
      project: inserted,
      snippet,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
