import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
	getCurrentUser,
	requireAuth,
	requireRole,
	canManageUsers,
} from './lib/auth'

// Get the current authenticated user
export const current = query({
	args: {},
	handler: async (ctx) => {
		return await getCurrentUser(ctx)
	},
})

// Sync user from Clerk - creates user if not exists
// First user automatically becomes admin
export const getOrCreate = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await requireAuth(ctx)

		// Check if user already exists
		const existingUser = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.unique()

		if (existingUser) {
			// Update user info from Clerk if changed
			const updates: Partial<{
				name: string
				email: string
				imageUrl: string
			}> = {}

			if (identity.name && identity.name !== existingUser.name) {
				updates.name = identity.name
			}
			if (identity.email && identity.email !== existingUser.email) {
				updates.email = identity.email
			}
			if (identity.pictureUrl && identity.pictureUrl !== existingUser.imageUrl) {
				updates.imageUrl = identity.pictureUrl
			}

			if (Object.keys(updates).length > 0) {
				await ctx.db.patch(existingUser._id, updates)
			}

			return existingUser._id
		}

		// Check if this is the first user (will become admin)
		const userCount = await ctx.db.query('users').collect()
		const isFirstUser = userCount.length === 0

		// Create new user
		const userId = await ctx.db.insert('users', {
			clerkId: identity.subject,
			email: identity.email ?? '',
			name: identity.name ?? identity.email ?? 'Anonymous',
			imageUrl: identity.pictureUrl,
			role: isFirstUser ? 'admin' : 'member',
			createdAt: Date.now(),
		})

		return userId
	},
})

// List all users (admin only)
export const list = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireRole(ctx, ['admin'])

		if (!canManageUsers(user)) {
			throw new Error('Unauthorized')
		}

		return await ctx.db.query('users').order('desc').collect()
	},
})

// Update user role (admin only, can only promote to admin)
export const updateRole = mutation({
	args: {
		userId: v.id('users'),
		role: v.union(
			v.literal('member'),
			v.literal('moderator'),
			v.literal('admin'),
		),
	},
	handler: async (ctx, args) => {
		const currentUser = await requireRole(ctx, ['admin'])

		if (!canManageUsers(currentUser)) {
			throw new Error('Unauthorized')
		}

		// Cannot change own role
		if (currentUser._id === args.userId) {
			throw new Error('Cannot change your own role')
		}

		const targetUser = await ctx.db.get(args.userId)
		if (!targetUser) {
			throw new Error('User not found')
		}

		await ctx.db.patch(args.userId, { role: args.role })

		return args.userId
	},
})

// Get user by ID
export const getById = query({
	args: { userId: v.id('users') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId)
	},
})
