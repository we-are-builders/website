import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
	"update-event-statuses",
	{ minutes: 5 },
	internal.events.updateEventStatuses,
);

// Process voting deadlines every 5 minutes
crons.interval(
	"process-voting-deadlines",
	{ minutes: 5 },
	internal.presentations.processVotingDeadlines,
);

// Send reminder emails for events happening tomorrow (runs daily at 9:00 AM UTC)
crons.cron(
	"send-event-reminders",
	"0 9 * * *",
	internal.notifications.sendDailyReminders,
);
// Note: sendDailyReminders schedules internal.notificationsNode.sendEventReminderEmail
// for each event, which runs in Node.js runtime to support ICS attachments

export default crons;
