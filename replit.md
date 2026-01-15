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
- `/bot` - Trading bot interface with wallet connection and snipe functionality
- `/ctrl-x7k9m2p4q8` - Admin dashboard (secret URL)

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
- Added glowing NEW badge for tokens less than 1 hour old (blue radial gradient)
- Added Chart button on each token card linking to DexScreener
- Added LIVE indicator on each token card
- Migrated admin auth from Replit Auth to password-based authentication
- Admin routes now protected by server-side password verification (X-Admin-Auth header)
- Created full admin dashboard with tabs (Stats, Ads, Articles, Featured, Admins)
- Added featured tokens system with fire icon display and priority ordering
- Implemented visitor tracking with daily/weekly/monthly/yearly/total stats
- Added HTML/CSS/JS support for ads and articles
- Added sub-admin management (super_admin only)
- Updated all hover effects to use hover-elevate utility (guideline compliant)
- Added proper icons: SiSolana (violet) for header/links, FaXTwitter, FaTelegram (sky-500)
- Removed unused TokenCard.tsx component (legacy code)
- Added Trading Bot with Jito MEV-protected transactions for fast sniping
- Bot admin controls for enable/disable, pricing, profit share, and trading parameters
- Sniper Bot button in header linking to /bot page

## Trading Bot Features
- **Wallet Connection**: Import private key (encrypted with AES-256-CBC)
- **Wallet Generation**: Generate new Solana wallet directly on the site
- **Quick Snipe**: Fast buy tokens with customizable SOL amount and slippage
- **Jito Integration**: MEV-protected transactions via Jito bundle endpoints
- **Auto Sniper**: Automatic token buying when enabled (monitors scanner for new tokens)
- **Profit Tracking**: Commission on profits only (configurable %, nothing on losses)
- **Commission Transfer**: Automatic profit share sent to owner wallet on profitable sells
- **Admin Controls**: Enable/disable bot, set subscription price, configure trading limits
- **Trade History**: View all past trades with P/L tracking
- **Secure Logout**: Option to delete generated wallet on disconnect or keep it for later

### Bot API Routes
- `GET /api/bot/settings` - Public bot settings (limits, enabled status)
- `POST /api/bot/connect` - Connect wallet with private key
- `POST /api/bot/generate-wallet` - Generate new Solana wallet
- `POST /api/bot/buy` - Execute buy order via Jito
- `POST /api/bot/sell` - Execute sell order via Jito
- `GET /api/bot/session/:sessionId` - Get session details and balance
- `DELETE /api/bot/session/:sessionId` - Delete session and wallet data
- `GET /api/bot/trades/:sessionId` - Get trade history
- `GET/PUT /api/admin/bot/settings` - Admin bot configuration

## Admin Dashboard Features
- **Stats Tab**: View visitor statistics (today, week, month, year, total)
- **Ads Tab**: Create/manage ads with HTML/CSS/JS support, toggle active status
- **Articles Tab**: Create/manage articles with HTML/CSS/JS content, publish/draft toggle
- **Featured Tab**: Add tokens to featured list (appear first with animated fire icon)
- **Admins Tab**: Manage sub-admins (super_admin only)
- **Bot Tab**: Configure trading bot settings (enable/disable, pricing, trading limits)

## Authentication
Admin access is protected by:
1. **Secret URL**: `/ctrl-x7k9m2p4q8` (not public)
2. **Password Protection**: Server-side verification via X-Admin-Auth header (base64 encoded)
3. Session-based - password remembered in localStorage until browser closes
4. All admin API routes require valid password in X-Admin-Auth header

## Design Guidelines
- All hover effects use `hover-elevate` utility (no custom hover colors)
- All CSS colors use HSL format
- Icons use react-icons (SiSolana, FaXTwitter, FaTelegram) and lucide-react

## Chart Display
- Charts are displayed in an embedded modal within the site
- Uses DexScreener embed with dark theme and black background
- No external navigation required

## Telegram Integration
Real-time token alerts are sent to a Telegram channel when new tokens are verified.

### Setup
1. Create a Telegram bot via @BotFather
2. Create a channel and add the bot as an administrator
3. Set the following environment variables:
   - `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
   - `TELEGRAM_CHANNEL_ID` - Channel ID (e.g., @your_channel_name or -100xxxxxxxxxx)

### Admin API Endpoints
- `POST /api/admin/telegram/test` - Test Telegram connection
- `GET /api/admin/telegram/status` - Check if Telegram is configured

### Features
- Sends token image (if available) with detailed information
- Includes safety score, price, market cap, liquidity, volume
- Links to Dexscreener, Solscan, RugCheck, and social media
- Markdown formatting for better readability
