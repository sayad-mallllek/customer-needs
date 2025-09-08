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
  path: "login",
  component: LoginPage,
});

function LoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword(data);
    setLoading(false);
    if (error) {
      setError(error.message);
      push({
        title: "Login failed",
        description: error.message,
        variant: "error",
      });
    } else {
      push({ title: "Welcome back!", variant: "success" });
      window.location.href = "/";
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <Card>
        <h1 className="text-lg font-semibold mb-4">Login</h1>
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
            Sign In
          </Button>
          <p className="text-xs text-neutral-500 text-center">
            No account?{" "}
            <a className="underline" href="/signup">
              Sign up
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
}
