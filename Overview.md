# Nevernote Architecture Overview

This document describes the architecture of the Nevernote application.

## App Specification

The Nevernote application is specified in **Meliora Testlab ALM**, an external requirements management platform. The specification defines *what* to build — business requirements, application logic, UI wireframes, look and feel, and high-level non-functional requirements — while the codebase and its conventions define *how* to build it.

The specification is organized as a requirement tree under project key `NN`. High-level features live under the `F - Features` folder, technical architecture under `T - Technical`, UI view mockups under `V - Views`, and cross-cutting concerns (glossary, code conventions) at the root level. Each requirement has a unique identifier, a descriptive name, and detailed HTML content. Requirements may be targeted to milestones for phased implementation.

UI views are designed in Figma and attached to the specification as both human-readable PNG mockups and machine-readable JSON exports.

The specification is accessed at development time via an MCP server integration (`testlab`), allowing requirements to be queried, searched, and inspected directly from the development workflow. See `CLAUDE.md` for detailed access instructions and workflow conventions.

## Technology Stack

| Layer | Technology                         | Version |
|-------|------------------------------------|---------|
| Framework | Svelte                             | 5.x     |
| Language | TypeScript                         | 5.x     |
| Build Tool | Vite                               | 7.x     |
| Database | sql.js (SQLite WASM)               | latest  |
| Logging | Pino                               | 10.x    |
| Styling | Tailwind CSS                       | 4.x     |
| UI Components | bits-ui + custom wrappers / shadcn | -       |
| Rich Text Editor | TipTap                             | 3.x     |

## Architecture Overview

Nevernote is a **single-page application (SPA)** with local database persistence. All data is stored in the browser using SQLite (via WebAssembly) and persisted to IndexedDB.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│                  (Svelte 5 Components)                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  App.svelte │  │   Routes    │  │ Components  │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      State Layer                            │
│                   (Svelte Stores)                           │
│                                                             │
│  ┌──────────────────────┐  ┌─────────────────┐              │
│  │ <data-reliant>-store │  │  other-store    │              │
│  └────────┬─────────────┘  └─────────────────┘              │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│                (TypeScript Services)                        │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   app-service   │  │  (other svcs)   │                   │
│  └────────┬────────┘  └─────────────────┘                   │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│               (sql.js + IndexedDB)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    database.ts                      │    │
│  │  ┌─────────────┐      ┌─────────────────────────┐   │    │
│  │  │   sql.js    │ ───► │  IndexedDB Persistence  │   │    │
│  │  │  (SQLite)   │      │   (periodic + unload)   │   │    │
│  │  └─────────────┘      └─────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── layout/        # App shell, Sidebar, TopBar, SidebarItem
│   │   ├── common/        # Shared components (CategoryPill, IconButton, UserAvatar)
│   │   ├── notes/         # Note list components (NoteList, NoteListItem, GroupedNoteList)
│   │   ├── views/         # Page-level views (MainView, NoteView)
│   │   ├── ui/            # UI primitives wrapping bits-ui (button, select, input, ...)
│   │   ├── LoginView.svelte
│   │   └── SignUpView.svelte
│   ├── services/          # Business logic (kebab-case.ts)
│   ├── stores/            # Svelte stores (kebab-case.ts)
│   └── db/                # Database layer (kebab-case.ts)
├── app.css                # Global styles + Tailwind theme
├── App.svelte             # Root component
└── main.ts                # Application entry point
```

## Data Flow

1. **User interactions** trigger Svelte component event handlers
2. **Handlers** call store methods (e.g. `notesStore.create()`)
3. **Stores** delegate to service functions for database access
4. **Services** execute database queries via sql.js
5. **Stores** update their reactive state with the results
6. **Reactive subscriptions** update the UI

## Database Schema

The SQLite database contains the following tables:

### `users`
Stores author accounts with credentials.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Unique username |
| password_hash | TEXT | Hashed password |
| display_name | TEXT | Display name |
| is_admin | INTEGER | Admin flag (0/1) |
| created_at | TEXT | Creation timestamp |

### `notes`
Stores note content and metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| title | TEXT | Note title |
| content | TEXT | Note content (HTML) |
| category_id | INTEGER | Foreign key to categories |
| is_pinned | INTEGER | Pin flag (0/1) |
| is_archived | INTEGER | Archive flag (0/1) |
| created_at | TEXT | Creation timestamp |
| updated_at | TEXT | Last update timestamp |

### `categories`
Available category definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Category name |
| color | TEXT | Category color (hex) |

### `invitation_codes`
Registration codes with usage status.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| code | TEXT | Unique invitation code |
| is_used | INTEGER | Usage flag (0/1) |
| used_by | INTEGER | Foreign key to users |
| created_at | TEXT | Creation timestamp |
| used_at | TEXT | Usage timestamp |

### `share_links`
Note sharing tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| note_id | INTEGER | Foreign key to notes |
| token | TEXT | Unique share token |
| created_at | TEXT | Creation timestamp |

### `app_meta`
Application metadata (key-value store).

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Primary key, metadata key |
| value | TEXT | Metadata value |

## Routing

The application uses **hash-based routing** for SPA navigation without server configuration.

Routes are managed via `router-store.ts` which:
- Parses the URL hash on load and hash changes
- Provides `navigate()` and `replace()` methods
- Exposes reactive `currentRoute` derived store

Example routes:
- `#/login` - Login page
- `#/signup` - Sign up page
- `#/main` - Main notes view
- `#/note/:id` - Single note view
- `#/settings` - User settings
- `#/shared/:token` - Shared note view (public)

## Persistence Strategy

1. **sql.js** loads SQLite as WebAssembly in the browser
2. **On initialization**, database is loaded from IndexedDB if it exists
3. **Periodic saves** (every 10 seconds) persist changes to IndexedDB
4. **On page unload**, a final save is attempted
5. **Schema migrations** are handled during initialization

## Styling

- **Dark mode** with Stone color palette
- **Tailwind CSS 4** for utility classes
- **CSS variables** for theming (defined in `app.css`)
- **Inter** font family (with system fallback)

## Authentication

The application uses session-based authentication stored in browser sessionStorage.

### Components

| File | Purpose |
|------|---------|
| `src/lib/services/auth-service.ts` | Login/logout logic, password hashing |
| `src/lib/stores/session-store.ts` | Session state management |
| `src/lib/components/LoginView.svelte` | Login form UI |
| `src/lib/components/SignUpView.svelte` | Sign-up form UI |

### Security

- **Password hashing**: bcryptjs with 10 salt rounds (client-side for demo)
- **Session storage**: sessionStorage (cleared on browser close)
- **Route protection**: Unauthenticated users redirected to login
- **Generic errors**: Login failures don't reveal if email or password was wrong

### Demo Credentials

| User | Email | Password |
|------|-------|----------|
| Demo User | demo@example.com | demon123 |
| Admin | admin@example.com | ademon123 |

### Auth Flow

1. User enters credentials on login page
2. `auth-service.login()` queries database for user
3. Password verified against bcrypt hash
4. On success, user object stored in `sessionStore`
5. `App.svelte` redirects to `/main` based on auth state
6. Logout clears sessionStorage and redirects to `/login`

## Logging

The application uses **Pino** for structured logging with environment-based profiles.

### Configuration

| Mode | Log Level | Output |
|------|-----------|--------|
| Development | `debug` | Verbose, all logs for easy tracing |
| Production | `warn` | Minimal, only warnings and errors |

### Usage

```typescript
import { createLogger } from '$lib/logger';

const log = createLogger('my-module');

log.debug({ data }, 'Debug message');
log.info({ userId }, 'User action');
log.warn({ issue }, 'Warning message');
log.error({ err }, 'Error occurred');
```

### Logged Events

- **Database**: Initialization, schema creation, seeding, persistence, errors
- **Authentication**: Login attempts (success/failure), logout

## Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Application entry point |
| `src/App.svelte` | Root Svelte component |
| `src/app.css` | Global styles and Tailwind theme |
| `src/lib/logger.ts` | Pino logging configuration |
| `src/lib/db/database.ts` | sql.js initialization and persistence |
| `src/lib/stores/database-store.ts` | Database state management |
| `src/lib/stores/session-store.ts` | Session/auth state management |
| `src/lib/stores/router-store.ts` | Hash-based routing |
| `src/lib/stores/note-store.ts` | Note CRUD state management |
| `src/lib/stores/category-store.ts` | Category list state management |
| `src/lib/stores/sidebar-store.ts` | Sidebar UI state (collapsed/expanded) |
| `src/lib/services/app-service.ts` | Application bootstrap and demo data |
| `src/lib/services/auth-service.ts` | Authentication service |
| `src/lib/services/note-service.ts` | Note database operations |
| `src/lib/services/category-service.ts` | Category database operations |
| `src/lib/components/LoginView.svelte` | Login form component |
| `src/lib/components/SignUpView.svelte` | Sign-up form component |
| `src/lib/components/views/MainView.svelte` | Main notes list view |
| `src/lib/components/views/NoteView.svelte` | Note create/edit view |
| `src/lib/components/layout/AppShell.svelte` | App layout shell (sidebar + content) |
| `src/lib/components/layout/Sidebar.svelte` | Sidebar navigation |

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Current Implementation Status

The application currently implements:
1. **Database initialization** - sql.js loads and creates schema
2. **IndexedDB persistence** - Data survives browser refresh
3. **Service layer** - Services for auth, notes, and categories
4. **Svelte stores** - Reactive state management for all domain entities
5. **Hash routing** - Navigation without page reloads
6. **Tailwind styling** - Dark mode with Stone colors
7. **Authentication** - Login and sign-up with bcrypt password hashing
8. **Route protection** - Protected routes redirect to login
9. **Logging** - Pino-based logging with dev/prod profiles
10. **Note CRUD** - Create, edit, pin, archive, and delete notes
11. **Categories** - Notes organized by color-coded categories
12. **Rich text editing** - TipTap-based editor with formatting toolbar
13. **Note sharing** - Share links with unique tokens
14. **Sidebar navigation** - Collapsible sidebar with multiple views (all, recent, by category, pinned)
15. **UI component library** - Reusable components wrapping bits-ui (button, select, input, confirm dialog, etc.)
16. **Keyboard accessibility** - Tab navigation, arrow key navigation in menus/sidebar/toolbar, Escape to close/cancel
17. **Confirmation dialogs** - Discard confirmation when canceling with unsaved edits

### Resetting Demo Data

If you need to reset the database to re-seed demo users:
1. Open browser DevTools
2. Go to Application > IndexedDB
3. Delete the `nevernote-db` database
4. Refresh the page
