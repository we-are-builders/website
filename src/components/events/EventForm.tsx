import imageCompression from "browser-image-compression";
import { useMutation } from "convex/react";
import { ImagePlus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
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
import { ImageCropper } from "./ImageCropper";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface EventFormProps {
	event?: Doc<"events"> & { imageUrl?: string | null };
	onSuccess?: () => void;
}

export function EventForm({ event, onSuccess }: EventFormProps) {
	const [title, setTitle] = useState(event?.title ?? "");
	const [description, setDescription] = useState(event?.description ?? "");
	const [dateTBD, setDateTBD] = useState(event?.dateTBD ?? false);
	const [date, setDate] = useState(
		event?.date && !event?.dateTBD
			? new Date(event.date).toISOString().slice(0, 16)
			: "",
	);
	const [endDate, setEndDate] = useState(
		event?.endDate && !event?.dateTBD
			? new Date(event.endDate).toISOString().slice(0, 16)
			: "",
	);
	const [endTimeMode, setEndTimeMode] = useState<"duration" | "custom">(
		event?.endDate ? "custom" : "duration",
	);
	const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
	const [locationTBD, setLocationTBD] = useState(event?.locationTBD ?? false);
	const [location, setLocation] = useState(
		event?.location && !event?.locationTBD ? event.location : "",
	);
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
	const [votingDeadlineMode, setVotingDeadlineMode] = useState<
		"preset" | "custom"
	>(event?.votingDeadline ? "custom" : "preset");
	const [selectedVotingPreset, setSelectedVotingPreset] = useState<
		number | null
	>(null);
	const [imageId, setImageId] = useState<Id<"_storage"> | undefined>(
		event?.imageId,
	);
	const [imagePreview, setImagePreview] = useState<string | null>(
		event?.imageUrl ?? null,
	);
	const [isUploading, setIsUploading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cropModalOpen, setCropModalOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const formId = useId();
	const titleId = `${formId}-title`;
	const descriptionId = `${formId}-description`;
	const dateTBDId = `${formId}-dateTBD`;
	const dateId = `${formId}-date`;
	const endDateId = `${formId}-endDate`;
	const votingDeadlineId = `${formId}-votingDeadline`;
	const locationTBDId = `${formId}-locationTBD`;
	const isVirtualId = `${formId}-isVirtual`;
	const locationId = `${formId}-location`;

	const create = useMutation(api.events.create);
	const update = useMutation(api.events.update);
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > MAX_IMAGE_SIZE) {
			setError("Image must be less than 5MB");
			return;
		}

		setError(null);
		setSelectedFile(file);
		setCropModalOpen(true);

		// Reset input so the same file can be selected again
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleCropComplete = async (croppedBlob: Blob) => {
		setCropModalOpen(false);
		setSelectedFile(null);
		setIsUploading(true);

		try {
			// Convert blob to file for compression
			const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
				type: "image/jpeg",
			});

			// Compress image before upload
			const compressionOptions = {
				maxSizeMB: 0.8, // Max 800KB
				maxWidthOrHeight: 1920, // Max dimension
				useWebWorker: true, // Non-blocking compression
			};
			const compressedFile = await imageCompression(
				croppedFile,
				compressionOptions,
			);

			const uploadUrl = await generateUploadUrl();
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": compressedFile.type },
				body: compressedFile,
			});
			const { storageId } = await result.json();
			setImageId(storageId);
			setImagePreview(URL.createObjectURL(compressedFile));
		} catch (_err) {
			setError("Failed to upload image");
		} finally {
			setIsUploading(false);
		}
	};

	const handleCropCancel = () => {
		setCropModalOpen(false);
		setSelectedFile(null);
	};

	const handleRemoveImage = () => {
		setImageId(undefined);
		setImagePreview(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate date unless TBD
		if (!dateTBD && !date) {
			setError("Please select a start date and time");
			return;
		}

		// Validate location unless TBD or virtual
		if (!locationTBD && !isVirtual && !location) {
			setError("Please enter a location");
			return;
		}

		// Use placeholder date for TBD (far future - year 9999)
		const startTimestamp = dateTBD
			? new Date("9999-12-31T23:59:59").getTime()
			: new Date(date).getTime();
		let endTimestamp: number | undefined;
		if (dateTBD) {
			endTimestamp = undefined;
		} else if (endTimeMode === "duration" && selectedDuration !== null) {
			endTimestamp = new Date(date).getTime() + selectedDuration * 60 * 1000;
		} else if (endTimeMode === "custom" && endDate) {
			endTimestamp = new Date(endDate).getTime();
		} else {
			endTimestamp = undefined;
		}

		// Validate end date is after start date (only if not TBD)
		if (
			!dateTBD &&
			endTimestamp !== undefined &&
			endTimestamp <= startTimestamp
		) {
			setError("End date must be after start date");
			return;
		}

		setIsSubmitting(true);

		try {
			let votingDeadlineTimestamp: number | undefined;
			if (dateTBD) {
				votingDeadlineTimestamp = undefined;
			} else if (
				votingDeadlineMode === "preset" &&
				selectedVotingPreset !== null
			) {
				// Subtract hours from event start time
				votingDeadlineTimestamp =
					new Date(date).getTime() - selectedVotingPreset * 60 * 60 * 1000;
			} else if (votingDeadlineMode === "custom" && votingDeadline) {
				votingDeadlineTimestamp = new Date(votingDeadline).getTime();
			} else {
				votingDeadlineTimestamp = undefined;
			}

			const eventData = {
				title,
				description,
				date: startTimestamp,
				endDate: endTimestamp,
				dateTBD,
				location: locationTBD ? "TBD" : location,
				locationTBD,
				isVirtual,
				imageId,
				votingDeadline: votingDeadlineTimestamp,
				// Include location coordinates for physical events that are not TBD
				...(placeData && !isVirtual && !locationTBD
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
						<Label htmlFor={titleId}>Event Title</Label>
						<Input
							id={titleId}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter event title"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={descriptionId}>Description</Label>
						<Textarea
							id={descriptionId}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe what the event is about"
							rows={4}
							required
						/>
					</div>

					<div className="flex items-center justify-between">
						<Label htmlFor={dateTBDId}>Date & Time TBD</Label>
						<Switch
							id={dateTBDId}
							checked={dateTBD}
							onCheckedChange={setDateTBD}
						/>
					</div>

					{!dateTBD && (
						<>
							<div className="space-y-2">
								<Label htmlFor={dateId}>Start Date & Time</Label>
								<Input
									id={dateId}
									type="datetime-local"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label>Duration</Label>
								<div className="flex flex-wrap gap-2">
									{[
										{ label: "1h", value: 60 },
										{ label: "1.5h", value: 90 },
										{ label: "2h", value: 120 },
										{ label: "3h", value: 180 },
									].map((duration) => (
										<Button
											key={duration.value}
											type="button"
											variant={
												selectedDuration === duration.value &&
												endTimeMode === "duration"
													? "default"
													: "outline"
											}
											size="sm"
											onClick={() => {
												setEndTimeMode("duration");
												setSelectedDuration(duration.value);
												setEndDate("");
											}}
										>
											{duration.label}
										</Button>
									))}
									<Button
										type="button"
										variant={endTimeMode === "custom" ? "default" : "outline"}
										size="sm"
										onClick={() => {
											setEndTimeMode("custom");
											setSelectedDuration(null);
										}}
									>
										Set an end time...
									</Button>
								</div>
								{endTimeMode === "custom" && (
									<Input
										id={endDateId}
										type="datetime-local"
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
										min={date}
										className="mt-2"
									/>
								)}
								<p className="text-xs text-muted-foreground">
									If set, enables automatic "ongoing" status during the event
								</p>
							</div>

							<div className="space-y-2">
								<Label>Voting Deadline (Optional)</Label>
								<div className="flex flex-wrap gap-2">
									{[
										{ label: "12h", value: 12 },
										{ label: "1 day", value: 24 },
										{ label: "5 days", value: 24 * 5 },
										{ label: "1 week", value: 24 * 7 },
									].map((preset) => (
										<Button
											key={preset.value}
											type="button"
											variant={
												selectedVotingPreset === preset.value &&
												votingDeadlineMode === "preset"
													? "default"
													: "outline"
											}
											size="sm"
											onClick={() => {
												setVotingDeadlineMode("preset");
												setSelectedVotingPreset(preset.value);
												setVotingDeadline("");
											}}
										>
											{preset.label}
										</Button>
									))}
									<Button
										type="button"
										variant={
											votingDeadlineMode === "custom" ? "default" : "outline"
										}
										size="sm"
										onClick={() => {
											setVotingDeadlineMode("custom");
											setSelectedVotingPreset(null);
										}}
									>
										Set a deadline...
									</Button>
								</div>
								{votingDeadlineMode === "custom" && (
									<Input
										id={votingDeadlineId}
										type="datetime-local"
										value={votingDeadline}
										onChange={(e) => setVotingDeadline(e.target.value)}
										max={date}
										className="mt-2"
									/>
								)}
								<p className="text-xs text-muted-foreground">
									When voting on presentations closes (before event starts)
								</p>
							</div>
						</>
					)}

					<div className="flex items-center justify-between">
						<Label htmlFor={isVirtualId}>Virtual Event</Label>
						<Switch
							id={isVirtualId}
							checked={isVirtual}
							onCheckedChange={setIsVirtual}
						/>
					</div>

					<div className="flex items-center justify-between">
						<Label htmlFor={locationTBDId}>Location TBD</Label>
						<Switch
							id={locationTBDId}
							checked={locationTBD}
							onCheckedChange={setLocationTBD}
						/>
					</div>

					{!locationTBD && (
						<div className="space-y-2">
							<Label htmlFor={locationId}>
								{isVirtual ? "Meeting Link" : "Location"}
							</Label>
							{isVirtual ? (
								<Input
									id={locationId}
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
					)}

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
									ref={fileInputRef}
									type="file"
									className="hidden"
									accept="image/*"
									onChange={handleFileSelect}
									disabled={isUploading}
								/>
							</label>
						)}
					</div>

					{selectedFile && (
						<ImageCropper
							file={selectedFile}
							open={cropModalOpen}
							onClose={handleCropCancel}
							onCropComplete={handleCropComplete}
						/>
					)}

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
