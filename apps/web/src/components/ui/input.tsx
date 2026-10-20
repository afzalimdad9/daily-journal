import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn("flex h-10 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/15", className)} {...props} />;
}
