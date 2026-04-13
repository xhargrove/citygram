/** True when sign-in failed because the address is not verified yet. */
export function isEmailNotConfirmedError(err: { message?: string; code?: string }): boolean {
  const lower = err.message?.toLowerCase() ?? "";
  const code = err.code?.toLowerCase() ?? "";
  return (
    code === "email_not_confirmed" ||
    lower.includes("email not confirmed") ||
    (lower.includes("not confirmed") && lower.includes("email"))
  );
}

/** Human-readable copy for Supabase Auth errors (password grant, sign-in). */
export function formatSignInError(err: {
  message: string;
  status?: number;
  code?: string;
}): string {
  const msg = err.message?.trim() || "Could not sign in.";
  const lower = msg.toLowerCase();
  const code = err.code?.toLowerCase() ?? "";

  if (
    code === "email_not_confirmed" ||
    lower.includes("email not confirmed") ||
    lower.includes("not confirmed")
  ) {
    return `${msg} Use the link in your inbox (and Spam) to confirm, then sign in again.`;
  }

  if (
    code === "invalid_credentials" ||
    lower.includes("invalid login") ||
    lower.includes("invalid email or password")
  ) {
    return `${msg} If you just registered, confirm your email first, or use “Forgot password”.`;
  }

  return msg;
}
