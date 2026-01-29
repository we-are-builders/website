import { createFileRoute } from "@tanstack/react-router";
import { EventList } from "../../components/events/EventList";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../components/ui/tabs";

export const Route = createFileRoute("/events/")({ component: EventsPage });

function EventsPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-7xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold text-foreground mb-8">Events</h1>

				<Tabs defaultValue="upcoming" className="w-full">
					<TabsList className="mb-8">
						<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="past">Past</TabsTrigger>
					</TabsList>
					<TabsContent value="upcoming">
						<EventList status="upcoming" />
					</TabsContent>
					<TabsContent value="past">
						<EventList status="past" />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
