import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Calendar, Mic2, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { EventCard } from "../components/events/EventCard";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const upcomingEvents = useQuery(api.events.listUpcoming);

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
				<div className="relative max-w-5xl mx-auto">
					<h1 className="text-5xl md:text-7xl font-black text-foreground mb-6">
						<span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
							We Are Builders
						</span>
						<span> 🇵🇹</span>
					</h1>
					<p className="text-xl md:text-2xl text-foreground/80 mb-4 font-light">
						A community of passionate developers building the future together
					</p>
					<p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
						Join our events, share your knowledge through presentations, and
						connect with fellow builders.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link to="/events">
							<Button size="lg">
								View All Events
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
					<div className="bg-card border border-border rounded-xl p-6 text-center">
						<Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-card-foreground mb-2">
							Community Events
						</h3>
						<p className="text-muted-foreground">
							Regular meetups and events to learn and share knowledge
						</p>
					</div>
					<div className="bg-card border border-border rounded-xl p-6 text-center">
						<Mic2 className="w-12 h-12 text-primary mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-card-foreground mb-2">
							Present Your Ideas
						</h3>
						<p className="text-muted-foreground">
							Submit presentations and get community approval to speak
						</p>
					</div>
					<div className="bg-card border border-border rounded-xl p-6 text-center">
						<Users className="w-12 h-12 text-primary mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-card-foreground mb-2">
							Community Voting
						</h3>
						<p className="text-muted-foreground">
							Vote on presentations to help curate the best content
						</p>
					</div>
				</div>
			</section>

			{/* Upcoming Events Section */}
			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-bold text-foreground">
						Upcoming Events
					</h2>
					<Link to="/events">
						<Button variant="ghost">
							View All
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>

				{upcomingEvents === undefined ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="h-48 w-full" />
							</div>
						))}
					</div>
				) : upcomingEvents.length === 0 ? (
					<div className="text-center py-12 bg-card rounded-xl border border-border">
						<Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 className="mt-4 text-lg font-semibold text-foreground">
							No upcoming events
						</h3>
						<p className="text-muted-foreground">
							Check back later for new events.
						</p>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{upcomingEvents.slice(0, 6).map((event) => (
							<EventCard key={event._id} event={event} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}
