import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { useCallback, useRef, useState } from "react";
import { env } from "../../env";
import { Input } from "../ui/input";

const libraries: "places"[] = ["places"];

export interface PlaceResult {
	address: string;
	latitude: number;
	longitude: number;
	placeId: string;
	formattedAddress: string;
}

interface AddressAutocompleteProps {
	value: string;
	onChange: (value: string) => void;
	onPlaceSelect: (place: PlaceResult | null) => void;
	placeholder?: string;
	disabled?: boolean;
}

export function AddressAutocomplete({
	value,
	onChange,
	onPlaceSelect,
	placeholder = "Enter venue address",
	disabled = false,
}: AddressAutocompleteProps) {
	const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;
	const [autocomplete, setAutocomplete] =
		useState<google.maps.places.Autocomplete | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const { isLoaded, loadError } = useLoadScript({
		googleMapsApiKey: apiKey ?? "",
		libraries,
	});

	const onLoad = useCallback(
		(autocompleteInstance: google.maps.places.Autocomplete) => {
			setAutocomplete(autocompleteInstance);
		},
		[],
	);

	const onPlaceChanged = useCallback(() => {
		if (autocomplete) {
			const place = autocomplete.getPlace();

			if (place.geometry?.location && place.place_id) {
				const result: PlaceResult = {
					address: place.name ?? place.formatted_address ?? "",
					latitude: place.geometry.location.lat(),
					longitude: place.geometry.location.lng(),
					placeId: place.place_id,
					formattedAddress: place.formatted_address ?? "",
				};
				onChange(result.formattedAddress);
				onPlaceSelect(result);
			} else {
				// User typed something but didn't select from dropdown
				onPlaceSelect(null);
			}
		}
	}, [autocomplete, onChange, onPlaceSelect]);

	// Fallback to regular input if API key is not set
	if (!apiKey) {
		return (
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					onPlaceSelect(null);
				}}
				placeholder={placeholder}
				disabled={disabled}
			/>
		);
	}

	if (loadError) {
		return (
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					onPlaceSelect(null);
				}}
				placeholder={placeholder}
				disabled={disabled}
			/>
		);
	}

	if (!isLoaded) {
		return (
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Loading..."
				disabled
			/>
		);
	}

	return (
		<Autocomplete
			onLoad={onLoad}
			onPlaceChanged={onPlaceChanged}
			options={{
				types: ["establishment", "geocode"],
				fields: ["place_id", "geometry", "formatted_address", "name"],
			}}
		>
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					// Clear coordinates when user manually types
					onPlaceSelect(null);
				}}
				placeholder={placeholder}
				disabled={disabled}
			/>
		</Autocomplete>
	);
}
