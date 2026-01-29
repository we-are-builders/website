import {
	RedirectToSignIn,
	SignedIn,
	SignedOut,
} from "@clerk/tanstack-react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { PresentationForm } from "../../../components/presentations/PresentationForm";
import { Button } from "../../../components/ui/button";

export const Route = createFileRoute("/dashboard/presentations/new")({
	component: NewPresentationPage,
});

function NewPresentationPage() {
	return (
		<>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<NewPresentationContent />
			</SignedIn>
		</>
	);
}

function NewPresentationContent() {
	const navigate = useNavigate();

	const handleSuccess = () => {
		navigate({ to: "/dashboard/presentations" });
	};

	return (
		<DashboardLayout>
			<div className="space-y-6 max-w-2xl">
				<div>
					<Button
						variant="ghost"
						className="text-muted-foreground hover:text-foreground mb-4"
						onClick={() => navigate({ to: "/dashboard/presentations" })}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Presentations
					</Button>
					<h1 className="text-3xl font-bold text-foreground">
						Submit a Presentation
					</h1>
					<p className="text-muted-foreground mt-1">
						Share your knowledge with the community
					</p>
				</div>

				<PresentationForm onSuccess={handleSuccess} />
			</div>
		</DashboardLayout>
	);
}
