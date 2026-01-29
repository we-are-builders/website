import { mutation } from "./_generated/server";
import { requireRole } from "./lib/auth";

// Generate an upload URL for event images
// Only moderators and admins can upload event images
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireRole(ctx, ["moderator", "admin"]);
		return await ctx.storage.generateUploadUrl();
	},
});
