import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users, Video } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";

type Event = Doc<"events"> & {
	attendeeCount?: number;
	presentationCount?: number;
	imageUrl?: string | null;
};

interface EventCardProps {
	event: Event;
}

export function EventCard({ event }: EventCardProps) {
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

	return (
		<Card className="hover:shadow-lg transition-shadow overflow-hidden">
			{/* Event Image or Placeholder */}
			<div className="relative aspect-video">
				{event.imageUrl ? (
					<img
						src={event.imageUrl}
						alt={event.title}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
						<Calendar className="h-12 w-12 text-primary/40" />
					</div>
				)}
				<Badge
					variant={event.status === "upcoming" ? "default" : "secondary"}
					className={`absolute top-3 right-3 ${
						event.status === "ongoing"
							? "bg-green-500 text-white hover:bg-green-600"
							: ""
					}`}
				>
					{event.status}
				</Badge>
			</div>
			<CardHeader>
				<div className="space-y-1">
					<CardTitle className="text-xl">{event.title}</CardTitle>
					<CardDescription className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						{formattedDate} at {formattedTime}
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<p className="text-muted-foreground line-clamp-2">
					{event.description}
				</p>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					{event.isVirtual ? (
						<Video className="h-4 w-4" />
					) : (
						<MapPin className="h-4 w-4" />
					)}
					<span>{event.location}</span>
				</div>
				{event.attendeeCount !== undefined && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Users className="h-4 w-4" />
						<span>{event.attendeeCount} attendees</span>
					</div>
				)}
			</CardContent>
			<CardFooter>
				<Link to="/events/$eventId" params={{ eventId: event._id }}>
					<Button variant="outline">View Details</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
