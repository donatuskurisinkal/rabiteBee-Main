
// Configuration for accessing environment variables
const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://elcbugfsnqitkkgvhapa.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2J1Z2ZzbnFpdGtrZ3ZoYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODA0NzQsImV4cCI6MjA1NzQ1NjQ3NH0.hKg6fszTkCPCuFLM6lpBo8pvO-ozgEbbIncnmbN8VPA",
  },
};

export default config;
