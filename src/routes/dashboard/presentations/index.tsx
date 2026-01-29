import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Calendar,
	Check,
	Clock,
	Pencil,
	Plus,
	Users,
	Video,
	X,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";

export const Route = createFileRoute("/dashboard/presentations/")({
	component: PresentationsPage,
});

function PresentationsPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<PresentationsContent />
			</SignedIn>
		</>
	);
}

function RecordingUrlEditor({
	presentationId,
	currentUrl,
}: {
	presentationId: Id<"presentations">;
	currentUrl?: string;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [url, setUrl] = useState(currentUrl ?? "");
	const [error, setError] = useState<string | null>(null);
	const updateRecordingUrl = useMutation(api.presentations.updateRecordingUrl);

	const handleSave = async () => {
		try {
			setError(null);
			await updateRecordingUrl({
				presentationId,
				recordingUrl: url || undefined,
			});
			setIsEditing(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save");
		}
	};

	const handleClear = async () => {
		try {
			setError(null);
			await updateRecordingUrl({
				presentationId,
				recordingUrl: undefined,
			});
			setUrl("");
			setIsEditing(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to clear");
		}
	};

	if (!isEditing) {
		return (
			<div className="flex items-center gap-2 text-sm">
				<Video className="h-4 w-4 text-muted-foreground" />
				{currentUrl ? (
					<>
						<a
							href={currentUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:text-primary/80 truncate max-w-xs"
						>
							{currentUrl}
						</a>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsEditing(true)}
							className="h-6 w-6 p-0"
						>
							<Pencil className="h-3 w-3" />
						</Button>
					</>
				) : (
					<>
						<span className="text-muted-foreground">No recording</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsEditing(true)}
							className="text-xs text-primary hover:text-primary/80"
						>
							Add Recording
						</Button>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Input
					type="url"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="YouTube or Vimeo URL"
					className="h-8 text-sm"
				/>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleSave}
					className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
				>
					<Check className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setUrl(currentUrl ?? "");
						setIsEditing(false);
						setError(null);
					}}
					className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
				>
					<X className="h-4 w-4" />
				</Button>
				{currentUrl && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="h-8 text-xs text-red-400 hover:text-red-300"
					>
						Clear
					</Button>
				)}
			</div>
			{error && <p className="text-xs text-red-400">{error}</p>}
		</div>
	);
}

function PresentationsContent() {
	const myPresentations = useQuery(api.presentations.listMine);
	const currentUser = useQuery(api.users.current);
	const isModerator =
		currentUser?.role === "moderator" || currentUser?.role === "admin";

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							My Presentations
						</h1>
						<p className="text-muted-foreground mt-1">
							Manage your presentation submissions
						</p>
					</div>
					<Link to="/dashboard/presentations/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Presentation
						</Button>
					</Link>
				</div>

				{myPresentations === undefined ? (
					<div className="space-y-4">
						{["s-1", "s-2", "s-3"].map((key) => (
							<Skeleton key={key} className="h-32" />
						))}
					</div>
				) : myPresentations.length === 0 ? (
					<Card>
						<CardContent className="text-center py-12">
							<p className="text-muted-foreground mb-4">
								You haven't submitted any presentations yet.
							</p>
							<Link to="/dashboard/presentations/new">
								<Button>Submit Your First Presentation</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{myPresentations.map((presentation) => (
							<Card key={presentation._id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="space-y-1">
											<CardTitle className="text-lg">
												{presentation.title}
											</CardTitle>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Calendar className="h-4 w-4" />
													<span>
														{presentation.event?.title ?? "Unknown event"}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Clock className="h-4 w-4" />
													<span>{presentation.duration} min</span>
												</div>
												<div className="flex items-center gap-1">
													<Users className="h-4 w-4" />
													<span>{presentation.targetAudience}</span>
												</div>
											</div>
										</div>
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
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-foreground/80 text-sm line-clamp-2">
										{presentation.description}
									</p>
									{presentation.status === "pending" && (
										<div className="mt-4 flex items-center gap-2">
											{presentation.adminApproved ? (
												<Badge
													variant="outline"
													className="text-green-400 border-green-400"
												>
													Admin Approved
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-yellow-400 border-yellow-400"
												>
													Awaiting Admin Approval
												</Badge>
											)}
										</div>
									)}
									{presentation.status === "approved" && isModerator && (
										<div className="mt-4 pt-4 border-t border-border">
											<RecordingUrlEditor
												presentationId={presentation._id}
												currentUrl={presentation.recordingUrl}
											/>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
