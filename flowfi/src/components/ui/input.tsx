import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="mb-2 block text-sm font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            error && "border-destructive",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
