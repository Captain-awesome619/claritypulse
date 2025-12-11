// app/api/test/route.ts
export function GET() {
  return Response.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service: !!process.env.SUPABASE_SERVICE_KEY,
  });
}
