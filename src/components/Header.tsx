import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
} from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Calendar,
	Home,
	LayoutDashboard,
	Menu,
	Settings,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const currentUser = useQuery(api.users.current);
	const getOrCreateUser = useMutation(api.users.getOrCreate);

	// Sync user with Convex when authenticated
	useEffect(() => {
		if (currentUser === undefined) {
			// Query still loading
			return;
		}
		if (currentUser === null) {
			// User not in Convex yet, create them
			getOrCreateUser();
		}
	}, [currentUser, getOrCreateUser]);

	const isAdmin = currentUser?.role === "admin";
	const isModerator =
		currentUser?.role === "moderator" || currentUser?.role === "admin";

	return (
		<>
			<header className="p-4 flex items-center justify-between bg-sidebar text-sidebar-foreground shadow-lg">
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<h1 className="ml-4 text-xl font-semibold">
						<Link to="/" className="flex items-center gap-2">
							<span className="text-sidebar-primary font-bold flex items-center gap-2">
								<img src="/logo512.png" alt="Logo" className="size-9" />
								We Are Builders
							</span>
						</Link>
					</h1>
				</div>

				<div className="flex items-center gap-4">
					<SignedOut>
						<SignInButton mode="modal">
							<Button variant="outline" size="sm">
								Sign In
							</Button>
						</SignInButton>
					</SignedOut>
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-10 h-10",
								},
							}}
						/>
					</SignedIn>
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-sidebar text-sidebar-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-sidebar-border">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					<Link
						to="/events"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors mb-2",
						}}
					>
						<Calendar size={20} />
						<span className="font-medium">Events</span>
					</Link>

					<SignedIn>
						<div className="border-t border-sidebar-border my-4" />

						<Link
							to="/dashboard"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors mb-2",
							}}
						>
							<LayoutDashboard size={20} />
							<span className="font-medium">Dashboard</span>
						</Link>

						{isModerator && (
							<Link
								to="/dashboard/events"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors mb-2",
								}}
							>
								<Settings size={20} />
								<span className="font-medium">Manage Events</span>
							</Link>
						)}

						{isAdmin && (
							<Link
								to="/admin"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors mb-2"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-colors mb-2",
								}}
							>
								<Users size={20} />
								<span className="font-medium">Admin Panel</span>
							</Link>
						)}
					</SignedIn>
				</nav>

				<SignedIn>
					<div className="p-4 border-t border-sidebar-border">
						{currentUser && (
							<div className="flex items-center gap-3">
								{currentUser.imageUrl && (
									<img
										src={currentUser.imageUrl}
										alt={currentUser.name}
										className="w-10 h-10 rounded-full"
									/>
								)}
								<div>
									<p className="font-medium">{currentUser.name}</p>
									<p className="text-sm text-muted-foreground capitalize">
										{currentUser.role}
									</p>
								</div>
							</div>
						)}
					</div>
				</SignedIn>
			</aside>

			{/* Overlay */}
			{isOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-black/50 z-40 cursor-default"
					onClick={() => setIsOpen(false)}
					aria-label="Close menu"
				/>
			)}
		</>
	);
}
