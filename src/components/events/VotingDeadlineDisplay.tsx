import { Clock, Lock } from "lucide-react";
import { Badge } from "../ui/badge";

interface VotingDeadlineDisplayProps {
	deadline: number;
}

export function VotingDeadlineDisplay({
	deadline,
}: VotingDeadlineDisplayProps) {
	const now = Date.now();
	const isPast = now > deadline;
	const timeRemaining = deadline - now;

	// Format the deadline date
	const deadlineDate = new Date(deadline);
	const formattedDate = deadlineDate.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
	const formattedTime = deadlineDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

	// Calculate countdown for times within 24 hours
	const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
	const minutesRemaining = Math.floor(
		(timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
	);

	const showCountdown = !isPast && timeRemaining < 24 * 60 * 60 * 1000;

	if (isPast) {
		return (
			<Badge variant="secondary" className="gap-1">
				<Lock className="h-3 w-3" />
				Voting closed
			</Badge>
		);
	}

	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground">
			<Clock className="h-4 w-4" />
			{showCountdown ? (
				<span>
					Voting ends in{" "}
					<span className="font-medium text-foreground">
						{hoursRemaining > 0
							? `${hoursRemaining}h ${minutesRemaining}m`
							: `${minutesRemaining}m`}
					</span>
				</span>
			) : (
				<span>
					Voting ends {formattedDate} at {formattedTime}
				</span>
			)}
		</div>
	);
}
