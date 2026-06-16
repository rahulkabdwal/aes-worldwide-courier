import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import logo from "@/assets/logo.png";

type ResetErrors = {
  password?: string;
  confirmPassword?: string;
};

function setPageMeta(title: string, description: string) {
  document.title = title;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }

  meta.content = description;
}

function getRecoveryTokensFromUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type") ?? searchParams.get("type");
  const code = searchParams.get("code");

  return { accessToken, refreshToken, type, code };
}

function validatePasswords(password: string, confirmPassword: string) {
  const errors: ResetErrors = {};

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }

  return errors;
}

export default function ResetPassword() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const recoveryUrl = useMemo(() => getRecoveryTokensFromUrl(), []);

  useEffect(() => {
    setPageMeta(
      "Reset Password | AES Worldwide Courier",
      "Create a new secure password for your AES Worldwide Courier admin account.",
    );

    let isMounted = true;

    const initializeRecoverySession = async () => {
      setIsCheckingSession(true);
      setSessionError(null);

      try {
        console.log("Recovery URL:", recoveryUrl);
        console.log("Current URL:", window.location.href);

        const hasRecoveryContext =
          recoveryUrl.type === "recovery" ||
          Boolean(recoveryUrl.code) ||
          Boolean(recoveryUrl.accessToken) ||
          Boolean(recoveryUrl.refreshToken);

        if (recoveryUrl.accessToken && recoveryUrl.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: recoveryUrl.accessToken,
            refresh_token: recoveryUrl.refreshToken,
          });

          if (error) {
            throw error;
          }
        } else if (recoveryUrl.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            recoveryUrl.code,
          );

          if (error) {
            throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const hasSession = Boolean(data.session);
        setHasRecoverySession(hasSession && hasRecoveryContext);
        if (!hasSession || !hasRecoveryContext) {
          setSessionError(
            "This password reset link is invalid or has expired. Please request a new reset link.",
          );
        }
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Unable to verify this password reset link.";
        setSessionError(message);
        setHasRecoverySession(false);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasRecoverySession(true);
        setSessionError(null);
        setIsCheckingSession(false);
      }
    });

    void initializeRecoverySession();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [
    recoveryUrl.accessToken,
    recoveryUrl.code,
    recoveryUrl.refreshToken,
    recoveryUrl.type,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validatePasswords(password, confirmPassword);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update your password. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <CardTitle className="mt-4">Reset Link Unavailable</CardTitle>
            <CardDescription>{sessionError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src={logo}
            alt="AES Worldwide Courier"
            className="mx-auto h-14 w-auto"
          />
          {isSuccess ? (
            <div className="mx-auto mt-6 flex size-12 items-center justify-center rounded-full bg-green-50 text-green-700">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
          ) : (
            <div className="mx-auto mt-6 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-black">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </div>
          )}
          <CardTitle className="mt-4">
            {isSuccess ? "Password updated successfully" : "Create New Password"}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? "Your admin password has been changed securely."
              : "Choose a strong password for your AES admin account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Button asChild className="w-full">
              <Link href="/admin/login">Go to Admin Login</Link>
            </Button>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {submitError ? (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                />
                {errors.password ? (
                  <p className="text-xs text-red-600">{errors.password}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword ? (
                  <p className="text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
