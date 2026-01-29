import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
	resend,
	FROM_EMAIL,
	eventCancelledEmail,
	eventChangedEmail,
	newAttendeeEmail,
	presentationSubmittedEmail,
	presentationAcceptedEmail,
	presentationRejectedEmail,
	mentionEmail,
} from "./lib/emails";
import { getCurrentUser, requireUser } from "./lib/auth";

// Helper to get all attendees with their email addresses for an event
async function getAttendeesWithEmails(
	ctx: { db: any },
	eventId: string,
): Promise<Array<{ email: string; name: string }>> {
	const attendees = await ctx.db
		.query("attendees")
		.withIndex("by_event", (q: any) => q.eq("eventId", eventId))
		.collect();

	const attendeesWithEmails = await Promise.all(
		attendees.map(async (attendee: any) => {
			const user = await ctx.db.get(attendee.userId);
			return user ? { email: user.email, name: user.name } : null;
		}),
	);

	return attendeesWithEmails.filter(
		(a): a is { email: string; name: string } => a !== null,
	);
}

// Send email to all attendees when an event is cancelled
export const sendEventCancelledEmail = internalMutation({
	args: {
		eventId: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			console.error("Event not found for cancelled email:", args.eventId);
			return;
		}

		const attendees = await getAttendeesWithEmails(ctx, args.eventId);
		if (attendees.length === 0) {
			console.log("No attendees to notify for cancelled event:", event.title);
			return;
		}

		const { subject, html } = eventCancelledEmail(event);

		// Send email to all attendees
		for (const attendee of attendees) {
			try {
				await resend.sendEmail(ctx, {
					from: FROM_EMAIL,
					to: attendee.email,
					subject,
					html,
				});
			} catch (error) {
				console.error(
					`Failed to send cancelled email to ${attendee.email}:`,
					error,
				);
			}
		}

		console.log(
			`Sent event cancelled emails to ${attendees.length} attendees for: ${event.title}`,
		);
	},
});

// Send email to all attendees when event details change (location/time)
export const sendEventChangedEmail = internalMutation({
	args: {
		eventId: v.id("events"),
		changes: v.object({
			dateChanged: v.optional(v.boolean()),
			locationChanged: v.optional(v.boolean()),
			oldDate: v.optional(v.number()),
			oldLocation: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			console.error("Event not found for changed email:", args.eventId);
			return;
		}

		const attendees = await getAttendeesWithEmails(ctx, args.eventId);
		if (attendees.length === 0) {
			console.log("No attendees to notify for changed event:", event.title);
			return;
		}

		const { subject, html } = eventChangedEmail(event, args.changes);

		// Send email to all attendees
		for (const attendee of attendees) {
			try {
				await resend.sendEmail(ctx, {
					from: FROM_EMAIL,
					to: attendee.email,
					subject,
					html,
				});
			} catch (error) {
				console.error(
					`Failed to send changed email to ${attendee.email}:`,
					error,
				);
			}
		}

		console.log(
			`Sent event changed emails to ${attendees.length} attendees for: ${event.title}`,
		);
	},
});

// Send email to event creator when a new attendee registers
export const sendNewAttendeeEmail = internalMutation({
	args: {
		eventId: v.id("events"),
		attendeeUserId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			console.error("Event not found for new attendee email:", args.eventId);
			return;
		}

		const creator = await ctx.db.get(event.createdBy);
		if (!creator) {
			console.error("Creator not found for event:", event.title);
			return;
		}

		const attendee = await ctx.db.get(args.attendeeUserId);
		if (!attendee) {
			console.error("Attendee not found:", args.attendeeUserId);
			return;
		}

		// Get current attendee count
		const attendees = await ctx.db
			.query("attendees")
			.withIndex("by_event", (q) => q.eq("eventId", args.eventId))
			.collect();
		const attendeeCount = attendees.length;

		const { subject, html } = newAttendeeEmail(event, attendee, attendeeCount);

		try {
			await resend.sendEmail(ctx, {
				from: FROM_EMAIL,
				to: creator.email,
				subject,
				html,
			});
			console.log(
				`Sent new attendee notification to ${creator.email} for: ${event.title}`,
			);
		} catch (error) {
			console.error(
				`Failed to send new attendee email to ${creator.email}:`,
				error,
			);
		}
	},
});

// Send email to all attendees when a new presentation is submitted
export const sendPresentationSubmittedEmail = internalMutation({
	args: {
		eventId: v.id("events"),
		presentationId: v.id("presentations"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			console.error(
				"Event not found for presentation email:",
				args.eventId,
			);
			return;
		}

		const presentation = await ctx.db.get(args.presentationId);
		if (!presentation) {
			console.error("Presentation not found:", args.presentationId);
			return;
		}

		const attendees = await getAttendeesWithEmails(ctx, args.eventId);
		if (attendees.length === 0) {
			console.log(
				"No attendees to notify about presentation for event:",
				event.title,
			);
			return;
		}

		const { subject, html } = presentationSubmittedEmail(event, presentation);

		// Send email to all attendees
		for (const attendee of attendees) {
			try {
				await resend.sendEmail(ctx, {
					from: FROM_EMAIL,
					to: attendee.email,
					subject,
					html,
				});
			} catch (error) {
				console.error(
					`Failed to send presentation email to ${attendee.email}:`,
					error,
				);
			}
		}

		console.log(
			`Sent presentation notification to ${attendees.length} attendees for: ${event.title}`,
		);
	},
});

// Helper query to get event by ID (for use in actions)
export const getEventById = internalQuery({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.eventId);
	},
});

// Helper query to get attendees for an event (for use in actions)
export const getAttendeesForEvent = internalQuery({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		return await getAttendeesWithEmails(ctx, args.eventId as string);
	},
});

// Cron job handler: Send reminders for events happening tomorrow
export const sendDailyReminders = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const oneDayFromNow = now + 24 * 60 * 60 * 1000;
		const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;

		// Get all upcoming events
		const events = await ctx.db
			.query("events")
			.withIndex("by_status", (q) => q.eq("status", "upcoming"))
			.collect();

		// Filter to events happening tomorrow (between 24-48 hours from now)
		const tomorrowEvents = events.filter(
			(event) => event.date >= oneDayFromNow && event.date < twoDaysFromNow,
		);

		console.log(`Found ${tomorrowEvents.length} events happening tomorrow`);

		// Schedule reminder emails for each event (uses Node.js runtime for ICS attachments)
		for (const event of tomorrowEvents) {
			await ctx.scheduler.runAfter(0, internal.notificationsNode.sendEventReminderEmail, {
				eventId: event._id,
			});
		}

		return { eventsScheduled: tomorrowEvents.length };
	},
});

// Send email to presenter when their presentation is approved or rejected
export const sendPresentationResultEmail = internalMutation({
	args: {
		presentationId: v.id("presentations"),
		result: v.union(v.literal("approved"), v.literal("rejected")),
	},
	handler: async (ctx, args) => {
		const presentation = await ctx.db.get(args.presentationId);
		if (!presentation) {
			console.error("Presentation not found:", args.presentationId);
			return;
		}

		const event = await ctx.db.get(presentation.eventId);
		if (!event) {
			console.error("Event not found for presentation:", presentation.eventId);
			return;
		}

		const presenter = await ctx.db.get(presentation.submittedBy);
		if (!presenter) {
			console.error("Presenter not found:", presentation.submittedBy);
			return;
		}

		const { subject, html } =
			args.result === "approved"
				? presentationAcceptedEmail(event, presentation)
				: presentationRejectedEmail(event, presentation);

		try {
			await resend.sendEmail(ctx, {
				from: FROM_EMAIL,
				to: presenter.email,
				subject,
				html,
			});
			console.log(
				`Sent presentation ${args.result} email to ${presenter.email} for: ${presentation.title}`,
			);
		} catch (error) {
			console.error(
				`Failed to send presentation result email to ${presenter.email}:`,
				error,
			);
		}
	},
});

// ===== MENTION NOTIFICATIONS =====

// Internal mutation to send mention notifications
export const sendMentionNotifications = internalMutation({
	args: {
		messageId: v.id("messages"),
		eventId: v.id("events"),
		sourceUserId: v.id("users"),
		mentionedUserIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db.get(args.eventId);
		const sourceUser = await ctx.db.get(args.sourceUserId);
		const message = await ctx.db.get(args.messageId);

		if (!event || !sourceUser || !message) {
			return;
		}

		for (const userId of args.mentionedUserIds) {
			const user = await ctx.db.get(userId);
			if (!user) continue;

			// Create in-app notification
			await ctx.db.insert("notifications", {
				userId,
				type: "mention",
				sourceUserId: args.sourceUserId,
				eventId: args.eventId,
				messageId: args.messageId,
				read: false,
				createdAt: Date.now(),
			});

			// Send email notification
			const emailContent = mentionEmail(event, sourceUser, message.content);
			try {
				await resend.sendEmail(ctx, {
					from: FROM_EMAIL,
					to: user.email,
					subject: emailContent.subject,
					html: emailContent.html,
				});
				console.log(`Sent mention notification email to ${user.email}`);
			} catch (error) {
				console.error(`Failed to send mention email to ${user.email}:`, error);
			}
		}
	},
});

// Get unread notifications for current user
export const getUnreadNotifications = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			return [];
		}

		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_user_unread", (q) =>
				q.eq("userId", user._id).eq("read", false),
			)
			.order("desc")
			.take(10);

		// Enrich with source user and event data
		const enrichedNotifications = await Promise.all(
			notifications.map(async (notification) => {
				const sourceUser = await ctx.db.get(notification.sourceUserId);
				const event = await ctx.db.get(notification.eventId);
				const message = notification.messageId
					? await ctx.db.get(notification.messageId)
					: null;

				return {
					...notification,
					sourceUser: sourceUser
						? {
								_id: sourceUser._id,
								name: sourceUser.name,
								imageUrl: sourceUser.imageUrl,
							}
						: null,
					event: event
						? {
								_id: event._id,
								title: event.title,
							}
						: null,
					messagePreview: message?.content?.slice(0, 100) ?? null,
				};
			}),
		);

		return enrichedNotifications;
	},
});

// Mark a notification as read
export const markNotificationRead = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);

		const notification = await ctx.db.get(args.notificationId);
		if (!notification || notification.userId !== user._id) {
			throw new Error("Notification not found");
		}

		await ctx.db.patch(args.notificationId, { read: true });
	},
});

// Mark all notifications as read for current user
export const markAllNotificationsRead = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);

		const unreadNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_user_unread", (q) =>
				q.eq("userId", user._id).eq("read", false),
			)
			.collect();

		for (const notification of unreadNotifications) {
			await ctx.db.patch(notification._id, { read: true });
		}
	},
});
