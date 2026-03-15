import { type HTMLAttributes } from "react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

function Alert({ className = "", variant = "default", ...props }: AlertProps) {
  const variants = {
    default:
      "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100",
    destructive:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200",
  };
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
export { Alert };
