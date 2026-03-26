import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rhclnvhguotfunjhauor.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoY2xudmhndW90ZnVuamhhdW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODMzNzMsImV4cCI6MjA4ODg1OTM3M30.FuFSRO9IuS19WhxjB9BNUmtgax6-W1TYyWyDW1YfJYw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate or retrieve a persistent browser ID for anonymous users
export function getBrowserId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("dizzy_browser_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("dizzy_browser_id", id);
  }
  return id;
}
