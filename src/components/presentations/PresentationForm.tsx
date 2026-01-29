import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface PresentationFormProps {
	eventId?: Id<"events">;
	onSuccess?: () => void;
}

export function PresentationForm({
	eventId,
	onSuccess,
}: PresentationFormProps) {
	const [selectedEventId, setSelectedEventId] = useState<string>(eventId ?? "");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [speakerName, setSpeakerName] = useState("");
	const [speakerBio, setSpeakerBio] = useState("");
	const [duration, setDuration] = useState("30");
	const [targetAudience, setTargetAudience] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const upcomingEvents = useQuery(api.events.listUpcoming);
	const submit = useMutation(api.presentations.submit);

	const handleSubmit = async (e: React.ChangeEvent) => {
		e.preventDefault();
		setError(null);

		if (!selectedEventId) {
			setError("Please select an event");
			return;
		}

		setIsSubmitting(true);

		try {
			await submit({
				eventId: selectedEventId as Id<"events">,
				title,
				description,
				speakerName,
				speakerBio: speakerBio || undefined,
				duration: parseInt(duration, 10),
				targetAudience,
			});

			// Reset form
			setTitle("");
			setDescription("");
			setSpeakerName("");
			setSpeakerBio("");
			setDuration("30");
			setTargetAudience("");

			onSuccess?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Submit a Presentation</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{!eventId && (
						<div className="space-y-2">
							<Label htmlFor="event">Event</Label>
							<Select
								value={selectedEventId}
								onValueChange={setSelectedEventId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select an event" />
								</SelectTrigger>
								<SelectContent>
									{upcomingEvents?.map((event) => (
										<SelectItem key={event._id} value={event._id}>
											{event.title} -{" "}
											{new Date(event.date).toLocaleDateString()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="title">Presentation Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter your presentation title"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe what your presentation will cover"
							rows={4}
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="speakerName">Speaker Name</Label>
							<Input
								id="speakerName"
								value={speakerName}
								onChange={(e) => setSpeakerName(e.target.value)}
								placeholder="Your name"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="duration">Duration (minutes)</Label>
							<Select value={duration} onValueChange={setDuration}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="15">15 minutes</SelectItem>
									<SelectItem value="30">30 minutes</SelectItem>
									<SelectItem value="45">45 minutes</SelectItem>
									<SelectItem value="60">60 minutes</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="speakerBio">Speaker Bio (optional)</Label>
						<Textarea
							id="speakerBio"
							value={speakerBio}
							onChange={(e) => setSpeakerBio(e.target.value)}
							placeholder="A brief bio about yourself"
							rows={2}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="targetAudience">Target Audience</Label>
						<Input
							id="targetAudience"
							value={targetAudience}
							onChange={(e) => setTargetAudience(e.target.value)}
							placeholder="e.g., Beginners, Intermediate developers, etc."
							required
						/>
					</div>

					{error && (
						<div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
							{error}
						</div>
					)}

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? "Submitting..." : "Submit Presentation"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
