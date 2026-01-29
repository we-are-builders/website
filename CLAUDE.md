# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev              # Start dev server on port 3000
bunx convex dev          # Start Convex backend (run in separate terminal)

# Build & Test
bun run build            # Production build
bun run test             # Run all tests
bun --bun vitest run src/path/to/file.test.ts  # Run single test file

# Linting & Formatting (Biome)
bun run lint             # Lint check
bun run format           # Format check
bun run check            # Both lint and format
bunx biome check --write # Auto-fix issues

# Shadcn components
bunx shadcn@latest add <component>  # Add new UI component
```

## Architecture

This is a TanStack Start application with Convex backend and Clerk authentication.

### Tech Stack
- **Frontend**: React 19 + TanStack Router (file-based routing) + TanStack Start
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk (integrated with Convex via `ConvexProviderWithClerk`)
- **Styling**: Tailwind CSS 4 + Shadcn UI components
- **Forms**: TanStack Form + react-hook-form + zod validation

### Key Directories
- `src/routes/` - File-based routing (TanStack Router auto-generates `routeTree.gen.ts`)
- `src/components/ui/` - Shadcn components
- `src/integrations/convex/provider.tsx` - Convex + Clerk provider setup
- `convex/` - Backend functions and schema
- `convex/lib/auth.ts` - Auth helpers (`requireRole`, `getCurrentUser`, etc.)

### Data Model
The app manages a community events platform with:
- **users**: Synced with Clerk, has roles (member/moderator/admin)
- **events**: Created by moderators/admins
- **attendees**: Event signups
- **presentations**: Talk submissions for events
- **votes**: Attendee votes on presentations
- **messages**: Event chat messages

### Role-Based Access
- `member`: Can attend events and vote on presentations
- `moderator`: Can create/manage events
- `admin`: Full access including user management and presentation approval

### Convex Patterns
- Use `v.id("tableName")` for foreign keys
- System fields `_id` and `_creationTime` are auto-generated
- Define indexes for common query patterns
- Auth helpers in `convex/lib/auth.ts` handle role checks

### Environment Variables
- `VITE_CONVEX_URL` - Convex deployment URL (required)
- `CONVEX_DEPLOYMENT` - Convex deployment name
- Use T3Env (`src/env.ts`) for type-safe env vars with `VITE_` prefix for client-side

### Code Style
- Biome for linting/formatting with tabs and double quotes
- Path alias: `@/` maps to `src/`
