"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { validateRegistrationInput } from "@/lib/validators";
import type { UserRole } from "@/types/user.types";
import type { ValidationError } from "@/lib/validators";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const { handleRegister, loading, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole | "">("");
  const [entityId, setEntityId] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  function getFieldError(field: string): string | undefined {
    return validationErrors.find((e) => e.field === field)?.message;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side validation
    const errors = validateRegistrationInput(
      email,
      password,
      (role || "invalid") as UserRole,
      entityId
    );

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const result = await handleRegister(
      email,
      password,
      role as UserRole,
      entityId
    );

    if (result.success) {
      router.push(`/${role}`);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Join Nexora to connect with the right mentors and startups
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authError && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {authError.message}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!getFieldError("email")}
              aria-describedby={
                getFieldError("email") ? "email-error" : undefined
              }
            />
            {getFieldError("email") && (
              <p id="email-error" className="text-sm text-destructive">
                {getFieldError("email")}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!getFieldError("password")}
                aria-describedby={
                  getFieldError("password") ? "password-error" : undefined
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {getFieldError("password") && (
              <p id="password-error" className="text-sm text-destructive">
                {getFieldError("password")}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger
                id="role"
                aria-invalid={!!getFieldError("role")}
                aria-describedby={
                  getFieldError("role") ? "role-error" : undefined
                }
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">I am a Startup</SelectItem>
                <SelectItem value="mentor">I am a Mentor</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError("role") && (
              <p id="role-error" className="text-sm text-destructive">
                {getFieldError("role")}
              </p>
            )}
          </div>

          {/* Entity ID */}
          <div className="space-y-2">
            <Label htmlFor="entityId">
              {role === "mentor" ? "Mentor ID" : "Startup ID"}
            </Label>
            <Input
              id="entityId"
              type="text"
              placeholder={
                role === "mentor"
                  ? "Enter your Mentor ID"
                  : "Enter your Startup ID"
              }
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              aria-invalid={!!getFieldError("entityId")}
              aria-describedby={
                getFieldError("entityId") ? "entityId-error" : undefined
              }
            />
            {getFieldError("entityId") && (
              <p id="entityId-error" className="text-sm text-destructive">
                {getFieldError("entityId")}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
