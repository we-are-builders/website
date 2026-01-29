import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
	getCurrentUser,
	requireUser,
	requireRole,
	canApprovePresentation,
} from "./lib/auth";

// Helper function to validate YouTube/Vimeo URLs
function isValidVideoUrl(url: string): boolean {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\//;
  return youtubeRegex.test(url) || vimeoRegex.test(url);
}

// List approved presentations for an event (public)
export const listApprovedByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    return presentations;
  },
});

// List all presentations for an event (authenticated - for voting)
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get vote counts for each presentation
    const presentationsWithVotes = await Promise.all(
      presentations.map(async (presentation) => {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_presentation", (q) =>
            q.eq("presentationId", presentation._id),
          )
          .collect();

        const approveCount = votes.filter((v) => v.vote === "approve").length;
        const rejectCount = votes.filter((v) => v.vote === "reject").length;

        // Get submitter info
        const submitter = await ctx.db.get(presentation.submittedBy);

        // Check if current user has voted
        let userVote = null;
        if (user) {
          const existingVote = votes.find((v) => v.userId === user._id);
          userVote = existingVote?.vote ?? null;
        }

        return {
          ...presentation,
          submitter: submitter
            ? { name: submitter.name, imageUrl: submitter.imageUrl }
            : null,
          votes: {
            approve: approveCount,
            reject: rejectCount,
            total: votes.length,
          },
          userVote,
        };
      }),
    );

    return presentationsWithVotes;
  },
});

// List pending presentations for an event (for voting page)
export const listPendingByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get vote counts and user's vote for each presentation
    const presentationsWithVotes = await Promise.all(
      presentations.map(async (presentation) => {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_presentation", (q) =>
            q.eq("presentationId", presentation._id),
          )
          .collect();

        const approveCount = votes.filter((v) => v.vote === "approve").length;
        const rejectCount = votes.filter((v) => v.vote === "reject").length;

        // Get submitter info
        const submitter = await ctx.db.get(presentation.submittedBy);

        // Check if current user has voted
        let userVote = null;
        if (user) {
          const existingVote = votes.find((v) => v.userId === user._id);
          userVote = existingVote?.vote ?? null;
        }

        return {
          ...presentation,
          submitter: submitter
            ? { name: submitter.name, imageUrl: submitter.imageUrl }
            : null,
          votes: {
            approve: approveCount,
            reject: rejectCount,
            total: votes.length,
          },
          userVote,
        };
      }),
    );

    return presentationsWithVotes;
  },
});

// Get my presentations
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const presentations = await ctx.db
      .query("presentations")
      .withIndex("by_submitter", (q) => q.eq("submittedBy", user._id))
      .collect();

    // Get event info for each presentation
    const presentationsWithEvents = await Promise.all(
      presentations.map(async (presentation) => {
        const event = await ctx.db.get(presentation.eventId);
        return {
          ...presentation,
          event: event ? { title: event.title, date: event.date } : null,
        };
      }),
    );

    return presentationsWithEvents;
  },
});

// Get single presentation by ID
export const getById = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      return null;
    }

    // Get vote counts
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_presentation", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .collect();

    const approveCount = votes.filter((v) => v.vote === "approve").length;
    const rejectCount = votes.filter((v) => v.vote === "reject").length;

    // Get event info
    const event = await ctx.db.get(presentation.eventId);

    // Get submitter info
    const submitter = await ctx.db.get(presentation.submittedBy);

    // Get attendee count for threshold calculation
    const attendees = await ctx.db
      .query("attendees")
      .withIndex("by_event", (q) => q.eq("eventId", presentation.eventId))
      .collect();

    const minVotesRequired = Math.ceil(attendees.length / 2);

    return {
      ...presentation,
      event: event ? { title: event.title, date: event.date } : null,
      submitter: submitter
        ? { name: submitter.name, imageUrl: submitter.imageUrl }
        : null,
      votes: {
        approve: approveCount,
        reject: rejectCount,
        total: votes.length,
      },
      attendeeCount: attendees.length,
      minVotesRequired,
    };
  },
});

// Submit a new presentation
export const submit = mutation({
	args: {
		title: v.string(),
		description: v.string(),
		speakerName: v.string(),
		speakerBio: v.optional(v.string()),
		duration: v.number(),
		targetAudience: v.string(),
		eventId: v.id("events"),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);

		// Check event exists and is upcoming
		const event = await ctx.db.get(args.eventId);
		if (!event) {
			throw new Error("Event not found");
		}
		if (event.status !== "upcoming") {
			throw new Error("Cannot submit presentations to non-upcoming events");
		}

		const now = Date.now();

		const presentationId = await ctx.db.insert("presentations", {
			title: args.title,
			description: args.description,
			speakerName: args.speakerName,
			speakerBio: args.speakerBio,
			duration: args.duration,
			targetAudience: args.targetAudience,
			eventId: args.eventId,
			submittedBy: user._id,
			status: "pending",
			adminApproved: false,
			createdAt: now,
			updatedAt: now,
		});

		// Notify all attendees about the new presentation
		await ctx.scheduler.runAfter(
			0,
			internal.notifications.sendPresentationSubmittedEmail,
			{
				eventId: args.eventId,
				presentationId,
			},
		);

		return presentationId;
	},
});

// Update own presentation
export const update = mutation({
  args: {
    presentationId: v.id("presentations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    speakerName: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    duration: v.optional(v.number()),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    // Only owner can update
    if (presentation.submittedBy !== user._id) {
      throw new Error("Unauthorized: not the owner");
    }

    // Cannot update approved/rejected presentations
    if (presentation.status !== "pending") {
      throw new Error("Cannot update non-pending presentations");
    }

    const updates: Partial<{
      title: string;
      description: string;
      speakerName: string;
      speakerBio: string;
      duration: number;
      targetAudience: string;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.speakerName !== undefined) updates.speakerName = args.speakerName;
    if (args.speakerBio !== undefined) updates.speakerBio = args.speakerBio;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.targetAudience !== undefined)
      updates.targetAudience = args.targetAudience;

    await ctx.db.patch(args.presentationId, updates);

    return args.presentationId;
  },
});

// Admin approve a presentation
export const adminApprove = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin"]);

    if (!canApprovePresentation(user)) {
      throw new Error("Unauthorized");
    }

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    if (presentation.status !== "pending") {
      throw new Error("Presentation is not pending");
    }

    await ctx.db.patch(args.presentationId, {
      adminApproved: true,
      adminApprovedBy: user._id,
      updatedAt: Date.now(),
    });

    // Check if presentation should be fully approved
    await checkAndUpdateStatus(ctx, args.presentationId);

    return args.presentationId;
  },
});

// Admin reject a presentation
export const adminReject = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin"]);

    if (!canApprovePresentation(user)) {
      throw new Error("Unauthorized");
    }

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    if (presentation.status !== "pending") {
      throw new Error("Presentation is not pending");
    }

    await ctx.db.patch(args.presentationId, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    return args.presentationId;
  },
});

// Internal function to check and update presentation status
async function checkAndUpdateStatus(ctx: { db: any }, presentationId: any) {
  const presentation = await ctx.db.get(presentationId);
  if (!presentation || presentation.status !== "pending") {
    return;
  }

  // Must have admin approval
  if (!presentation.adminApproved) {
    return;
  }

  // Get attendee count for the event
  const attendees = await ctx.db
    .query("attendees")
    .withIndex("by_event", (q: any) => q.eq("eventId", presentation.eventId))
    .collect();

  const attendeeCount = attendees.length;
  const minVotesRequired = Math.ceil(attendeeCount / 2);

  // Get votes
  const votes = await ctx.db
    .query("votes")
    .withIndex("by_presentation", (q: any) =>
      q.eq("presentationId", presentationId),
    )
    .collect();

  const totalVotes = votes.length;
  const approveCount = votes.filter((v: any) => v.vote === "approve").length;

  // Check if we have enough votes and 50% approval
  if (totalVotes >= minVotesRequired) {
    const approvalRate = totalVotes > 0 ? approveCount / totalVotes : 0;

    if (approvalRate >= 0.5) {
      await ctx.db.patch(presentationId, {
        status: "approved",
        updatedAt: Date.now(),
      });
    }
  }
}

// Export for use in votes.ts
export { checkAndUpdateStatus };

// Update recording URL (moderator/admin only)
export const updateRecordingUrl = mutation({
  args: {
    presentationId: v.id("presentations"),
    recordingUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["moderator", "admin"]);

    const presentation = await ctx.db.get(args.presentationId);
    if (!presentation) {
      throw new Error("Presentation not found");
    }

    if (args.recordingUrl && !isValidVideoUrl(args.recordingUrl)) {
      throw new Error(
        "Invalid video URL. Please provide a YouTube or Vimeo URL.",
      );
    }

    await ctx.db.patch(args.presentationId, {
      recordingUrl: args.recordingUrl,
      updatedAt: Date.now(),
    });

    return args.presentationId;
  },
});

// Internal mutation to process voting deadlines (called by cron job)
export const processVotingDeadlines = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all events with voting deadlines that have passed
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .collect();

    const eventsWithPassedDeadlines = events.filter(
      (event) => event.votingDeadline && event.votingDeadline < now,
    );

    let processedCount = 0;

    for (const event of eventsWithPassedDeadlines) {
      // Get all pending presentations for this event
      const presentations = await ctx.db
        .query("presentations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      for (const presentation of presentations) {
        // Get attendee count for vote threshold
        const attendees = await ctx.db
          .query("attendees")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const attendeeCount = attendees.length;
        const minVotesRequired = Math.ceil(attendeeCount / 2);

        // Get votes for this presentation
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_presentation", (q) =>
            q.eq("presentationId", presentation._id),
          )
          .collect();

        const approveCount = votes.filter((v) => v.vote === "approve").length;
        const totalVotes = votes.length;
        const approvalRate = totalVotes > 0 ? approveCount / totalVotes : 0;

        // Determine if presentation should be approved or rejected
        const shouldApprove =
          presentation.adminApproved &&
          totalVotes >= minVotesRequired &&
          approvalRate >= 0.5;

        const newStatus = shouldApprove ? "approved" : "rejected";

        // Update presentation status
        await ctx.db.patch(presentation._id, {
          status: newStatus,
          updatedAt: now,
        });

        // Schedule email notification to presenter
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendPresentationResultEmail,
          {
            presentationId: presentation._id,
            result: newStatus,
          },
        );

        processedCount++;
      }
    }

    return { processedCount };
  },
});
