"use client";

import { AlertCircle } from "lucide-react";

/** Shell primitives. Deliberately plain — the templates supply the personality. */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  counter?: string;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium"
          style={{ color: "var(--shell-ink)" }}
        >
          {label}
        </label>
        {counter && (
          <span className="digits text-[0.7rem]" style={{ color: "var(--shell-muted)" }}>
            {counter}
          </span>
        )}
      </div>

      {children}

      {hint && !error && (
        <p id={hintId} className="text-[0.75rem]" style={{ color: "var(--shell-muted)" }}>
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-[0.75rem] font-medium"
          style={{ color: "#dc2626" }}
        >
          <AlertCircle size={13} strokeWidth={2.5} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

const controlBase =
  "w-full rounded-lg border px-3 py-2.5 text-base transition-colors duration-200 placeholder:opacity-60";

export function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    borderColor: hasError ? "#dc2626" : "var(--shell-line-strong)",
    background: "var(--shell-raised)",
    color: "var(--shell-ink)",
  };
}

export function TextInput({
  hasError,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      {...props}
      className={`${controlBase} ${className}`}
      style={inputStyle(Boolean(hasError))}
    />
  );
}

export function TextArea({
  hasError,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      {...props}
      className={`${controlBase} resize-none ${className}`}
      style={inputStyle(Boolean(hasError))}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--shell-ink)",
      color: "var(--shell-raised)",
      borderColor: "var(--shell-ink)",
    },
    secondary: {
      background: "var(--shell-raised)",
      color: "var(--shell-ink)",
      borderColor: "var(--shell-line-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--shell-muted)",
      borderColor: "transparent",
    },
  };

  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-[opacity,transform] duration-200 hover:opacity-85 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${className}`}
      style={{ ...styles[variant], ...props.style }}
    />
  );
}
