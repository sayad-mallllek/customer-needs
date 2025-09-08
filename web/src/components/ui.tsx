import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

export function Button({
  className,
  loading,
  disabled,
  ...props
}: ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button
      className={cn("btn btn-primary disabled:opacity-60", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {props.children}
    </button>
  );
}

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/50",
        props.className
      )}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/50",
        props.className
      )}
    />
  );
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/50",
        props.className
      )}
    />
  );
}

export function Card(props: ComponentProps<"div">) {
  return <div {...props} className={cn("card-surface p-4", props.className)} />;
}

export function Empty(props: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-10 text-neutral-500 space-y-2">
      <p className="font-medium text-neutral-700">{props.title}</p>
      {props.description && <p className="text-sm">{props.description}</p>}
      {props.action}
    </div>
  );
}

export function Badge(props: ComponentProps<"span">) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700",
        props.className
      )}
    />
  );
}
