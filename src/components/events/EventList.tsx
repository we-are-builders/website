import { useQuery } from "convex/react";
import { Calendar } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { EventCard } from "./EventCard";

interface EventListProps {
  status?: "upcoming" | "ongoing" | "past" | "cancelled";
}

export function EventList({ status }: EventListProps) {
  const events = useQuery(api.events.list, { status });

  if (events === undefined) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No events found</h3>
        <p className="text-muted-foreground">
          {status === "upcoming"
            ? "Check back later for upcoming events."
            : "No events in this category."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}
