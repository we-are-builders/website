import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";

// Initialize Resend component instance
export const resend = new Resend(components.resend, {
	testMode: process.env.NODE_ENV !== "production",
});

// Default sender email - should be from a verified domain in Resend
export const FROM_EMAIL = "WeAreBuilders <noreply@wearebuilders.dev>";

// Get the app URL for generating links
export function getAppUrl(): string {
	return process.env.VITE_APP_URL ?? "http://localhost:3000";
}

// Helper to format a date for display
export function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	});
}

// Generate ICS file content for calendar events
export function generateICS(event: {
	title: string;
	description: string;
	date: number;
	endDate?: number;
	location: string;
	isVirtual: boolean;
}): string {
	const formatICSDate = (timestamp: number): string => {
		const date = new Date(timestamp);
		return date
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}/, "");
	};

	const escapeICS = (text: string): string => {
		return text
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n");
	};

	const uid = `${event.date}-${Date.now()}@wearebuilders.dev`;
	const now = formatICSDate(Date.now());
	const dtStart = formatICSDate(event.date);
	// Default to 2 hours if no end date specified
	const dtEnd = formatICSDate(event.endDate ?? event.date + 2 * 60 * 60 * 1000);

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//WeAreBuilders//Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		`SUMMARY:${escapeICS(event.title)}`,
		`DESCRIPTION:${escapeICS(event.description)}`,
		`LOCATION:${escapeICS(event.isVirtual ? "Virtual Event" : event.location)}`,
		"STATUS:CONFIRMED",
		"END:VEVENT",
		"END:VCALENDAR",
	];

	return lines.join("\r\n");
}

// Email template: Event cancelled
export function eventCancelledEmail(event: Doc<"events">): {
	subject: string;
	html: string;
} {
	const formattedDate = formatDate(event.date);

	return {
		subject: `${event.title} has been cancelled`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #dc2626;">Event Cancelled</h1>
  <p>We're sorry to inform you that <strong>${event.title}</strong> scheduled for ${formattedDate} has been cancelled.</p>
  <p>We apologize for any inconvenience this may cause.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}

// Email template: Event changed (location or time)
export function eventChangedEmail(
	event: Doc<"events">,
	changes: {
		dateChanged?: boolean;
		locationChanged?: boolean;
		oldDate?: number;
		oldLocation?: string;
	},
): {
	subject: string;
	html: string;
} {
	const formattedDate = formatDate(event.date);
	const changesList: string[] = [];

	if (changes.dateChanged && changes.oldDate) {
		changesList.push(`
      <li>
        <strong>New Date/Time:</strong> ${formattedDate}<br>
        <span style="color: #6b7280; text-decoration: line-through;">Previously: ${formatDate(changes.oldDate)}</span>
      </li>
    `);
	}

	if (changes.locationChanged && changes.oldLocation) {
		const newLocation = event.isVirtual
			? "Virtual Event"
			: event.formattedAddress || event.location;
		changesList.push(`
      <li>
        <strong>New Location:</strong> ${newLocation}<br>
        <span style="color: #6b7280; text-decoration: line-through;">Previously: ${changes.oldLocation}</span>
      </li>
    `);
	}

	return {
		subject: `${event.title} - Important Update`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #2563eb;">Event Update</h1>
  <p><strong>${event.title}</strong> has been updated with the following changes:</p>
  <ul style="line-height: 1.8;">
    ${changesList.join("")}
  </ul>
  <p>Please update your calendar accordingly.</p>
  <a href="${getAppUrl()}/events/${event._id}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Event Details</a>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}

// Email template: Event reminder (1 day before)
export function eventReminderEmail(event: Doc<"events">): {
	subject: string;
	html: string;
} {
	const formattedDate = formatDate(event.date);
	const location = event.isVirtual
		? "Virtual Event"
		: event.formattedAddress || event.location;

	return {
		subject: `Reminder: ${event.title} is tomorrow!`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #16a34a;">Event Reminder</h1>
  <p>Don't forget! <strong>${event.title}</strong> is happening tomorrow.</p>
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
    <p style="margin: 0;"><strong>Location:</strong> ${location}</p>
  </div>
  <p>We've attached a calendar file (.ics) to help you add this event to your calendar.</p>
  <a href="${getAppUrl()}/events/${event._id}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Event Details</a>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}

// Email template: New attendee notification (to event creator)
export function newAttendeeEmail(
	event: Doc<"events">,
	attendee: Doc<"users">,
	attendeeCount: number,
): {
	subject: string;
	html: string;
} {
	return {
		subject: `New attendee for ${event.title}`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">New Attendee</h1>
  <p><strong>${attendee.name}</strong> has registered for your event <strong>${event.title}</strong>.</p>
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Current attendee count:</strong> ${attendeeCount}</p>
  </div>
  <a href="${getAppUrl()}/events/${event._id}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Event</a>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}

// Email template: Presentation accepted
export function presentationAcceptedEmail(
	event: Doc<"events">,
	presentation: Doc<"presentations">,
): {
	subject: string;
	html: string;
} {
	const formattedDate = formatDate(event.date);
	const eventUrl = `${getAppUrl()}/events/${event._id}`;

	return {
		subject: `Congratulations! Your presentation "${presentation.title}" was accepted`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #16a34a; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Congratulations!</h1>
  </div>
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Great news! Your presentation <strong>"${presentation.title}"</strong> has been accepted for <strong>${event.title}</strong>.</p>
    <div style="background-color: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Event:</strong> ${event.title}</p>
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 0;"><strong>Duration:</strong> ${presentation.duration} minutes</p>
    </div>
    <p>The community voted and your presentation was selected. We're excited to have you present!</p>
    <a href="${eventUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Event Details</a>
  </div>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}

// Email template: Presentation rejected
export function presentationRejectedEmail(
	event: Doc<"events">,
	presentation: Doc<"presentations">,
): {
	subject: string;
	html: string;
} {
	const eventUrl = `${getAppUrl()}/events/${event._id}`;

	return {
		subject: `Update on your presentation "${presentation.title}"`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #6b7280; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Presentation Update</h1>
  </div>
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Thank you for submitting your presentation <strong>"${presentation.title}"</strong> for <strong>${event.title}</strong>.</p>
    <p>Unfortunately, your presentation was not selected this time. The community voting has concluded, and we had many great submissions to choose from.</p>
    <p>We appreciate your effort and encourage you to submit presentations for future events. Your participation helps make our community stronger!</p>
    <a href="${eventUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Event</a>
  </div>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}

// Email template: Presentation submitted (to all attendees)
export function presentationSubmittedEmail(
	event: Doc<"events">,
	presentation: Doc<"presentations">,
): {
	subject: string;
	html: string;
} {
	const voteUrl = `${getAppUrl()}/events/${event._id}/vote`;

	return {
		subject: `New presentation submitted for ${event.title} - Vote now!`,
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #ea580c;">New Presentation</h1>
  <p>A new presentation has been submitted for <strong>${event.title}</strong>!</p>
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin: 0 0 10px 0; color: #1f2937;">${presentation.title}</h2>
    <p style="margin: 0 0 10px 0;"><strong>Speaker:</strong> ${presentation.speakerName}</p>
    <p style="margin: 0; color: #4b5563;">${presentation.description.substring(0, 200)}${presentation.description.length > 200 ? "..." : ""}</p>
  </div>
  <p>As an attendee, your vote helps decide which presentations will be featured at the event.</p>
  <a href="${voteUrl}" style="display: inline-block; background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Vote Now</a>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 14px;">WeAreBuilders - Community Events Platform</p>
</body>
</html>
		`.trim(),
	};
}
