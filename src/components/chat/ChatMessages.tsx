import { type ReactNode, useEffect, useRef, Children } from "react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
	children: ReactNode;
	className?: string;
}

export function ChatMessages({ children, className }: ChatMessagesProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const childCount = Children.count(children);

	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}, [childCount]);

	return (
		<div
			ref={containerRef}
			className={cn("flex-1 overflow-y-auto space-y-4 p-4 min-h-0", className)}
		>
			{children}
		</div>
	);
}
