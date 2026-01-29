import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { parseMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
	name: string;
	imageUrl?: string;
	content: string;
	timestamp: number;
	isOwn?: boolean;
	showAvatar?: boolean;
}

export function ChatMessage({
	name,
	imageUrl,
	content,
	timestamp,
	isOwn = false,
	showAvatar = true,
}: ChatMessageProps) {
	const formattedTime = new Date(timestamp).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

	return (
		<div className={cn("flex gap-3 items-start", isOwn && "flex-row-reverse")}>
			{showAvatar ? (
				<Avatar size="sm">
					<AvatarImage src={imageUrl} alt={name} />
					<AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
				</Avatar>
			) : (
				<div className="w-6" />
			)}
			<div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
				{showAvatar && (
					<div
						className={cn(
							"flex items-center gap-2 mb-1",
							isOwn && "flex-row-reverse",
						)}
					>
						<span className="text-sm font-medium text-foreground">{name}</span>
						<span className="text-xs text-muted-foreground">
							{formattedTime}
						</span>
					</div>
				)}
				<div
					className={cn(
						"rounded-lg px-3 py-2 text-sm",
						isOwn
							? "bg-primary text-primary-foreground"
							: "bg-accent text-foreground",
					)}
				>
					{parseMentions(content).map((segment, index) =>
						segment.type === "mention" ? (
							<span
								key={`${segment.type}-${segment.content}-${index}`}
								className={cn(
									"font-semibold",
									isOwn ? "text-primary-foreground/90" : "text-primary",
								)}
							>
								{segment.content}
							</span>
						) : (
							<span key={`${segment.type}-${index}`}>{segment.content}</span>
						),
					)}
				</div>
			</div>
		</div>
	);
}
