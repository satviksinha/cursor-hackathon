"use client";

import { useAuth } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onToggleMode={() =>
          setAuthMode(authMode === "signin" ? "signup" : "signin")
        }
      />
    );
  }

  return <>{children}</>;
}
