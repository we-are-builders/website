import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Calendar,
	Edit,
	MapPin,
	Plus,
	Trash2,
	Users,
	Video,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "../../../components/DashboardLayout";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../../components/ui/tabs";

export const Route = createFileRoute("/dashboard/events/")({
	component: ManageEventsPage,
});

function ManageEventsPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<ManageEventsContent />
			</SignedIn>
		</>
	);
}

function ManageEventsContent() {
	const currentUser = useQuery(api.users.current);
	const events = useQuery(api.events.list, {});
	const removeEvent = useMutation(api.events.remove);
	const updateStatus = useMutation(api.events.updateStatus);

	const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(
		null,
	);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const isModerator =
		currentUser?.role === "moderator" || currentUser?.role === "admin";

	if (!isModerator) {
		return (
			<DashboardLayout>
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold text-foreground mb-4">
						Access Denied
					</h1>
					<p className="text-muted-foreground">
						You need moderator or admin privileges to manage events.
					</p>
				</div>
			</DashboardLayout>
		);
	}

	const handleDelete = async () => {
		if (selectedEventId) {
			await removeEvent({ eventId: selectedEventId });
			setShowDeleteDialog(false);
			setSelectedEventId(null);
		}
	};

	const handleStatusChange = async (
		eventId: Id<"events">,
		status: "upcoming" | "past" | "cancelled",
	) => {
		await updateStatus({ eventId, status });
	};

	const upcomingEvents = events?.filter((e) => e.status === "upcoming") ?? [];
	const pastEvents = events?.filter((e) => e.status === "past") ?? [];
	const cancelledEvents = events?.filter((e) => e.status === "cancelled") ?? [];

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							Manage Events
						</h1>
						<p className="text-muted-foreground mt-1">
							Create and manage community events
						</p>
					</div>
					<Link to="/dashboard/events/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Event
						</Button>
					</Link>
				</div>

				{events === undefined ? (
					<div className="space-y-4">
						{["s-1", "s-2", "s-3"].map((key) => (
							<Skeleton key={key} className="h-32" />
						))}
					</div>
				) : (
					<Tabs defaultValue="upcoming" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="upcoming">
								Upcoming ({upcomingEvents.length})
							</TabsTrigger>
							<TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
							<TabsTrigger value="cancelled">
								Cancelled ({cancelledEvents.length})
							</TabsTrigger>
						</TabsList>

						<TabsContent value="upcoming">
							<EventsList
								events={upcomingEvents}
								onDelete={(id) => {
									setSelectedEventId(id);
									setShowDeleteDialog(true);
								}}
								onStatusChange={handleStatusChange}
								currentUser={currentUser}
							/>
						</TabsContent>

						<TabsContent value="past">
							<EventsList
								events={pastEvents}
								onDelete={(id) => {
									setSelectedEventId(id);
									setShowDeleteDialog(true);
								}}
								onStatusChange={handleStatusChange}
								currentUser={currentUser}
							/>
						</TabsContent>

						<TabsContent value="cancelled">
							<EventsList
								events={cancelledEvents}
								onDelete={(id) => {
									setSelectedEventId(id);
									setShowDeleteDialog(true);
								}}
								onStatusChange={handleStatusChange}
								currentUser={currentUser}
							/>
						</TabsContent>
					</Tabs>
				)}
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Event</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this event? This action cannot be
							undone. All presentations and votes associated with this event
							will also be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</DashboardLayout>
	);
}

interface EventsListProps {
	events: (Doc<"events"> & { imageUrl?: string | null })[];
	onDelete: (id: Id<"events">) => void;
	onStatusChange: (
		id: Id<"events">,
		status: "upcoming" | "past" | "cancelled",
	) => void;
	currentUser: Doc<"users"> | null | undefined;
}

function EventsList({
	events,
	onDelete,
	onStatusChange,
	currentUser,
}: EventsListProps) {
	const isAdmin = currentUser?.role === "admin";

	if (events.length === 0) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<p className="text-muted-foreground">No events in this category.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{events.map((event) => (
				<EventManageCard
					key={event._id}
					event={event}
					onDelete={onDelete}
					onStatusChange={onStatusChange}
					isAdmin={isAdmin}
				/>
			))}
		</div>
	);
}

interface EventManageCardProps {
	event: Doc<"events"> & { imageUrl?: string | null };
	onDelete: (id: Id<"events">) => void;
	onStatusChange: (
		id: Id<"events">,
		status: "upcoming" | "past" | "cancelled",
	) => void;
	isAdmin: boolean;
}

function EventManageCard({
	event,
	onDelete,
	onStatusChange,
	isAdmin,
}: EventManageCardProps) {
	const presentations = useQuery(api.presentations.listByEvent, {
		eventId: event._id,
	});
	const attendeeCount = useQuery(api.attendees.getCount, {
		eventId: event._id,
	});

	const pendingPresentations =
		presentations?.filter((p) => p.status === "pending") ?? [];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-lg">{event.title}</CardTitle>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Calendar className="h-4 w-4" />
								<span>{new Date(event.date).toLocaleDateString()}</span>
							</div>
							<div className="flex items-center gap-1">
								{event.isVirtual ? (
									<Video className="h-4 w-4" />
								) : (
									<MapPin className="h-4 w-4" />
								)}
								<span className="truncate max-w-[200px]">{event.location}</span>
							</div>
							<div className="flex items-center gap-1">
								<Users className="h-4 w-4" />
								<span>{attendeeCount ?? 0} attendees</span>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant={
								event.status === "upcoming"
									? "default"
									: event.status === "cancelled"
										? "destructive"
										: "secondary"
							}
						>
							{event.status}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-foreground/80 text-sm line-clamp-2">
					{event.description}
				</p>

				{/* Status Actions */}
				<div className="flex flex-wrap gap-2">
					{event.status !== "upcoming" && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onStatusChange(event._id, "upcoming")}
						>
							Mark Upcoming
						</Button>
					)}
					{event.status !== "past" && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onStatusChange(event._id, "past")}
						>
							Mark Past
						</Button>
					)}
					{event.status !== "cancelled" && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onStatusChange(event._id, "cancelled")}
						>
							Cancel Event
						</Button>
					)}
				</div>

				{/* Pending Presentations for Admin Review */}
				{isAdmin && pendingPresentations.length > 0 && (
					<div className="pt-4 border-t border-border">
						<h4 className="text-sm font-medium text-foreground mb-3">
							Pending Presentations ({pendingPresentations.length})
						</h4>
						<div className="space-y-3">
							{pendingPresentations.slice(0, 3).map((presentation) => (
								<PresentationReviewCard
									key={presentation._id}
									presentation={presentation}
								/>
							))}
							{pendingPresentations.length > 3 && (
								<p className="text-sm text-muted-foreground">
									+{pendingPresentations.length - 3} more presentations
								</p>
							)}
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<Link
						to="/dashboard/events/$eventId/edit"
						params={{ eventId: event._id }}
					>
						<Button variant="outline" size="sm">
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</Button>
					</Link>
					{isAdmin && (
						<Button
							variant="outline"
							size="sm"
							className="text-red-400 hover:text-red-300"
							onClick={() => onDelete(event._id)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function PresentationReviewCard({
	presentation,
}: {
	presentation: Doc<"presentations"> & { event: Doc<"events"> | null };
}) {
	const adminApprove = useMutation(api.presentations.adminApprove);
	const adminReject = useMutation(api.presentations.adminReject);

	return (
		<div className="p-3 bg-accent rounded-lg">
			<div className="flex items-start justify-between">
				<div>
					<p className="font-medium text-foreground text-sm">
						{presentation.title}
					</p>
					<p className="text-xs text-muted-foreground">
						by {presentation.speakerName}
					</p>
				</div>
				{!presentation.adminApproved && (
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-green-400 hover:text-green-300"
							onClick={() => adminApprove({ presentationId: presentation._id })}
						>
							Approve
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-red-400 hover:text-red-300"
							onClick={() => adminReject({ presentationId: presentation._id })}
						>
							Reject
						</Button>
					</div>
				)}
				{presentation.adminApproved && (
					<Badge variant="outline" className="text-green-400 border-green-400">
						Admin OK
					</Badge>
				)}
			</div>
		</div>
	);
}
