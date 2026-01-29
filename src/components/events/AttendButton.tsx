import { SignedIn, SignedOut, SignInButton } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "convex/react";
import { Check, UserPlus } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";

interface AttendButtonProps {
	eventId: Id<"events">;
}

export function AttendButton({ eventId }: AttendButtonProps) {
	const isAttending = useQuery(api.attendees.isAttending, { eventId });
	const register = useMutation(api.attendees.register);
	const unregister = useMutation(api.attendees.unregister);

	const handleToggle = async () => {
		if (isAttending) {
			await unregister({ eventId });
		} else {
			await register({ eventId });
		}
	};

	return (
		<>
			<SignedOut>
				<SignInButton mode="modal">
					<Button>
						<UserPlus className="mr-2 h-4 w-4" />
						Sign in to Attend
					</Button>
				</SignInButton>
			</SignedOut>
			<SignedIn>
				{isAttending === undefined ? (
					<Button disabled>Loading...</Button>
				) : isAttending ? (
					<Button variant="outline" onClick={handleToggle}>
						<Check className="mr-2 h-4 w-4" />
						Attending
					</Button>
				) : (
					<Button onClick={handleToggle}>
						<UserPlus className="mr-2 h-4 w-4" />
						Attend Event
					</Button>
				)}
			</SignedIn>
		</>
	);
}
