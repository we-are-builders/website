import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
	children: ReactNode;
	className?: string;
}

export function ChatMessages({ children, className }: ChatMessagesProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	return (
		<div
			className={cn("flex-1 overflow-y-auto space-y-4 p-4 min-h-0", className)}
		>
			{children}
			<div ref={messagesEndRef} />
		</div>
	);
}
