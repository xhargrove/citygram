export function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    supabaseConfigured: Boolean(url && anon),
    supabaseUrl: url ?? "",
    supabaseAnonKey: anon ?? "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}
