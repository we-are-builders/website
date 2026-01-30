import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
	type Crop,
	type PixelCrop,
	centerCrop,
	makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

const ASPECT_RATIO = 16 / 9;

interface ImageCropperProps {
	file: File;
	open: boolean;
	onClose: () => void;
	onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
	mediaWidth: number,
	mediaHeight: number,
	aspect: number,
): Crop {
	return centerCrop(
		makeAspectCrop(
			{
				unit: "%",
				width: 90,
			},
			aspect,
			mediaWidth,
			mediaHeight,
		),
		mediaWidth,
		mediaHeight,
	);
}

async function getCroppedImage(
	image: HTMLImageElement,
	crop: PixelCrop,
): Promise<Blob> {
	const canvas = document.createElement("canvas");
	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;

	canvas.width = crop.width * scaleX;
	canvas.height = crop.height * scaleY;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not get canvas context");
	}

	ctx.drawImage(
		image,
		crop.x * scaleX,
		crop.y * scaleY,
		crop.width * scaleX,
		crop.height * scaleY,
		0,
		0,
		canvas.width,
		canvas.height,
	);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Failed to create blob"));
				}
			},
			"image/jpeg",
			0.9,
		);
	});
}

export function ImageCropper({
	file,
	open,
	onClose,
	onCropComplete,
}: ImageCropperProps) {
	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const [imageSrc, setImageSrc] = useState<string>("");
	const [isProcessing, setIsProcessing] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	// Load image when dialog opens
	useEffect(() => {
		if (open && file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImageSrc(reader.result as string);
			};
			reader.readAsDataURL(file);
		} else if (!open) {
			setImageSrc("");
			setCrop(undefined);
			setCompletedCrop(undefined);
		}
	}, [open, file]);

	const onImageLoad = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement>) => {
			const { width, height } = e.currentTarget;
			setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
		},
		[],
	);

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				onClose();
			}
		},
		[onClose],
	);

	const handleConfirm = useCallback(async () => {
		if (!imgRef.current || !completedCrop) return;

		setIsProcessing(true);
		try {
			const croppedBlob = await getCroppedImage(imgRef.current, completedCrop);
			onCropComplete(croppedBlob);
			onClose();
		} catch (error) {
			console.error("Failed to crop image:", error);
		} finally {
			setIsProcessing(false);
		}
	}, [completedCrop, onCropComplete, onClose]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Crop Image</DialogTitle>
					<DialogDescription>
						Adjust the crop area to select the portion of the image to display.
						The crop is locked to 16:9 aspect ratio for consistent display.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-center items-center">
					{imageSrc && (
						<ReactCrop
							crop={crop}
							onChange={(_, percentCrop) => setCrop(percentCrop)}
							onComplete={(c) => setCompletedCrop(c)}
							aspect={ASPECT_RATIO}
							className="max-w-full"
						>
							<img
								ref={imgRef}
								src={imageSrc}
								alt="Crop preview"
								onLoad={onImageLoad}
								className="max-h-[50vh] max-w-full object-contain"
							/>
						</ReactCrop>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isProcessing}>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!completedCrop || isProcessing}
					>
						{isProcessing ? "Processing..." : "Confirm Crop"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
