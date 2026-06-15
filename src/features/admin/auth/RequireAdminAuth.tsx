import { useEffect } from "react";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { useAdminAuth } from "@/features/admin/auth/AdminAuthProvider";

export function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { session, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/admin/login");
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
