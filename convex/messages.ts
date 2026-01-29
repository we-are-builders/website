import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, requireUser } from "./lib/auth";
import { resolveMentions } from "./lib/mentions";

// List messages for an event (requires auth)
export const listByEvent = query({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			return null;
		}

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_event_and_time", (q) => q.eq("eventId", args.eventId))
			.collect();

		// Get user details for each message
		const messagesWithUsers = await Promise.all(
			messages.map(async (message) => {
				const messageUser = await ctx.db.get(message.userId);
				return {
					...message,
					user: messageUser
						? {
								_id: messageUser._id,
								name: messageUser.name,
								imageUrl: messageUser.imageUrl,
							}
						: null,
				};
			}),
		);

		return messagesWithUsers;
	},
});

// Send a message to an event chat
export const send = mutation({
	args: {
		eventId: v.id("events"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);

		// Validate content
		const content = args.content.trim();
		if (!content) {
			throw new Error("Message cannot be empty");
		}
		if (content.length > 1000) {
			throw new Error("Message cannot exceed 1000 characters");
		}

		// Check event exists and is not past or cancelled
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}
		if (event.date <= Date.now()) {
			throw new Error("Cannot send messages to past events");
		}
		if (event.status === "cancelled") {
			throw new Error("Cannot send messages to cancelled events");
		}

		// Parse mentions from content
		const mentions = await resolveMentions(ctx, content);

		const messageId = await ctx.db.insert("messages", {
			eventId: args.eventId,
			userId: user._id,
			content,
			mentions: mentions.length > 0 ? mentions : undefined,
			createdAt: Date.now(),
		});

		// Send notifications for mentioned users (excluding self)
		const mentionsToNotify = mentions.filter((id) => id !== user._id);
		if (mentionsToNotify.length > 0) {
			await ctx.scheduler.runAfter(0, internal.notifications.sendMentionNotifications, {
				messageId,
				eventId: args.eventId,
				sourceUserId: user._id,
				mentionedUserIds: mentionsToNotify,
			});
		}

		return messageId;
	},
});
