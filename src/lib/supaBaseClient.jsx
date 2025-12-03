import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://kvaoiwbayieglyyxjadj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2YW9pd2JheWllZ2x5eXhqYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjEzNzMsImV4cCI6MjA3ODAzNzM3M30.fqKqpRsbFtd7pRzOVJVGSv8eDLqEy6myn8X3RrZEzmM'
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
