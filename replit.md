# Solana Token Scanner

## Overview
A Solana token scanner application that identifies safe tokens using Dexscreener and RugCheck APIs. The app displays verified tokens with safety scores and includes an admin panel for managing ads.

## Architecture

### Frontend (client/)
- **Framework**: React + TypeScript + Vite
- **Routing**: Wouter (lightweight router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (@tanstack/react-query)
- **Location**: `client/src/`

### Backend (server/)
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Routes**: RESTful endpoints in `server/routes.ts`
- **Location**: `server/`

### Shared (shared/)
- **Database Schema**: `shared/schema.ts` (Drizzle schema definitions)
- **Types**: Insert and select types exported from schema

## Key Files

### Database Schema
- `shared/schema.ts` - Drizzle ORM table definitions:
  - `verifiedTokens` - Tokens that passed safety checks
  - `failedTokens` - Tokens that failed verification
  - `scanLogs` - Log entries for each scan
  - `siteAds` - Ad management for admin panel

### API Routes
- `GET /api/tokens` - Paginated list of verified tokens
- `GET /api/tokens/:contractAddress` - Single token lookup
- `POST /api/scan-tokens` - Trigger manual token scan
- `GET /api/scan-logs` - Recent scan history
- `GET /api/ads` - Active ads
- Admin endpoints at `/api/admin/ads`

### Frontend Pages
- `/` - Main token scanner with grid/table views
- `/admin` - Ad management panel

## Database

Uses Replit's PostgreSQL database with Drizzle ORM.

**Commands**:
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Running the App

- `npm run dev` - Start development server (port 5000)
- Server runs Express + Vite middleware for hot reload

## Recent Changes (January 2026)
- Migrated from Supabase to Replit PostgreSQL + Drizzle ORM
- Converted from React Router to Wouter
- Removed Supabase auth (admin page is open access)
- Changed property naming from snake_case to camelCase
- Updated all hooks to use fetch API instead of Supabase client
- Added token images from DexScreener API (imageUrl field)
- Added 24h price change tracking with visual indicators (+/-)
- Created UnifiedSearch component that combines search and contract scanning
- Enhanced token cards with avatars, trending indicators, and improved layout
