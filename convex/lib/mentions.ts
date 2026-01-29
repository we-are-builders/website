import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Regex to match @mentions - handles names with spaces like "@John Doe"
// Matches @Name or @"Name With Spaces"
const MENTION_REGEX = /@([A-Za-z][A-Za-z0-9 ]*?)(?=\s|$|[,.:;!?])|@"([^"]+)"/g;

/**
 * Extract mentioned names from text
 * Supports both @Name and @"Name With Spaces" formats
 */
export function extractMentionedNames(text: string): string[] {
	const names: string[] = [];
	let match: RegExpExecArray | null;

	// Reset regex state
	MENTION_REGEX.lastIndex = 0;

	while ((match = MENTION_REGEX.exec(text)) !== null) {
		// match[1] is for simple names, match[2] is for quoted names
		const name = (match[1] || match[2])?.trim();
		if (name && !names.includes(name)) {
			names.push(name);
		}
	}

	return names;
}

/**
 * Resolve mentioned names to user IDs
 * Performs case-insensitive matching on user names
 */
export async function resolveMentions(
	ctx: QueryCtx | MutationCtx,
	text: string,
): Promise<Id<"users">[]> {
	const mentionedNames = extractMentionedNames(text);
	if (mentionedNames.length === 0) {
		return [];
	}

	// Get all users and match by name (case-insensitive)
	const allUsers = await ctx.db.query("users").collect();

	const mentionedUserIds: Id<"users">[] = [];

	for (const name of mentionedNames) {
		const normalizedName = name.toLowerCase();
		const user = allUsers.find(
			(u) => u.name.toLowerCase() === normalizedName,
		);
		if (user && !mentionedUserIds.includes(user._id)) {
			mentionedUserIds.push(user._id);
		}
	}

	return mentionedUserIds;
}

/**
 * Format text with highlighted mentions for display
 * Returns text with mentions wrapped in a special format that can be parsed client-side
 */
export function highlightMentions(text: string): string {
	// Reset regex state
	MENTION_REGEX.lastIndex = 0;
	return text.replace(
		MENTION_REGEX,
		(_match, simpleName, quotedName) => {
			const name = simpleName || quotedName;
			return `<mention>@${name}</mention>`;
		},
	);
}
