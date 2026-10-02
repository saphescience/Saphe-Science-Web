import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://nuojmdchettdhucplpfo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2ptZGNoZXR0ZGh1Y3BscGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjIyMjEsImV4cCI6MjEwNTk5ODIyMX0.T9p3iwWtCEMfVu75EO8B7dkPqdL73xIUB-KBRlKfEvg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
