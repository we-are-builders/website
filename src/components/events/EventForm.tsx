import { useMutation } from "convex/react";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
	AddressAutocomplete,
	type PlaceResult,
} from "../maps/AddressAutocomplete";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface EventFormProps {
	event?: Doc<"events"> & { imageUrl?: string | null };
	onSuccess?: () => void;
}

export function EventForm({ event, onSuccess }: EventFormProps) {
	const [title, setTitle] = useState(event?.title ?? "");
	const [description, setDescription] = useState(event?.description ?? "");
	const [date, setDate] = useState(
		event?.date ? new Date(event.date).toISOString().slice(0, 16) : "",
	);
	const [endDate, setEndDate] = useState(
		event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
	);
	const [location, setLocation] = useState(event?.location ?? "");
	const [isVirtual, setIsVirtual] = useState(event?.isVirtual ?? false);
	const [placeData, setPlaceData] = useState<PlaceResult | null>(
		event?.latitude && event?.longitude && event?.placeId
			? {
					address: event.location,
					latitude: event.latitude,
					longitude: event.longitude,
					placeId: event.placeId,
					formattedAddress: event.formattedAddress ?? event.location,
				}
			: null,
	);
	const [votingDeadline, setVotingDeadline] = useState(
		event?.votingDeadline
			? new Date(event.votingDeadline).toISOString().slice(0, 16)
			: "",
	);
	const [imageId, setImageId] = useState<Id<"_storage"> | undefined>(
		event?.imageId,
	);
	const [imagePreview, setImagePreview] = useState<string | null>(
		event?.imageUrl ?? null,
	);
	const [isUploading, setIsUploading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const create = useMutation(api.events.create);
	const update = useMutation(api.events.update);
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > MAX_IMAGE_SIZE) {
			setError("Image must be less than 5MB");
			return;
		}

		setError(null);
		setIsUploading(true);

		try {
			const uploadUrl = await generateUploadUrl();
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const { storageId } = await result.json();
			setImageId(storageId);
			setImagePreview(URL.createObjectURL(file));
		} catch (err) {
			setError("Failed to upload image");
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemoveImage = () => {
		setImageId(undefined);
		setImagePreview(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!date) {
			setError("Please select a start date and time");
			return;
		}

		const startTimestamp = new Date(date).getTime();
		const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;

		// Validate end date is after start date
		if (endTimestamp !== undefined && endTimestamp <= startTimestamp) {
			setError("End date must be after start date");
			return;
		}

		setIsSubmitting(true);

		try {
			const votingDeadlineTimestamp = votingDeadline
				? new Date(votingDeadline).getTime()
				: undefined;

			const eventData = {
				title,
				description,
				date: startTimestamp,
				endDate: endTimestamp,
				location,
				isVirtual,
				imageId,
				votingDeadline: votingDeadlineTimestamp,
				// Include location coordinates for physical events
				...(placeData && !isVirtual
					? {
							latitude: placeData.latitude,
							longitude: placeData.longitude,
							placeId: placeData.placeId,
							formattedAddress: placeData.formattedAddress,
						}
					: {}),
			};

			if (event) {
				await update({
					eventId: event._id,
					...eventData,
				});
			} else {
				await create(eventData);
			}

			onSuccess?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save event");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{event ? "Edit Event" : "Create New Event"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Event Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter event title"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe what the event is about"
							rows={4}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="date">Start Date & Time</Label>
						<Input
							id="date"
							type="datetime-local"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="endDate">End Date & Time (Optional)</Label>
						<Input
							id="endDate"
							type="datetime-local"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							min={date}
						/>
						<p className="text-xs text-muted-foreground">
							If set, enables automatic "ongoing" status during the event
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="votingDeadline">Voting Deadline (Optional)</Label>
						<Input
							id="votingDeadline"
							type="datetime-local"
							value={votingDeadline}
							onChange={(e) => setVotingDeadline(e.target.value)}
							max={date}
						/>
						<p className="text-xs text-muted-foreground">
							When voting on presentations closes. Defaults to 24 hours before
							the event starts.
						</p>
						{date && !votingDeadline && (
							<button
								type="button"
								onClick={() => {
									const eventStart = new Date(date);
									const defaultDeadline = new Date(
										eventStart.getTime() - 24 * 60 * 60 * 1000,
									);
									setVotingDeadline(defaultDeadline.toISOString().slice(0, 16));
								}}
								className="text-xs text-primary hover:underline"
							>
								Set to 24 hours before event
							</button>
						)}
					</div>

					<div className="flex items-center justify-between">
						<Label htmlFor="isVirtual">Virtual Event</Label>
						<Switch
							id="isVirtual"
							checked={isVirtual}
							onCheckedChange={setIsVirtual}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="location">
							{isVirtual ? "Meeting Link" : "Location"}
						</Label>
						{isVirtual ? (
							<Input
								id="location"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="https://meet.google.com/..."
								required
							/>
						) : (
							<AddressAutocomplete
								value={location}
								onChange={setLocation}
								onPlaceSelect={(place) => {
									setPlaceData(place);
								}}
								placeholder="Enter venue address"
							/>
						)}
					</div>

					{/* Event Image Upload */}
					<div className="space-y-2">
						<Label>Event Image (Optional)</Label>
						{imagePreview ? (
							<div className="relative">
								<img
									src={imagePreview}
									alt="Event preview"
									className="w-full aspect-video object-cover rounded-lg"
								/>
								<Button
									type="button"
									variant="destructive"
									size="icon"
									className="absolute top-2 right-2"
									onClick={handleRemoveImage}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						) : (
							<label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
								<div className="flex flex-col items-center justify-center py-6">
									<ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
									<p className="text-sm text-muted-foreground">
										{isUploading
											? "Uploading..."
											: "Click to upload an image (max 5MB)"}
									</p>
								</div>
								<input
									type="file"
									className="hidden"
									accept="image/*"
									onChange={handleImageUpload}
									disabled={isUploading}
								/>
							</label>
						)}
					</div>

					{error && (
						<div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
							{error}
						</div>
					)}

					<Button
						type="submit"
						disabled={isSubmitting || isUploading}
						className="w-full"
					>
						{isSubmitting
							? "Saving..."
							: event
								? "Update Event"
								: "Create Event"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
