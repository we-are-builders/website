import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, requireUser } from "./lib/auth";

// Register to attend an event
export const register = mutation({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);

		// Check event exists
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		// Check if already attending
		const existing = await ctx.db
			.query("attendees")
			.withIndex("by_event_user", (q) =>
				q.eq("eventId", args.eventId).eq("userId", user._id),
			)
			.unique();

		if (existing) {
			throw new Error("Already registered for this event");
		}

		const attendeeId = await ctx.db.insert("attendees", {
			eventId: args.eventId,
			userId: user._id,
			createdAt: Date.now(),
		});

		// Notify event creator about new attendee
		await ctx.scheduler.runAfter(
			0,
			internal.notifications.sendNewAttendeeEmail,
			{
				eventId: args.eventId,
				attendeeUserId: user._id,
			},
		);

		return attendeeId;
	},
});

// Unregister from an event
export const unregister = mutation({
	args: { eventId: v.id('events') },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)

		const existing = await ctx.db
			.query('attendees')
			.withIndex('by_event_user', (q) =>
				q.eq('eventId', args.eventId).eq('userId', user._id),
			)
			.unique()

		if (!existing) {
			throw new Error('Not registered for this event')
		}

		await ctx.db.delete(existing._id)

		return existing._id
	},
})

// List attendees for an event
export const listByEvent = query({
	args: { eventId: v.id('events') },
	handler: async (ctx, args) => {
		const attendees = await ctx.db
			.query('attendees')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect()

		// Get user details for each attendee
		const attendeesWithUsers = await Promise.all(
			attendees.map(async (attendee) => {
				const user = await ctx.db.get(attendee.userId)
				return {
					...attendee,
					user: user
						? {
								_id: user._id,
								name: user.name,
								imageUrl: user.imageUrl,
							}
						: null,
				}
			}),
		)

		return attendeesWithUsers
	},
})

// Get attendee count for an event
export const getCount = query({
	args: { eventId: v.id('events') },
	handler: async (ctx, args) => {
		const attendees = await ctx.db
			.query('attendees')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect()

		return attendees.length
	},
})

// Check if current user is attending an event
export const isAttending = query({
	args: { eventId: v.id('events') },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx)
		if (!user) {
			return false
		}

		const existing = await ctx.db
			.query('attendees')
			.withIndex('by_event_user', (q) =>
				q.eq('eventId', args.eventId).eq('userId', user._id),
			)
			.unique()

		return !!existing
	},
})

// Get events the current user is attending
export const myEvents = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx)
		if (!user) {
			return []
		}

		const attendances = await ctx.db
			.query('attendees')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect()

		const events = await Promise.all(
			attendances.map(async (attendance) => {
				return await ctx.db.get(attendance.eventId)
			}),
		)

		return events.filter((event) => event !== null)
	},
})
