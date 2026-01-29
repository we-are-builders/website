import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { EventForm } from "../../../components/events/EventForm";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";

export const Route = createFileRoute("/dashboard/events/$eventId/edit")({
	component: EditEventPage,
});

function EditEventPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<EditEventContent />
			</SignedIn>
		</>
	);
}

function EditEventContent() {
	const navigate = useNavigate();
	const { eventId } = Route.useParams();
	const currentUser = useQuery(api.users.current);
	const event = useQuery(api.events.getById, {
		eventId: eventId as Id<"events">,
	});

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
						You need moderator or admin privileges to edit events.
					</p>
				</div>
			</DashboardLayout>
		);
	}

	if (event === undefined) {
		return (
			<DashboardLayout>
				<div className="space-y-6 max-w-2xl">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-96" />
				</div>
			</DashboardLayout>
		);
	}

	if (event === null) {
		return (
			<DashboardLayout>
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold text-foreground mb-4">
						Event Not Found
					</h1>
					<p className="text-muted-foreground mb-4">
						The event you're looking for doesn't exist.
					</p>
					<Button onClick={() => navigate({ to: "/dashboard/events" })}>
						Back to Events
					</Button>
				</div>
			</DashboardLayout>
		);
	}

	const handleSuccess = () => {
		navigate({ to: "/dashboard/events" });
	};

	return (
		<DashboardLayout>
			<div className="space-y-6 max-w-2xl">
				<div>
					<Button
						variant="ghost"
						className="text-muted-foreground hover:text-foreground mb-4"
						onClick={() => navigate({ to: "/dashboard/events" })}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Events
					</Button>
					<h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
					<p className="text-muted-foreground mt-1">Update the event details</p>
				</div>

				<EventForm event={event} onSuccess={handleSuccess} />
			</div>
		</DashboardLayout>
	);
}
