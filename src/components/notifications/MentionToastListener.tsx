import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function MentionToastListener() {
	const navigate = useNavigate();
	const notifications = useQuery(api.notifications.getUnreadNotifications);
	const markAsRead = useMutation(api.notifications.markNotificationRead);

	// Track which notifications we've already shown toasts for
	const shownNotificationsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!notifications) return;

		for (const notification of notifications) {
			// Skip if we've already shown this notification
			if (shownNotificationsRef.current.has(notification._id)) {
				continue;
			}

			// Mark as shown
			shownNotificationsRef.current.add(notification._id);

			// Show toast for new notifications
			if (
				notification.type === "mention" &&
				notification.sourceUser &&
				notification.event
			) {
				const eventId = notification.event._id;
				toast.info(`${notification.sourceUser.name} mentioned you`, {
					description: notification.event.title,
					action: {
						label: "View",
						onClick: () => {
							// Mark as read
							markAsRead({
								notificationId: notification._id as Id<"notifications">,
							});
							// Navigate to the event
							navigate({
								to: "/events/$eventId",
								params: { eventId },
							});
						},
					},
					onDismiss: () => {
						// Mark as read when dismissed
						markAsRead({
							notificationId: notification._id as Id<"notifications">,
						});
					},
				});
			}
		}
	}, [notifications, markAsRead, navigate]);

	// This component doesn't render anything visible
	return null;
}
