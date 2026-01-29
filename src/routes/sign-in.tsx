import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4">
			<SignIn
				routing="path"
				path="/sign-in"
				signUpUrl="/sign-up"
				fallbackRedirectUrl="/dashboard"
			/>
		</div>
	);
}
