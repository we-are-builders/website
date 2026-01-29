import { Clock, Lock, User, Users } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { VoteButtons } from "./VoteButtons";

interface PresentationCardProps {
	presentation: {
		_id: Id<"presentations">;
		title: string;
		description: string;
		speakerName: string;
		speakerBio?: string;
		duration: number;
		targetAudience: string;
		eventId: Id<"events">;
		status: "pending" | "approved" | "rejected";
		adminApproved: boolean;
		submitter?: { name: string; imageUrl?: string } | null;
		votes: {
			approve: number;
			reject: number;
			total: number;
		};
		userVote?: "approve" | "reject" | null;
	};
	showVoting?: boolean;
	showAdminControls?: boolean;
	votingClosed?: boolean;
	onAdminApprove?: () => void;
	onAdminReject?: () => void;
}

export function PresentationCard({
	presentation,
	showVoting = false,
	showAdminControls = false,
	votingClosed = false,
	onAdminApprove,
	onAdminReject,
}: PresentationCardProps) {
	const approvalPercentage =
		presentation.votes.total > 0
			? Math.round(
					(presentation.votes.approve / presentation.votes.total) * 100,
				)
			: 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-lg">{presentation.title}</CardTitle>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<User className="h-4 w-4" />
							<span>{presentation.speakerName}</span>
						</div>
					</div>
					<div className="flex flex-col gap-2 items-end">
						<Badge
							variant={
								presentation.status === "approved"
									? "default"
									: presentation.status === "rejected"
										? "destructive"
										: "secondary"
							}
						>
							{presentation.status}
						</Badge>
						{presentation.adminApproved &&
							presentation.status === "pending" && (
								<Badge
									variant="outline"
									className="text-green-400 border-green-400"
								>
									Admin Approved
								</Badge>
							)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-foreground/80 text-sm">{presentation.description}</p>

				<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<Clock className="h-4 w-4" />
						<span>{presentation.duration} min</span>
					</div>
					<div className="flex items-center gap-1">
						<Users className="h-4 w-4" />
						<span>{presentation.targetAudience}</span>
					</div>
				</div>

				{presentation.speakerBio && (
					<div className="text-sm">
						<span className="text-muted-foreground">Speaker Bio: </span>
						<span className="text-muted-foreground">
							{presentation.speakerBio}
						</span>
					</div>
				)}

				{/* Voting Section */}
				{showVoting && presentation.status === "pending" && (
					<div className="pt-4 border-t border-border">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								<span className="font-medium text-foreground">
									{approvalPercentage}%
								</span>{" "}
								approval ({presentation.votes.total} votes)
							</div>
							{votingClosed ? (
								<Badge variant="secondary" className="gap-1">
									<Lock className="h-3 w-3" />
									Voting closed
								</Badge>
							) : (
								<VoteButtons
									presentationId={presentation._id}
									eventId={presentation.eventId}
									currentVote={presentation.userVote}
									voteCounts={presentation.votes}
									disabled={votingClosed}
								/>
							)}
						</div>
					</div>
				)}

				{/* Admin Controls */}
				{showAdminControls &&
					presentation.status === "pending" &&
					!presentation.adminApproved && (
						<div className="pt-4 border-t border-border flex gap-2">
							<button
								type="button"
								onClick={onAdminApprove}
								className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
							>
								Admin Approve
							</button>
							<button
								type="button"
								onClick={onAdminReject}
								className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
							>
								Reject
							</button>
						</div>
					)}
			</CardContent>
		</Card>
	);
}
