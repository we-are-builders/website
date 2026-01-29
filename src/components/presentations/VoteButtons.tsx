import { useMutation, useQuery } from "convex/react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface VoteButtonsProps {
	presentationId: Id<"presentations">;
	eventId: Id<"events">;
	currentVote?: "approve" | "reject" | null;
	voteCounts: {
		approve: number;
		reject: number;
		total: number;
	};
	disabled?: boolean;
}

export function VoteButtons({
	presentationId,
	eventId,
	currentVote,
	voteCounts,
	disabled,
}: VoteButtonsProps) {
	const isAttending = useQuery(api.attendees.isAttending, { eventId });
	const castVote = useMutation(api.votes.cast);
	const removeVote = useMutation(api.votes.remove);

	const handleVote = async (vote: "approve" | "reject") => {
		if (currentVote === vote) {
			await removeVote({ presentationId });
		} else {
			await castVote({ presentationId, vote });
		}
	};

	if (!isAttending) {
		return (
			<p className="text-sm text-muted-foreground">
				Attend this event to vote on presentations
			</p>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={() => handleVote("approve")}
				disabled={disabled}
				className={cn(
					"gap-1",
					currentVote === "approve" &&
						"bg-green-500/20 border-green-500 text-green-400",
				)}
			>
				<ThumbsUp className="h-4 w-4" />
				<span>{voteCounts.approve}</span>
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => handleVote("reject")}
				disabled={disabled}
				className={cn(
					"gap-1",
					currentVote === "reject" &&
						"bg-red-500/20 border-red-500 text-red-400",
				)}
			>
				<ThumbsDown className="h-4 w-4" />
				<span>{voteCounts.reject}</span>
			</Button>
		</div>
	);
}
