import { SignedIn, SignedOut, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "convex/react";
import { MessageCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Chat, ChatMessage, ChatMessages } from "../chat";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MentionInput } from "../ui/mention-input";
import { Skeleton } from "../ui/skeleton";

interface EventChatProps {
	eventId: Id<"events">;
	eventStatus: "upcoming" | "ongoing" | "past" | "cancelled";
}

const FIVE_MINUTES = 5 * 60 * 1000;

export function EventChat({ eventId, eventStatus }: EventChatProps) {
	const messages = useQuery(api.messages.listByEvent, { eventId });
	const currentUser = useQuery(api.users.current);
	const sendMessage = useMutation(api.messages.send);

	const isEventActive = eventStatus === "upcoming" || eventStatus === "ongoing";

	const handleSend = async (content: string) => {
		await sendMessage({ eventId, content });
	};

	// Group messages: hide avatar if same user and within 5 minutes
	const shouldShowAvatar = (
		currentIndex: number,
		messagesArray: NonNullable<typeof messages>,
	) => {
		if (currentIndex === 0) return true;
		const current = messagesArray[currentIndex];
		const previous = messagesArray[currentIndex - 1];
		if (current.userId !== previous.userId) return true;
		if (current.createdAt - previous.createdAt > FIVE_MINUTES) return true;
		return false;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MessageCircle className="h-5 w-5" />
					Event Chat
				</CardTitle>
			</CardHeader>
			<CardContent>
				<SignedOut>
					<div className="text-center py-8">
						<p className="text-muted-foreground mb-4">
							Sign in to join the conversation
						</p>
						<SignInButton mode="modal">
							<Button>Sign In</Button>
						</SignInButton>
					</div>
				</SignedOut>
				<SignedIn>
					{!isEventActive ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								{eventStatus === "cancelled"
									? "Chat is unavailable for cancelled events"
									: "Chat is closed for past events"}
							</p>
						</div>
					) : messages === undefined || messages === null ? (
						<div className="space-y-4 py-4">
							{["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
								<div key={key} className="flex gap-3">
									<Skeleton className="h-6 w-6 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-8 w-48" />
									</div>
								</div>
							))}
						</div>
					) : (
						<Chat className="h-96 border rounded-lg">
							<ChatMessages>
								{messages.length === 0 ? (
									<div className="flex items-center justify-center h-full text-muted-foreground">
										No messages yet. Start the conversation!
									</div>
								) : (
									messages.map((message, index) => (
										<ChatMessage
											key={message._id}
											name={message.user?.name ?? "Unknown"}
											imageUrl={message.user?.imageUrl}
											content={message.content}
											timestamp={message.createdAt}
											isOwn={message.userId === currentUser?._id}
											showAvatar={shouldShowAvatar(index, messages)}
										/>
									))
								)}
							</ChatMessages>
							<MentionInput
								onSend={handleSend}
								disabled={!isEventActive}
								eventId={eventId}
							/>
						</Chat>
					)}
				</SignedIn>
			</CardContent>
		</Card>
	);
}
