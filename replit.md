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
  - `siteAds` - Ad management for admin panel (HTML/CSS/JS support)
  - `adminUsers` - Admin users with roles (super_admin/admin)
  - `featuredTokens` - Featured tokens displayed with fire icon
  - `visitorStats` - Daily visitor tracking statistics
  - `articles` - Content articles (HTML/CSS/JS support)

### API Routes
- `GET /api/tokens` - Paginated list of verified tokens
- `GET /api/tokens/:contractAddress` - Single token lookup
- `POST /api/scan-tokens` - Trigger manual token scan
- `GET /api/scan-logs` - Recent scan history
- `GET /api/ads` - Active ads
- `GET /api/featured-tokens` - Featured tokens list
- `POST /api/track-visit` - Track visitor statistics
- `GET /api/articles` - Published articles
- `GET /api/articles/:slug` - Single article by slug

### Admin API Routes (Protected by Replit Auth)
- `GET /api/admin/check` - Check admin status and role
- `GET/POST/PUT/DELETE /api/admin/ads` - Ads management
- `GET/POST/PUT/DELETE /api/admin/articles` - Articles management
- `GET/POST/DELETE /api/admin/featured-tokens` - Featured tokens management
- `GET /api/admin/visitor-stats` - Visitor statistics
- `GET/POST/DELETE /api/admin/admins` - Sub-admin management (super_admin only)

### Frontend Pages
- `/` - Main token scanner with grid/table views
- `/admin` - Full admin dashboard with Replit Auth

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
- Changed property naming from snake_case to camelCase
- Updated all hooks to use fetch API instead of Supabase client
- Added token images from DexScreener API (imageUrl field)
- Added 24h price change tracking with visual indicators (+/-)
- Created UnifiedSearch component that combines search and contract scanning
- Enhanced token cards with avatars, trending indicators, and improved layout
- Added social links (X, Telegram) and Solana donation address in header
- Implemented auto-scan every 5 minutes with countdown timer
- Added glowing NEW badge for tokens less than 1 hour old
- Added Chart button on each token card linking to DexScreener
- Added LIVE indicator on each token card
- Integrated Replit Auth for admin authentication
- Added role-based access control (super_admin vs admin)
- Created full admin dashboard with tabs (Stats, Ads, Articles, Featured, Admins)
- Added featured tokens system with fire icon display and priority ordering
- Implemented visitor tracking with daily/weekly/monthly/yearly/total stats
- Added HTML/CSS/JS support for ads and articles
- Added sub-admin management (super_admin only)

## Admin Dashboard Features
- **Stats Tab**: View visitor statistics (today, week, month, year, total)
- **Ads Tab**: Create/manage ads with HTML/CSS/JS support, toggle active status
- **Articles Tab**: Create/manage articles with HTML/CSS/JS content, publish/draft toggle
- **Featured Tab**: Add tokens to featured list (appear first with animated fire icon)
- **Admins Tab**: Manage sub-admins (super_admin only)

## Authentication
Admin access requires Replit Auth login. Add admins to the `adminUsers` table:
- `super_admin` role: Full access including sub-admin management
- `admin` role: Access to all features except admin management
