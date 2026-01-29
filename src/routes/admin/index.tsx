import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Shield, ShieldCheck, User, Users } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Badge } from "../../components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";

export const Route = createFileRoute("/admin/")({
	component: AdminPage,
});

function AdminPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<AdminContent />
			</SignedIn>
		</>
	);
}

function AdminContent() {
	const currentUser = useQuery(api.users.current);
	const users = useQuery(api.users.list);
	const updateRole = useMutation(api.users.updateRole);

	const isAdmin = currentUser?.role === "admin";

	if (!isAdmin) {
		return (
			<DashboardLayout>
				<div className="text-center py-12">
					<h1 className="text-2xl font-bold text-foreground mb-4">
						Access Denied
					</h1>
					<p className="text-muted-foreground">
						You need admin privileges to access this page.
					</p>
				</div>
			</DashboardLayout>
		);
	}

	const handleRoleChange = async (
		userId: Id<"users">,
		newRole: "member" | "moderator" | "admin",
	) => {
		await updateRole({ userId, role: newRole });
	};

	const adminCount = users?.filter((u) => u.role === "admin").length ?? 0;
	const moderatorCount =
		users?.filter((u) => u.role === "moderator").length ?? 0;
	const memberCount = users?.filter((u) => u.role === "member").length ?? 0;

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						User Management
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage user roles and permissions
					</p>
				</div>

				{/* Stats */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Admins
							</CardTitle>
							<ShieldCheck className="h-4 w-4 text-red-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{adminCount}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Moderators
							</CardTitle>
							<Shield className="h-4 w-4 text-yellow-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{moderatorCount}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Members
							</CardTitle>
							<User className="h-4 w-4 text-primary" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-foreground">
								{memberCount}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							All Users
						</CardTitle>
					</CardHeader>
					<CardContent>
						{users === undefined ? (
							<div className="space-y-4">
								{[...Array(5)].map((_, i) => (
									<Skeleton key={i} className="h-12" />
								))}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>User</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((user) => (
										<UserRow
											key={user._id}
											user={user}
											currentUserId={currentUser?._id}
											onRoleChange={handleRoleChange}
										/>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}

interface UserRowProps {
	user: Doc<"users">;
	currentUserId?: Id<"users">;
	onRoleChange: (
		userId: Id<"users">,
		role: "member" | "moderator" | "admin",
	) => void;
}

function UserRow({ user, currentUserId, onRoleChange }: UserRowProps) {
	const [isUpdating, setIsUpdating] = useState(false);
	const isCurrentUser = user._id === currentUserId;

	const handleChange = async (value: string) => {
		setIsUpdating(true);
		try {
			await onRoleChange(user._id, value as "member" | "moderator" | "admin");
		} finally {
			setIsUpdating(false);
		}
	};

	const getRoleBadgeVariant = (
		role: string,
	): "default" | "secondary" | "destructive" | "outline" => {
		switch (role) {
			case "admin":
				return "destructive";
			case "moderator":
				return "default";
			default:
				return "secondary";
		}
	};

	return (
		<TableRow>
			<TableCell>
				<div className="flex items-center gap-3">
					{user.imageUrl ? (
						<img
							src={user.imageUrl}
							alt={user.name}
							className="h-8 w-8 rounded-full"
						/>
					) : (
						<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm text-foreground">
							{user.name.charAt(0)}
						</div>
					)}
					<span className="text-foreground font-medium">{user.name}</span>
					{isCurrentUser && (
						<Badge variant="outline" className="text-xs">
							You
						</Badge>
					)}
				</div>
			</TableCell>
			<TableCell className="text-muted-foreground">{user.email}</TableCell>
			<TableCell>
				<Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
			</TableCell>
			<TableCell className="text-muted-foreground">
				{new Date(user.createdAt).toLocaleDateString()}
			</TableCell>
			<TableCell>
				{isCurrentUser ? (
					<span className="text-muted-foreground text-sm">
						Cannot change own role
					</span>
				) : (
					<Select
						value={user.role}
						onValueChange={handleChange}
						disabled={isUpdating}
					>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="member">Member</SelectItem>
							<SelectItem value="moderator">Moderator</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
						</SelectContent>
					</Select>
				)}
			</TableCell>
		</TableRow>
	);
}
