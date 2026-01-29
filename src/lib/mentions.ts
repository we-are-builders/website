// Regex to match @mentions - handles names with spaces like "@John Doe"
const MENTION_REGEX = /@([A-Za-z][A-Za-z0-9 ]*?)(?=\s|$|[,.:;!?])|@"([^"]+)"/g;

/**
 * Parse text and return segments with mentions highlighted
 */
export function parseMentions(
	text: string,
): Array<{ type: "text" | "mention"; content: string }> {
	const segments: Array<{ type: "text" | "mention"; content: string }> = [];
	let lastIndex = 0;

	// Reset regex state
	MENTION_REGEX.lastIndex = 0;

	let match = MENTION_REGEX.exec(text);
	while (match !== null) {
		// Add text before the mention
		if (match.index > lastIndex) {
			segments.push({
				type: "text",
				content: text.slice(lastIndex, match.index),
			});
		}

		// Add the mention
		const name = match[1] || match[2];
		segments.push({
			type: "mention",
			content: `@${name}`,
		});

		lastIndex = match.index + match[0].length;
		match = MENTION_REGEX.exec(text);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		segments.push({
			type: "text",
			content: text.slice(lastIndex),
		});
	}

	return segments;
}

/**
 * Get the current mention query being typed (text after last @)
 * Returns null if not currently typing a mention
 */
export function getCurrentMentionQuery(
	text: string,
	cursorPosition: number,
): { query: string; startIndex: number } | null {
	// Look backwards from cursor position to find @
	const textBeforeCursor = text.slice(0, cursorPosition);
	const lastAtIndex = textBeforeCursor.lastIndexOf("@");

	if (lastAtIndex === -1) {
		return null;
	}

	// Check if there's a space between @ and cursor (would mean mention is complete)
	const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

	// If the text after @ contains certain characters, the mention is likely complete
	// But we should allow spaces in names like "@John Doe"
	// Only break on punctuation or if query is too long
	if (
		textAfterAt.includes("\n") ||
		textAfterAt.length > 30 ||
		/[,.:;!?]/.test(textAfterAt)
	) {
		return null;
	}

	return {
		query: textAfterAt,
		startIndex: lastAtIndex,
	};
}

/**
 * Insert a mention into the text, replacing the partial query
 */
export function insertMention(
	text: string,
	cursorPosition: number,
	name: string,
): { newText: string; newCursorPosition: number } {
	const mentionInfo = getCurrentMentionQuery(text, cursorPosition);

	if (!mentionInfo) {
		// Just insert at cursor
		const mention = `@${name} `;
		return {
			newText:
				text.slice(0, cursorPosition) + mention + text.slice(cursorPosition),
			newCursorPosition: cursorPosition + mention.length,
		};
	}

	// Replace the @query with @name
	const beforeMention = text.slice(0, mentionInfo.startIndex);
	const afterCursor = text.slice(cursorPosition);

	// If name contains spaces, we could wrap in quotes, but for simplicity we won't
	const mention = `@${name} `;

	return {
		newText: beforeMention + mention + afterCursor,
		newCursorPosition: beforeMention.length + mention.length,
	};
}
