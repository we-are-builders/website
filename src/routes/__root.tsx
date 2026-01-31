import { TanStackDevtools } from "@tanstack/react-devtools";
import { PostHogProvider } from "posthog-js/react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { env } from "../env";

import Header from "../components/Header";
import { MentionToastListener } from "../components/notifications/MentionToastListener";
import { Toaster } from "../components/ui/sonner";

import ConvexProvider from "../integrations/convex/provider";

import appCss from "../styles.css?url";

function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go back home
      </Link>
    </main>
  );
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "We Are Builders",
      },
      {
        name: "description",
        content:
          "A community of passionate developers building the future together. Join our events, share your knowledge through presentations, and connect with fellow builders.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider apiKey={env.VITE_PUBLIC_POSTHOG_KEY}>
          <ConvexProvider>
            <Header />
            {children}
            <Toaster position="top-right" richColors />
            <MentionToastListener />
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </ConvexProvider>
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  );
}
