import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced with Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(
      v.literal("member"),
      v.literal("moderator"),
      v.literal("admin"),
    ),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Events table
  events: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.number(), // timestamp (start time)
    endDate: v.optional(v.number()), // timestamp (end time)
    location: v.string(), // physical location or virtual link
    isVirtual: v.boolean(),
    latitude: v.optional(v.number()), // coordinates for physical locations
    longitude: v.optional(v.number()),
    placeId: v.optional(v.string()), // Google Place ID
    formattedAddress: v.optional(v.string()), // validated address from Google
    status: v.union(
      v.literal("upcoming"),
      v.literal("ongoing"),
      v.literal("past"),
      v.literal("cancelled"),
    ),
    votingDeadline: v.optional(v.number()), // timestamp when voting closes
    imageId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  // Event Attendees - Members/Admins who sign up to attend
  attendees: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),

  // Presentations table
  presentations: defineTable({
    title: v.string(),
    description: v.string(),
    speakerName: v.string(),
    speakerBio: v.optional(v.string()),
    duration: v.number(), // in minutes
    targetAudience: v.string(),
    eventId: v.id("events"),
    submittedBy: v.id("users"),
    status: v.union(
      v.literal("pending"), // awaiting votes and admin approval
      v.literal("approved"), // selected for event
      v.literal("rejected"), // not selected
    ),
    adminApproved: v.boolean(), // at least one admin approved
    adminApprovedBy: v.optional(v.id("users")),
    recordingUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_status", ["status"])
    .index("by_submitter", ["submittedBy"]),

  // Votes table - attendee votes on presentations
  votes: defineTable({
    presentationId: v.id("presentations"),
    userId: v.id("users"),
    vote: v.union(v.literal("approve"), v.literal("reject")),
    createdAt: v.number(),
  })
    .index("by_presentation", ["presentationId"])
    .index("by_user_presentation", ["userId", "presentationId"]),

  // Messages table - event chat messages
  messages: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_and_time", ["eventId", "createdAt"]),
});
