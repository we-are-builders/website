import {
	GoogleMap,
	InfoWindow,
	Marker,
	useLoadScript,
} from "@react-google-maps/api";
import { ExternalLink, MapPin } from "lucide-react";
import { useCallback, useState } from "react";
import { env } from "../../env";

interface EventLocationMapProps {
	latitude: number;
	longitude: number;
	address: string;
	placeId?: string;
}

const mapContainerStyle = {
	width: "100%",
	height: "300px",
	borderRadius: "0.5rem",
};

export function EventLocationMap({
	latitude,
	longitude,
	address,
	placeId,
}: EventLocationMapProps) {
	const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;
	const [showInfoWindow, setShowInfoWindow] = useState(false);

	const { isLoaded, loadError } = useLoadScript({
		googleMapsApiKey: apiKey ?? "",
	});

	const center = { lat: latitude, lng: longitude };

	const onMarkerClick = useCallback(() => {
		setShowInfoWindow((prev) => !prev);
	}, []);

	const onInfoWindowClose = useCallback(() => {
		setShowInfoWindow(false);
	}, []);

	// Generate Google Maps URL
	const googleMapsUrl = placeId
		? `https://www.google.com/maps/place/?q=place_id:${placeId}`
		: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

	// Fallback when API key is not set
	if (!apiKey) {
		return (
			<div className="bg-accent rounded-lg p-4">
				<div className="flex items-center gap-2 text-muted-foreground mb-2">
					<MapPin className="h-5 w-5" />
					<span className="font-medium">Location</span>
				</div>
				<p className="text-foreground mb-3">{address}</p>
				<a
					href={googleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
				>
					<ExternalLink className="h-4 w-4" />
					Open in Google Maps
				</a>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="bg-accent rounded-lg p-4">
				<div className="flex items-center gap-2 text-muted-foreground mb-2">
					<MapPin className="h-5 w-5" />
					<span className="font-medium">Location</span>
				</div>
				<p className="text-foreground mb-3">{address}</p>
				<a
					href={googleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
				>
					<ExternalLink className="h-4 w-4" />
					Open in Google Maps
				</a>
			</div>
		);
	}

	if (!isLoaded) {
		return (
			<div className="bg-accent rounded-lg p-4 h-[300px] flex items-center justify-center">
				<p className="text-muted-foreground">Loading map...</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<GoogleMap
				mapContainerStyle={mapContainerStyle}
				center={center}
				zoom={15}
				options={{
					disableDefaultUI: false,
					zoomControl: true,
					mapTypeControl: false,
					streetViewControl: false,
					fullscreenControl: true,
				}}
			>
				<Marker position={center} onClick={onMarkerClick} />
				{showInfoWindow && (
					<InfoWindow position={center} onCloseClick={onInfoWindowClose}>
						<div className="p-1">
							<p className="text-sm font-medium text-gray-900 mb-1">
								{address}
							</p>
							<a
								href={googleMapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-blue-600 hover:underline"
							>
								Open in Google Maps
							</a>
						</div>
					</InfoWindow>
				)}
			</GoogleMap>
			<div className="flex items-center justify-between text-sm">
				<span className="text-foreground">{address}</span>
				<a
					href={googleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-primary hover:underline"
				>
					<ExternalLink className="h-4 w-4" />
					Open in Google Maps
				</a>
			</div>
		</div>
	);
}
