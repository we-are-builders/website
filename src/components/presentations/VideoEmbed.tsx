import { ExternalLink } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface VideoEmbedProps {
	url: string;
	title?: string;
}

function parseYouTubeId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}
	return null;
}

function parseVimeoId(url: string): string | null {
	const patterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}
	return null;
}

export function VideoEmbed({ url, title }: VideoEmbedProps) {
	const youtubeId = parseYouTubeId(url);
	const vimeoId = parseVimeoId(url);

	if (youtubeId) {
		return (
			<AspectRatio ratio={16 / 9}>
				<iframe
					src={`https://www.youtube.com/embed/${youtubeId}`}
					title={title ?? "Video"}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="w-full h-full rounded-lg"
				/>
			</AspectRatio>
		);
	}

	if (vimeoId) {
		return (
			<AspectRatio ratio={16 / 9}>
				<iframe
					src={`https://player.vimeo.com/video/${vimeoId}`}
					title={title ?? "Video"}
					allow="autoplay; fullscreen; picture-in-picture"
					allowFullScreen
					className="w-full h-full rounded-lg"
				/>
			</AspectRatio>
		);
	}

	// Fallback: show as a link for unsupported URLs
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
		>
			<ExternalLink className="h-4 w-4" />
			Watch Recording
		</a>
	);
}
