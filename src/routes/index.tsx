import { SignedOut, SignInButton } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Calendar, Mic2, Sparkles, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { EventCard } from "../components/events/EventCard";
import { Button } from "../components/ui/button";
import { LetterGlitch } from "../components/ui/letter-glitch";
import { Skeleton } from "../components/ui/skeleton";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const upcomingEvents = useQuery(api.events.listUpcoming);

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section with Letter Glitch Background */}
			<section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
				<div className="absolute inset-0">
					<LetterGlitch
						glitchColors={["#6366f1", "#8b5cf6", "#a855f7"]}
						glitchSpeed={50}
						centerVignette={false}
						outerVignette={true}
						smooth={true}
					/>
				</div>
				<div className="relative z-10 text-center px-6 max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl py-12">
					<div className="inline-flex items-center gap-2 bg-black/5 border border-black/10 rounded-full px-4 py-2 mb-6">
						<Sparkles className="w-4 h-4 text-purple-600" />
						<span className="text-sm text-black/80">
							Portugal's Developer Community
						</span>
					</div>
					<h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black mb-6 tracking-tight">
						We Are Builders
					</h1>
					<p className="text-xl md:text-2xl text-black/70 mb-8 font-light max-w-2xl mx-auto">
						A community of passionate developers building the future together
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link to="/events">
							<Button
								size="lg"
								className="bg-black text-white hover:bg-black/90 font-semibold px-8"
							>
								Explore Events
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<SignedOut>
							<SignInButton mode="modal">
								<Button
									size="lg"
									variant="outline"
									className="border-black/30 text-black hover:bg-black/5 backdrop-blur-sm"
								>
									Join Community
								</Button>
							</SignInButton>
						</SignedOut>
					</div>
				</div>
			</section>

			{/* Upcoming Events Section - Now Central */}
			<section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
							Upcoming Events
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Join our next meetups and connect with fellow builders
						</p>
					</div>

					{upcomingEvents === undefined ? (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
								<div key={key} className="space-y-3">
									<Skeleton className="h-64 w-full rounded-2xl" />
								</div>
							))}
						</div>
					) : upcomingEvents.length === 0 ? (
						<div className="text-center py-16 bg-card rounded-2xl border border-border/50 shadow-lg">
							<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
								<Calendar className="h-8 w-8 text-primary" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								No upcoming events
							</h3>
							<p className="text-muted-foreground mb-6">
								Check back later for new events or browse our past events.
							</p>
							<Link to="/events">
								<Button variant="outline">View All Events</Button>
							</Link>
						</div>
					) : (
						<>
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{upcomingEvents.slice(0, 6).map((event) => (
									<EventCard key={event._id} event={event} />
								))}
							</div>
							{upcomingEvents.length > 0 && (
								<div className="text-center mt-12">
									<Link to="/events">
										<Button size="lg" variant="outline" className="px-8">
											View All Events
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									</Link>
								</div>
							)}
						</>
					)}
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 px-6 bg-muted/30">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Why Join Us?
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Be part of a thriving developer community
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="group bg-card hover:bg-card/80 border border-border/50 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1">
							<div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
								<Calendar className="w-7 h-7 text-primary" />
							</div>
							<h3 className="text-xl font-semibold text-card-foreground mb-3">
								Community Events
							</h3>
							<p className="text-muted-foreground">
								Regular meetups and events to learn, share knowledge, and
								network with fellow developers
							</p>
						</div>
						<div className="group bg-card hover:bg-card/80 border border-border/50 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1">
							<div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
								<Mic2 className="w-7 h-7 text-primary" />
							</div>
							<h3 className="text-xl font-semibold text-card-foreground mb-3">
								Present Your Ideas
							</h3>
							<p className="text-muted-foreground">
								Submit your presentations and get community approval to share
								your knowledge on stage
							</p>
						</div>
						<div className="group bg-card hover:bg-card/80 border border-border/50 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1">
							<div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
								<Users className="w-7 h-7 text-primary" />
							</div>
							<h3 className="text-xl font-semibold text-card-foreground mb-3">
								Community Voting
							</h3>
							<p className="text-muted-foreground">
								Vote on presentations to help curate the best content for our
								events
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
						Ready to Build Together?
					</h2>
					<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
						Join our community of builders and be part of the next big thing in
						Portugal's tech scene.
					</p>
					<Link to="/events">
						<Button size="lg" className="px-8">
							Get Started
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>
			</section>
		</div>
	);
}
