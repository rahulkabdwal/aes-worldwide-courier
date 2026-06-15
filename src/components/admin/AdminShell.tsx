import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { adminSignOut } from "@/features/admin/adminApi";
import { useAdminAuth } from "@/features/admin/auth/AdminAuthProvider";
import logo from "@/assets/logo.png"; 

type AdminShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function AdminShell({
  title,
  description,
  children,
  actions,
}: AdminShellProps) {
  const [, navigate] = useLocation();
  const { session } = useAdminAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await adminSignOut();
      navigate("/admin/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign out.";
      setSignOutError(message);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="inline-flex items-center">
                <img
                  src={logo}
                  alt="AES Worldwide Courier"
                  className="h-10 w-auto sm:h-14"
                />
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="truncate text-xs text-neutral-500 sm:text-sm">
                {session?.user.email ?? "Admin"}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Spinner />
                    Signing out...
                  </>
                ) : (
                  "Sign out"
                )}
              </Button>
            </div>
          </div>
          {signOutError ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{signOutError}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            {description ? (
              <p className="text-sm text-neutral-500 max-w-2xl">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {children}
      </main>
    </div>
  );
}
