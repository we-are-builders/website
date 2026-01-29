import { SignedIn, SignedOut, SignInButton } from "@clerk/tanstack-react-start";
import { Mic2 } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { PresentationForm } from "./PresentationForm";

interface SubmitPresentationButtonProps {
	eventId: Id<"events">;
}

export function SubmitPresentationButton({
	eventId,
}: SubmitPresentationButtonProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<SignedOut>
				<SignInButton mode="modal">
					<Button variant="outline">
						<Mic2 className="mr-2 h-4 w-4" />
						Sign in to Submit a Presentation
					</Button>
				</SignInButton>
			</SignedOut>
			<SignedIn>
				<Dialog open={open} onOpenChange={setOpen}>
					<Button variant="outline" onClick={() => setOpen(true)}>
						<Mic2 className="mr-2 h-4 w-4" />
						Submit a Presentation
					</Button>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Submit a Presentation</DialogTitle>
							<DialogDescription>
								Share your knowledge with the community by submitting a talk for
								this event.
							</DialogDescription>
						</DialogHeader>
						<PresentationForm
							eventId={eventId}
							onSuccess={() => setOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</SignedIn>
		</>
	);
}
