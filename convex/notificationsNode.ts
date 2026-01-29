"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
	resend,
	FROM_EMAIL,
	eventReminderEmail,
	generateICS,
} from "./lib/emails";
import { Resend as ResendSdk } from "resend";

// Send reminder emails with ICS attachment (1 day before event)
// This runs in Node.js runtime to support the Resend SDK for attachments
export const sendEventReminderEmail = internalAction({
	args: {
		eventId: v.id("events"),
	},
	handler: async (ctx, args) => {
		const event = await ctx.runQuery(internal.notifications.getEventById, {
			eventId: args.eventId,
		});
		if (!event) {
			console.error("Event not found for reminder email:", args.eventId);
			return;
		}

		const attendees = await ctx.runQuery(
			internal.notifications.getAttendeesForEvent,
			{
				eventId: args.eventId,
			},
		);
		if (attendees.length === 0) {
			console.log("No attendees to remind for event:", event.title);
			return;
		}

		const { subject, html } = eventReminderEmail(event);
		const icsContent = generateICS({
			title: event.title,
			description: event.description,
			date: event.date,
			endDate: event.endDate,
			location: event.location,
			isVirtual: event.isVirtual,
		});

		const resendSdk = new ResendSdk(process.env.RESEND_API_KEY);

		for (const attendee of attendees) {
			try {
				await resend.sendEmailManually(
					ctx,
					{ from: FROM_EMAIL, to: attendee.email, subject },
					async (emailId) => {
						const { data, error } = await resendSdk.emails.send({
							from: FROM_EMAIL,
							to: attendee.email,
							subject,
							html,
							attachments: [
								{
									filename: "event.ics",
									content: Buffer.from(icsContent).toString("base64"),
								},
							],
							headers: { "Idempotency-Key": emailId },
						});
						if (error) throw new Error(error.message);
						return data!.id!;
					},
				);
			} catch (error) {
				console.error(
					`Failed to send reminder email to ${attendee.email}:`,
					error,
				);
			}
		}

		console.log(
			`Sent reminder emails to ${attendees.length} attendees for: ${event.title}`,
		);
	},
});
