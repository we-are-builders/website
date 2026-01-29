import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatProps {
	children: ReactNode;
	className?: string;
}

export function Chat({ children, className }: ChatProps) {
	return (
		<div className={cn("flex flex-col h-full", className)}>{children}</div>
	);
}
