import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Calendar,
	ChevronRight,
	LayoutDashboard,
	Mic2,
	Users,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { cn } from "../lib/utils";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const currentUser = useQuery(api.users.current);
	const location = useLocation();

	const isAdmin = currentUser?.role === "admin";
	const isModerator =
		currentUser?.role === "moderator" || currentUser?.role === "admin";

	const navItems = [
		{
			href: "/dashboard",
			label: "Overview",
			icon: LayoutDashboard,
			show: true,
		},
		{
			href: "/dashboard/presentations",
			label: "My Presentations",
			icon: Mic2,
			show: true,
		},
		{
			href: "/dashboard/events",
			label: "Manage Events",
			icon: Calendar,
			show: isModerator,
		},
		{
			href: "/admin",
			label: "User Management",
			icon: Users,
			show: isAdmin,
		},
	];

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar */}
					<aside className="w-full lg:w-64 flex-shrink-0">
						<nav className="bg-card rounded-xl border border-border p-4 space-y-1">
							{navItems
								.filter((item) => item.show)
								.map((item) => {
									const isActive = location.pathname === item.href;
									return (
										<Link
											key={item.href}
											to={item.href}
											className={cn(
												"flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
												isActive
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
											)}
										>
											<item.icon className="h-5 w-5" />
											<span className="font-medium">{item.label}</span>
											{isActive && <ChevronRight className="ml-auto h-4 w-4" />}
										</Link>
									);
								})}
						</nav>

						{/* User Info */}
						{currentUser && (
							<div className="mt-4 bg-card rounded-xl border border-border p-4">
								<div className="flex items-center gap-3">
									{currentUser.imageUrl && (
										<img
											src={currentUser.imageUrl}
											alt={currentUser.name}
											className="h-10 w-10 rounded-full"
										/>
									)}
									<div>
										<p className="font-medium text-foreground">
											{currentUser.name}
										</p>
										<p className="text-sm text-muted-foreground capitalize">
											{currentUser.role}
										</p>
									</div>
								</div>
							</div>
						)}
					</aside>

					{/* Main Content */}
					<main className="flex-1">{children}</main>
				</div>
			</div>
		</div>
	);
}
