import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { EventForm } from "../../../components/events/EventForm";
import { Button } from "../../../components/ui/button";

export const Route = createFileRoute("/dashboard/events/new")({
	component: NewEventPage,
});

function NewEventPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<NewEventContent />
			</SignedIn>
		</>
	);
}

function NewEventContent() {
	const navigate = useNavigate();
	const currentUser = useQuery(api.users.current);

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
						You need moderator or admin privileges to create events.
					</p>
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
					<h1 className="text-3xl font-bold text-foreground">
						Create New Event
					</h1>
					<p className="text-muted-foreground mt-1">
						Set up a new community event for members to attend
					</p>
				</div>

				<EventForm onSuccess={handleSuccess} />
			</div>
		</DashboardLayout>
	);
}
