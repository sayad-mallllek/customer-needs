import { createRoute } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../lib/supabaseClient";
import { Button, Input, Card } from "../components/ui";
import { useToast } from "../components/toast";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "signup",
  component: SignupPage,
});

function SignupPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp(data);
    setLoading(false);
    if (error) {
      setError(error.message);
      push({
        title: "Signup failed",
        description: error.message,
        variant: "error",
      });
    } else {
      push({ title: "Account created", variant: "success" });
      window.location.href = "/";
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <Card>
        <h1 className="text-lg font-semibold mb-4">Sign Up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input type="email" placeholder="Email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button loading={loading} className="w-full">
            Create Account
          </Button>
          <p className="text-xs text-neutral-500 text-center">
            Already have an account?{" "}
            <a className="underline" href="/login">
              Login
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
}
