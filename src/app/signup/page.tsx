import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center px-6 text-sm text-muted">
          Loading…
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
