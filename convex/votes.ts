import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser, getCurrentUser } from './lib/auth'

// Cast a vote on a presentation (attendees only)
export const cast = mutation({
	args: {
		presentationId: v.id('presentations'),
		vote: v.union(v.literal('approve'), v.literal('reject')),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)

		// Get the presentation
		const presentation = await ctx.db.get(args.presentationId)
		if (!presentation) {
			throw new Error('Presentation not found')
		}

		if (presentation.status !== 'pending') {
			throw new Error('Cannot vote on non-pending presentations')
		}

		// Check if voting deadline has passed
		const event = await ctx.db.get(presentation.eventId)
		if (!event) {
			throw new Error('Event not found')
		}
		if (event.votingDeadline && Date.now() > event.votingDeadline) {
			throw new Error('Voting deadline has passed')
		}

		// Check if user is an attendee of the event
		const attendance = await ctx.db
			.query('attendees')
			.withIndex('by_event_user', (q) =>
				q.eq('eventId', presentation.eventId).eq('userId', user._id),
			)
			.unique()

		if (!attendance) {
			throw new Error('You must be an attendee of this event to vote')
		}

		// Check if user already voted
		const existingVote = await ctx.db
			.query('votes')
			.withIndex('by_user_presentation', (q) =>
				q.eq('userId', user._id).eq('presentationId', args.presentationId),
			)
			.unique()

		if (existingVote) {
			// Update existing vote
			await ctx.db.patch(existingVote._id, {
				vote: args.vote,
			})
		} else {
			// Create new vote
			await ctx.db.insert('votes', {
				presentationId: args.presentationId,
				userId: user._id,
				vote: args.vote,
				createdAt: Date.now(),
			})
		}

		// Check if presentation should be approved
		await checkPresentationApproval(ctx, args.presentationId)

		return args.presentationId
	},
})

// Remove a vote
export const remove = mutation({
	args: { presentationId: v.id('presentations') },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)

		// Get the presentation to check deadline
		const presentation = await ctx.db.get(args.presentationId)
		if (!presentation) {
			throw new Error('Presentation not found')
		}

		// Check if voting deadline has passed
		const event = await ctx.db.get(presentation.eventId)
		if (!event) {
			throw new Error('Event not found')
		}
		if (event.votingDeadline && Date.now() > event.votingDeadline) {
			throw new Error('Voting deadline has passed')
		}

		const existingVote = await ctx.db
			.query('votes')
			.withIndex('by_user_presentation', (q) =>
				q.eq('userId', user._id).eq('presentationId', args.presentationId),
			)
			.unique()

		if (!existingVote) {
			throw new Error('Vote not found')
		}

		await ctx.db.delete(existingVote._id)

		return args.presentationId
	},
})

// Get current user's vote on a presentation
export const getMyVote = query({
	args: { presentationId: v.id('presentations') },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx)
		if (!user) {
			return null
		}

		const vote = await ctx.db
			.query('votes')
			.withIndex('by_user_presentation', (q) =>
				q.eq('userId', user._id).eq('presentationId', args.presentationId),
			)
			.unique()

		return vote?.vote ?? null
	},
})

// Get vote counts for a presentation
export const getCounts = query({
	args: { presentationId: v.id('presentations') },
	handler: async (ctx, args) => {
		const votes = await ctx.db
			.query('votes')
			.withIndex('by_presentation', (q) =>
				q.eq('presentationId', args.presentationId),
			)
			.collect()

		const approveCount = votes.filter((v) => v.vote === 'approve').length
		const rejectCount = votes.filter((v) => v.vote === 'reject').length

		return {
			approve: approveCount,
			reject: rejectCount,
			total: votes.length,
		}
	},
})

// Internal function to check and update presentation status after voting
async function checkPresentationApproval(
	ctx: { db: any },
	presentationId: any,
) {
	const presentation = await ctx.db.get(presentationId)
	if (!presentation || presentation.status !== 'pending') {
		return
	}

	// Must have admin approval first
	if (!presentation.adminApproved) {
		return
	}

	// Get attendee count for the event
	const attendees = await ctx.db
		.query('attendees')
		.withIndex('by_event', (q: any) => q.eq('eventId', presentation.eventId))
		.collect()

	const attendeeCount = attendees.length
	const minVotesRequired = Math.ceil(attendeeCount / 2)

	// Get votes
	const votes = await ctx.db
		.query('votes')
		.withIndex('by_presentation', (q: any) =>
			q.eq('presentationId', presentationId),
		)
		.collect()

	const totalVotes = votes.length
	const approveCount = votes.filter((v: any) => v.vote === 'approve').length

	// Check if we have enough votes and 50% approval
	if (totalVotes >= minVotesRequired) {
		const approvalRate = totalVotes > 0 ? approveCount / totalVotes : 0

		if (approvalRate >= 0.5) {
			await ctx.db.patch(presentationId, {
				status: 'approved',
				updatedAt: Date.now(),
			})
		}
	}
}
