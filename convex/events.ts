import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole, canManageEvents } from "./lib/auth";

// List all events (public)
export const list = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("upcoming"),
				v.literal("ongoing"),
				v.literal("past"),
				v.literal("cancelled"),
			),
		),
	},
	handler: async (ctx, args) => {
		let events;

		if (args.status) {
			events = await ctx.db
				.query("events")
				.withIndex("by_status", (q) => q.eq("status", args.status!))
				.order("desc")
				.collect();
		} else {
			events = await ctx.db.query("events").order("desc").collect();
		}

		// Sort by date for upcoming events
		if (args.status === "upcoming") {
			events = events.sort((a, b) => a.date - b.date);
		}

		// Add imageUrl for each event
		return Promise.all(
			events.map(async (event) => ({
				...event,
				imageUrl: event.imageId
					? await ctx.storage.getUrl(event.imageId)
					: null,
			})),
		);
	},
});

// Get upcoming events (public, for homepage)
export const listUpcoming = query({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		const events = await ctx.db
			.query("events")
			.withIndex("by_status", (q) => q.eq("status", "upcoming"))
			.collect();

		// Filter to only future events and sort by date
		const filteredEvents = events
			.filter((event) => event.date >= now)
			.sort((a, b) => a.date - b.date);

		// Add imageUrl for each event
		return Promise.all(
			filteredEvents.map(async (event) => ({
				...event,
				imageUrl: event.imageId
					? await ctx.storage.getUrl(event.imageId)
					: null,
			})),
		);
	},
});

// Get single event by ID (public)
export const getById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

    // Get creator info
    const creator = await ctx.db.get(event.createdBy);

    // Get attendee count
    const attendees = await ctx.db
      .query("attendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get approved presentations
    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

		return {
			...event,
			imageUrl: event.imageId
				? await ctx.storage.getUrl(event.imageId)
				: null,
			creator: creator
				? { name: creator.name, imageUrl: creator.imageUrl }
				: null,
			attendeeCount: attendees.length,
			presentationCount: presentations.length,
		};
	},
});

// Create event (moderator/admin only)
export const create = mutation({
	args: {
		title: v.string(),
		description: v.string(),
		date: v.number(),
		endDate: v.optional(v.number()),
		location: v.string(),
		isVirtual: v.boolean(),
		latitude: v.optional(v.number()),
		longitude: v.optional(v.number()),
		placeId: v.optional(v.string()),
		formattedAddress: v.optional(v.string()),
		imageId: v.optional(v.id("_storage")),
		votingDeadline: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await requireRole(ctx, ["moderator", "admin"]);

		if (!canManageEvents(user)) {
			throw new Error("Unauthorized");
		}

		// Validate endDate is after date
		if (args.endDate !== undefined && args.endDate <= args.date) {
			throw new Error("End date must be after start date");
		}

		const now = Date.now();

		// Auto-default voting deadline to 24 hours before event start if not provided
		const votingDeadline =
			args.votingDeadline ?? args.date - 24 * 60 * 60 * 1000;

		// Clear coordinates for virtual events
		const locationData = args.isVirtual
			? {}
			: {
					latitude: args.latitude,
					longitude: args.longitude,
					placeId: args.placeId,
					formattedAddress: args.formattedAddress,
				};

		const eventId = await ctx.db.insert("events", {
			title: args.title,
			description: args.description,
			date: args.date,
			endDate: args.endDate,
			location: args.location,
			isVirtual: args.isVirtual,
			...locationData,
			imageId: args.imageId,
			votingDeadline,
			status: "upcoming",
			createdBy: user._id,
			createdAt: now,
			updatedAt: now,
		});

		return eventId;
	},
});

// Update event (moderator/admin only)
export const update = mutation({
	args: {
		eventId: v.id("events"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		date: v.optional(v.number()),
		endDate: v.optional(v.number()),
		location: v.optional(v.string()),
		isVirtual: v.optional(v.boolean()),
		latitude: v.optional(v.number()),
		longitude: v.optional(v.number()),
		placeId: v.optional(v.string()),
		formattedAddress: v.optional(v.string()),
		imageId: v.optional(v.id("_storage")),
		votingDeadline: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await requireRole(ctx, ["moderator", "admin"]);

		if (!canManageEvents(user)) {
			throw new Error("Unauthorized");
		}

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		// Capture old values for notification comparison
		const oldDate = event.date;
		const oldEndDate = event.endDate;
		const oldLocation = event.formattedAddress || event.location;

		// Validate endDate is after date
		const effectiveDate = args.date ?? event.date;
		const effectiveEndDate = args.endDate ?? event.endDate;
		if (effectiveEndDate !== undefined && effectiveEndDate <= effectiveDate) {
			throw new Error("End date must be after start date");
		}

		// Delete old image if a new one is provided and different
		if (
			args.imageId !== undefined &&
			event.imageId &&
			args.imageId !== event.imageId
		) {
			await ctx.storage.delete(event.imageId);
		}

		const updates: Partial<{
			title: string;
			description: string;
			date: number;
			endDate: number;
			location: string;
			isVirtual: boolean;
			latitude: number | undefined;
			longitude: number | undefined;
			placeId: string | undefined;
			formattedAddress: string | undefined;
			imageId: typeof args.imageId;
			votingDeadline: number;
			updatedAt: number;
		}> = {
			updatedAt: Date.now(),
		};

		if (args.title !== undefined) updates.title = args.title;
		if (args.description !== undefined) updates.description = args.description;
		if (args.date !== undefined) updates.date = args.date;
		if (args.endDate !== undefined) updates.endDate = args.endDate;
		if (args.location !== undefined) updates.location = args.location;
		if (args.imageId !== undefined) updates.imageId = args.imageId;
		if (args.votingDeadline !== undefined)
			updates.votingDeadline = args.votingDeadline;

		// Handle isVirtual toggle - clear coordinates when switching to virtual
		if (args.isVirtual !== undefined) {
			updates.isVirtual = args.isVirtual;
			if (args.isVirtual) {
				// Switching to virtual - clear location coordinates
				updates.latitude = undefined;
				updates.longitude = undefined;
				updates.placeId = undefined;
				updates.formattedAddress = undefined;
			}
		}

		// Only update coordinates for physical events
		const effectiveIsVirtual = args.isVirtual ?? event.isVirtual;
		if (!effectiveIsVirtual) {
			if (args.latitude !== undefined) updates.latitude = args.latitude;
			if (args.longitude !== undefined) updates.longitude = args.longitude;
			if (args.placeId !== undefined) updates.placeId = args.placeId;
			if (args.formattedAddress !== undefined)
				updates.formattedAddress = args.formattedAddress;
		}

		await ctx.db.patch(args.eventId, updates);

		// Check for date/time or location changes and send notifications
		const dateChanged =
			(args.date !== undefined && args.date !== oldDate) ||
			(args.endDate !== undefined && args.endDate !== oldEndDate);
		const newLocation = args.formattedAddress || args.location;
		const locationChanged =
			newLocation !== undefined && newLocation !== oldLocation;

		if (dateChanged || locationChanged) {
			await ctx.scheduler.runAfter(
				0,
				internal.notifications.sendEventChangedEmail,
				{
					eventId: args.eventId,
					changes: {
						dateChanged,
						locationChanged,
						oldDate: dateChanged ? oldDate : undefined,
						oldLocation: locationChanged ? oldLocation : undefined,
					},
				},
			);
		}

		return args.eventId;
	},
});

// Update event status (moderator/admin only)
export const updateStatus = mutation({
	args: {
		eventId: v.id("events"),
		status: v.union(
			v.literal("upcoming"),
			v.literal("ongoing"),
			v.literal("past"),
			v.literal("cancelled"),
		),
	},
	handler: async (ctx, args) => {
		const user = await requireRole(ctx, ["moderator", "admin"]);

		if (!canManageEvents(user)) {
			throw new Error("Unauthorized");
		}

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		const oldStatus = event.status;

		await ctx.db.patch(args.eventId, {
			status: args.status,
			updatedAt: Date.now(),
		});

		// Send cancellation notification if event was cancelled
		if (args.status === "cancelled" && oldStatus !== "cancelled") {
			await ctx.scheduler.runAfter(
				0,
				internal.notifications.sendEventCancelledEmail,
				{
					eventId: args.eventId,
				},
			);
		}

		return args.eventId;
	},
});

// Delete event (admin only)
export const remove = mutation({
	args: { eventId: v.id("events") },
	handler: async (ctx, args) => {
		await requireRole(ctx, ["admin"]);

		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}

		// Delete event image if exists
		if (event.imageId) {
			await ctx.storage.delete(event.imageId);
		}

		// Delete associated attendees
    const attendees = await ctx.db
      .query("attendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const attendee of attendees) {
      await ctx.db.delete(attendee._id);
    }

    // Delete associated presentations and their votes
    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const presentation of presentations) {
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_presentation", (q) =>
          q.eq("presentationId", presentation._id),
        )
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }

      await ctx.db.delete(presentation._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);

    return args.eventId;
  },
});

// Internal mutation to update event statuses (called by cron job)
export const updateEventStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all non-cancelled events
    const events = await ctx.db.query("events").collect();

    let updatedCount = 0;

    for (const event of events) {
      // Skip cancelled events (manual override preserved)
      if (event.status === "cancelled") {
        continue;
      }

      let newStatus: "upcoming" | "ongoing" | "past" = event.status as
        | "upcoming"
        | "ongoing"
        | "past";

      if (event.endDate !== undefined) {
        // Event has an end date
        if (now < event.date) {
          newStatus = "upcoming";
        } else if (now >= event.date && now < event.endDate) {
          newStatus = "ongoing";
        } else {
          newStatus = "past";
        }
      } else {
        // No end date - transition directly from upcoming to past
        if (now < event.date) {
          newStatus = "upcoming";
        } else {
          newStatus = "past";
        }
      }

      // Only patch if status changed
      if (newStatus !== event.status) {
        await ctx.db.patch(event._id, {
          status: newStatus,
          updatedAt: now,
        });
        updatedCount++;
      }
    }

    return { updatedCount };
  },
});
