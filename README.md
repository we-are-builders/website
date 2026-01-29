# WeAreBuilders

A community events platform built with TanStack Start, Convex, and Clerk.

## Tech Stack

- **Frontend**: React + TanStack Router + TanStack Start
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk
- **Styling**: Tailwind CSS 4 + Shadcn UI

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Convex account
- Clerk account

### Environment Variables

Create a `.env` file based on `.env.example`

### Installation

```bash
bun install
```

### Development

Run both commands in separate terminals:

```bash
bunx convex dev    # Start Convex backend
bun run dev        # Start dev server on port 3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run test` | Run tests |
| `bun run check` | Lint and format check |
| `bunx biome check --write` | Auto-fix lint/format issues |

## Features

- Event creation and management
- Presentation submissions and voting
- Real-time chat for events
- Role-based access (member, moderator, admin)
