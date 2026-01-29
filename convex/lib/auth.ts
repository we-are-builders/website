import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc } from '../_generated/dataModel'

export type Role = 'member' | 'moderator' | 'admin'

export async function getAuthIdentity(ctx: QueryCtx | MutationCtx) {
	return await ctx.auth.getUserIdentity()
}

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) {
		throw new Error('Unauthenticated')
	}
	return identity
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	const identity = await getAuthIdentity(ctx)
	if (!identity) {
		return null
	}

	const user = await ctx.db
		.query('users')
		.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
		.unique()

	return user
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
	const user = await getCurrentUser(ctx)
	if (!user) {
		throw new Error('User not found')
	}
	return user
}

export async function requireRole(
	ctx: QueryCtx | MutationCtx,
	allowedRoles: Role[],
): Promise<Doc<'users'>> {
	const user = await requireUser(ctx)

	if (!allowedRoles.includes(user.role)) {
		throw new Error(
			`Unauthorized: requires one of [${allowedRoles.join(', ')}] role`,
		)
	}

	return user
}

export function isAdmin(user: Doc<'users'>): boolean {
	return user.role === 'admin'
}

export function isModerator(user: Doc<'users'>): boolean {
	return user.role === 'moderator' || user.role === 'admin'
}

export function canManageEvents(user: Doc<'users'>): boolean {
	return isModerator(user)
}

export function canApprovePresentation(user: Doc<'users'>): boolean {
	return isAdmin(user)
}

export function canManageUsers(user: Doc<'users'>): boolean {
	return isAdmin(user)
}
