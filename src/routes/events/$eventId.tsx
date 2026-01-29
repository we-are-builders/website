import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowLeft,
	Calendar,
	Clock,
	MapPin,
	Mic2,
	Users,
	Video,
	Vote,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AttendButton } from "../../components/events/AttendButton";
import { EventChat } from "../../components/events/EventChat";
import { VotingDeadlineDisplay } from "../../components/events/VotingDeadlineDisplay";
import { EventLocationMap } from "../../components/maps/EventLocationMap";
import { PresentationCard } from "../../components/presentations/PresentationCard";
import { SubmitPresentationButton } from "../../components/presentations/SubmitPresentationButton";
import { VideoEmbed } from "../../components/presentations/VideoEmbed";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export const Route = createFileRoute("/events/$eventId")({
	component: EventDetailPage,
});

function EventDetailPage() {
	const { eventId } = Route.useParams();
	const event = useQuery(api.events.getById, {
		eventId: eventId as Id<"events">,
	});
	const attendees = useQuery(api.attendees.listByEvent, {
		eventId: eventId as Id<"events">,
	});
	const presentations = useQuery(api.presentations.listApprovedByEvent, {
		eventId: eventId as Id<"events">,
	});
	const pendingPresentations = useQuery(api.presentations.listPendingByEvent, {
		eventId: eventId as Id<"events">,
	});
	const isAttending = useQuery(api.attendees.isAttending, {
		eventId: eventId as Id<"events">,
	});

	if (event === undefined) {
		return (
			<div className="min-h-screen bg-background">
				<div className="max-w-4xl mx-auto px-6 py-12">
					<Skeleton className="h-8 w-48 mb-8" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		);
	}

	if (event === null) {
		return (
			<div className="min-h-screen bg-background">
				<div className="max-w-4xl mx-auto px-6 py-12 text-center">
					<h1 className="text-2xl font-bold text-foreground mb-4">
						Event Not Found
					</h1>
					<p className="text-muted-foreground mb-8">
						The event you're looking for doesn't exist.
					</p>
					<Link to="/events">
						<Button>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Events
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const eventDate = new Date(event.date);
	const formattedDate = eventDate.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const formattedTime = eventDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

	const endDate = event.endDate ? new Date(event.endDate) : null;
	const formattedEndTime = endDate
		? endDate.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			})
		: null;
	const formattedEndDate = endDate
		? endDate.toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: null;

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-4xl mx-auto px-6 py-12">
				{/* Back Button */}
				<Link to="/events" className="inline-block mb-8">
					<Button
						variant="ghost"
						className="text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Events
					</Button>
				</Link>

				{/* Hero Image */}
				{event.imageUrl && (
					<div className="mb-8">
						<img
							src={event.imageUrl}
							alt={event.title}
							className="w-full aspect-video object-cover rounded-lg"
						/>
					</div>
				)}

				{/* Event Header */}
				<div className="mb-8">
					<div className="flex items-start justify-between mb-4">
						<h1 className="text-4xl font-bold text-foreground">
							{event.title}
						</h1>
						<Badge
							variant={event.status === "upcoming" ? "default" : "secondary"}
							className={`text-sm ${event.status === "ongoing" ? "bg-green-500 text-white hover:bg-green-600" : ""}`}
						>
							{event.status}
						</Badge>
					</div>

					<div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							<span>{formattedDate}</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-5 w-5" />
							<span>
								{formattedTime}
								{formattedEndTime && ` - ${formattedEndTime}`}
								{formattedEndDate &&
									formattedEndDate !== formattedDate &&
									` (${formattedEndDate})`}
							</span>
						</div>
						<div className="flex items-center gap-2">
							{event.isVirtual ? (
								<Video className="h-5 w-5" />
							) : (
								<MapPin className="h-5 w-5" />
							)}
							<span>{event.location}</span>
						</div>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							<span>{event.attendeeCount} attendees</span>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<AttendButton eventId={eventId as Id<"events">} />
						{event.status === "upcoming" && (
							<SubmitPresentationButton eventId={eventId as Id<"events">} />
						)}
					</div>
				</div>

				{/* Event Description */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>About This Event</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-foreground/80 whitespace-pre-wrap">
							{event.description}
						</p>
					</CardContent>
				</Card>

				{/* Event Location Map (physical events only) */}
				{!event.isVirtual && event.latitude && event.longitude && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								Location
							</CardTitle>
						</CardHeader>
						<CardContent>
							<EventLocationMap
								latitude={event.latitude}
								longitude={event.longitude}
								address={event.formattedAddress ?? event.location}
								placeId={event.placeId}
							/>
						</CardContent>
					</Card>
				)}

				{/* Vote on Presentations */}
				{event.status === "upcoming" &&
					pendingPresentations !== undefined &&
					pendingPresentations.length > 0 && (
						<Card className="mb-8">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<Vote className="h-5 w-5" />
										Vote on Presentations
									</CardTitle>
									{event.votingDeadline && (
										<VotingDeadlineDisplay deadline={event.votingDeadline} />
									)}
								</div>
								{!isAttending && (
									<p className="text-sm text-muted-foreground mt-2">
										Attend this event to vote on which presentations should be
										featured.
									</p>
								)}
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{pendingPresentations.map((presentation) => (
										<PresentationCard
											key={presentation._id}
											presentation={presentation}
											showVoting={true}
											votingClosed={
												event.votingDeadline
													? Date.now() > event.votingDeadline
													: false
											}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					)}

				{/* Approved Presentations */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mic2 className="h-5 w-5" />
							Approved Presentations
						</CardTitle>
					</CardHeader>
					<CardContent>
						{presentations === undefined ? (
							<div className="space-y-4">
								{[...Array(2)].map((_, i) => (
									<Skeleton key={i} className="h-24 w-full" />
								))}
							</div>
						) : presentations.length === 0 ? (
							<p className="text-muted-foreground text-center py-8">
								No presentations scheduled yet.
							</p>
						) : (
							<div className="space-y-4">
								{presentations.map((presentation) => (
									<div
										key={presentation._id}
										className="p-4 bg-accent rounded-lg"
									>
										<h4 className="font-semibold text-foreground mb-1">
											{presentation.title}
										</h4>
										<p className="text-sm text-muted-foreground mb-2">
											by {presentation.speakerName} · {presentation.duration}{" "}
											min
										</p>
										<p className="text-foreground/80 text-sm line-clamp-2">
											{presentation.description}
										</p>
										<div className="mt-2">
											<Badge variant="outline" className="text-xs">
												{presentation.targetAudience}
											</Badge>
										</div>

										{/* Video Recording Embed */}
										{presentation.recordingUrl && (
											<div className="pt-4 mt-4 border-t border-border">
												<p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
													<Video className="h-4 w-4" />
													Recording
												</p>
												<VideoEmbed
													url={presentation.recordingUrl}
													title={presentation.title}
												/>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Attendees */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Attendees ({attendees?.length ?? 0})
						</CardTitle>
					</CardHeader>
					<CardContent>
						{attendees === undefined ? (
							<div className="flex gap-2">
								{[...Array(5)].map((_, i) => (
									<Skeleton key={i} className="h-10 w-10 rounded-full" />
								))}
							</div>
						) : attendees.length === 0 ? (
							<p className="text-muted-foreground text-center py-4">
								No attendees yet. Be the first to register!
							</p>
						) : (
							<div className="flex flex-wrap gap-3">
								{attendees.map((attendee) => (
									<div
										key={attendee._id}
										className="flex items-center gap-2 bg-accent rounded-full px-3 py-1"
									>
										{attendee.user?.imageUrl ? (
											<img
												src={attendee.user.imageUrl}
												alt={attendee.user.name}
												className="h-6 w-6 rounded-full"
											/>
										) : (
											<div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs text-foreground">
												{attendee.user?.name?.charAt(0) ?? "?"}
											</div>
										)}
										<span className="text-sm text-foreground/80">
											{attendee.user?.name ?? "Unknown"}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Event Chat */}
				<EventChat
					eventId={eventId as Id<"events">}
					eventDate={event.date}
					eventStatus={event.status}
				/>
			</div>
		</div>
	);
}
