import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Calendar, CheckCircle, Clock, Mic2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "../../components/DashboardLayout";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<DashboardContent />
			</SignedIn>
		</>
	);
}

function DashboardContent() {
	const currentUser = useQuery(api.users.current);
	const myPresentations = useQuery(api.presentations.listMine);
	const myEvents = useQuery(api.attendees.myEvents);

	if (currentUser === undefined) {
		return (
			<DashboardLayout>
				<div className="space-y-6">
					<Skeleton className="h-8 w-48" />
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className="h-32" />
						))}
					</div>
				</div>
			</DashboardLayout>
		);
	}

	const pendingPresentations =
		myPresentations?.filter((p) => p.status === "pending").length ?? 0;
	const approvedPresentations =
		myPresentations?.filter((p) => p.status === "approved").length ?? 0;
	const upcomingEvents =
		myEvents?.filter((e) => e?.status === "upcoming").length ?? 0;

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Welcome back, {currentUser?.name?.split(" ")[0]}!
					</h1>
					<p className="text-muted-foreground mt-1">
						Here's an overview of your activity.
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Events Attending
							</CardTitle>
							<Calendar className="h-4 w-4 text-primary" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{upcomingEvents}
							</div>
							<p className="text-xs text-muted-foreground">upcoming events</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								My Presentations
							</CardTitle>
							<Mic2 className="h-4 w-4 text-primary" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{myPresentations?.length ?? 0}
							</div>
							<p className="text-xs text-muted-foreground">total submitted</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pending Approval
							</CardTitle>
							<Clock className="h-4 w-4 text-yellow-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{pendingPresentations}
							</div>
							<p className="text-xs text-muted-foreground">awaiting votes</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Approved
							</CardTitle>
							<CheckCircle className="h-4 w-4 text-green-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{approvedPresentations}
							</div>
							<p className="text-xs text-muted-foreground">
								presentations approved
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Recent Activity */}
				<div className="grid gap-6 lg:grid-cols-2">
					{/* My Upcoming Events */}
					<Card>
						<CardHeader>
							<CardTitle>My Upcoming Events</CardTitle>
						</CardHeader>
						<CardContent>
							{myEvents === undefined ? (
								<div className="space-y-3">
									{[...Array(3)].map((_, i) => (
										<Skeleton key={i} className="h-12" />
									))}
								</div>
							) : myEvents.filter((e) => e?.status === "upcoming").length ===
								0 ? (
								<p className="text-muted-foreground text-center py-4">
									You're not attending any upcoming events yet.
								</p>
							) : (
								<div className="space-y-3">
									{myEvents
										.filter((e) => e?.status === "upcoming")
										.slice(0, 5)
										.map(
											(event) =>
												event && (
													<div
														key={event._id}
														className="flex items-center justify-between p-3 bg-accent rounded-lg"
													>
														<div>
															<p className="font-medium text-foreground">
																{event.title}
															</p>
															<p className="text-sm text-muted-foreground">
																{new Date(event.date).toLocaleDateString()}
															</p>
														</div>
													</div>
												),
										)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* My Recent Presentations */}
					<Card>
						<CardHeader>
							<CardTitle>My Recent Presentations</CardTitle>
						</CardHeader>
						<CardContent>
							{myPresentations === undefined ? (
								<div className="space-y-3">
									{[...Array(3)].map((_, i) => (
										<Skeleton key={i} className="h-12" />
									))}
								</div>
							) : myPresentations.length === 0 ? (
								<p className="text-muted-foreground text-center py-4">
									You haven't submitted any presentations yet.
								</p>
							) : (
								<div className="space-y-3">
									{myPresentations.slice(0, 5).map((presentation) => (
										<div
											key={presentation._id}
											className="flex items-center justify-between p-3 bg-accent rounded-lg"
										>
											<div>
												<p className="font-medium text-foreground">
													{presentation.title}
												</p>
												<p className="text-sm text-muted-foreground">
													{presentation.event?.title ?? "Unknown event"}
												</p>
											</div>
											<span
												className={`text-xs px-2 py-1 rounded-full ${
													presentation.status === "approved"
														? "bg-green-500/20 text-green-400"
														: presentation.status === "rejected"
															? "bg-red-500/20 text-red-400"
															: "bg-yellow-500/20 text-yellow-400"
												}`}
											>
												{presentation.status}
											</span>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardLayout>
	);
}
