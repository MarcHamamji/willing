# AGENTS.md

This file gives coding agents project-specific instructions for working in this repository.

## Project Overview

Willing is a full-stack TypeScript app:

- `client/`: React + Vite + React Router + Tailwind + DaisyUI
- `server/`: Express + Kysely + PostgreSQL + Zod

The server runs DB migrations automatically on startup in development mode.

## Repository Map

- `client/src/main.tsx`: route tree and page wiring
- `client/src/auth/*`: auth context, guards, user hooks
- `client/src/utils/requestServer.ts`: shared HTTP helper (includes JWT support)
- `client/src/utils/formUtils.tsx`: reusable form components (`FormField`, `FormRootError`, helpers)
- `client/src/schemas/auth.ts`: client-side form schemas

- `server/src/api/index.ts`: API router mounting (`/user`, `/admin`, `/organization`, `/volunteer`)
- `server/src/api/authorization.ts`: JWT parsing + role guard middleware
- `server/src/api/routes/**`: domain route handlers
- `server/src/db/tables.ts`: canonical Zod schemas + TS types for DB entities
- `server/src/db/migrations/*`: ordered SQL schema evolution
- `server/src/scripts/seed.ts`: dev seed data

## Setup and Run Commands

Run from repository root unless noted.

### Database

```bash
cd server
docker compose up -d
```

If `npm start` fails with migration `AggregateError`, check Postgres is listening on `5432`.

### Server

```bash
cd server
npm install
npm start
```

Useful server scripts:

- `npm run dev` (nodemon)
- `npm run migrate`
- `npm run seed`
- `npm run create-admin`
- `npm run lint`

### Client

```bash
cd client
npm install
npm start
```

Useful client scripts:

- `npm run build`
- `npm run lint`

## Core Engineering Rules

1. Reuse canonical schemas and types from `server/src/db/tables.ts`.
2. Do not recreate table schemas manually in route files or forms if reusable schema composition works.
3. Prefer schema composition (`omit`, `pick`, `extend`, `partial`) over duplicating validation logic.
4. For protected client API calls, use `requestServer(path, options)`.
5. Do not hardcode user IDs. Use auth context on client and `req.userJWT!.id` on server.
6. Keep response and payload shapes consistent across client and server.
7. Keep changes minimal and targeted; avoid unrelated refactors.

## Type Safety Requirements

**This project is VERY STRICT with types.** All API responses must be properly typed.

### Backend Type Rules

1. **Every route module must have a corresponding `.types.ts` file** in the same directory.
2. Each `.types.ts` file must export TypeScript types for **all JSON responses** returned by routes in that module.
3. Response types should be named with a `*Response` suffix (e.g., `GetUserResponse`, `CreatePostingResponse`).
4. **All `.types.ts` files must be imported and re-exported** in `server/src/api/types.ts` for centralized access.

### Frontend Type Rules

1. **IN ALL CASES**, when calling `requestServer()`, the frontend must pass the appropriate `*Response` type from `server/src/api/types.ts`.
2. Never use `any` or untyped responses for API calls. Never create separate client-side types that mirror server responses; always reuse the server-defined types for consistency.
3. Import response types from `server/src/api/types` using relative paths (e.g., `../../../server/src/api/types` from `client/src/auth/` or `../../../../server/src/api/types` from `client/src/pages/*/`).

## Client Form Conventions

1. **Always** use `react-hook-form` with `zodResolver(schema)` for form validation.
2. Wrap form submissions in `executeAndShowError(form, async () => {...})` from `formUtils.tsx` for consistent error handling.
3. Reuse and compose server schemas from `server/src/db/tables.ts` for client-side validation.
4. Use reusable form primitives from `client/src/utils/formUtils.tsx` (`FormField`, `FormRootError`).
5. Import response types from server using relative paths (e.g., `../../../../server/src/api/types`).
6. Keep existing DaisyUI/Tailwind visual language unless explicitly asked to redesign.
7. Handle loading, error, and success states explicitly.

## Reusable Components

All components are in `client/src/components/`. **Use these instead of recreating similar logic.**

### Layout & Navigation

- **`ColumnLayout`**: Responsive column layout with a sidebar and main content. Sidebar can be made sticky via `stickySidebar` prop (prefer true for most pages). Use for pages with side panels.
- **`Navbar`**: Standard top navbar with logo on left, optional `center` and `right` content slots. Sticky positioned. Use for all page headers.
- **`PageHeader`**: Reusable page header component with title, optional subtitle, optional back button, and optional action buttons. Props:
  - `title` (required): Main page title
  - `subtitle` (optional): Description text below title
  - `backTo` (optional): Navigation path for back button. Only include for pages not directly linked from navbar (e.g., posting detail pages)
  - `actions` (optional): ReactNode for action buttons (Edit, Save, Delete, etc.) displayed on the right
  - `icon` (optional): Lucide icon component to display before the title
  - `badge` (optional): ReactNode to display as a badge (e.g., counts, status) to the right of title section
  - Use for all pages with consistent title layouts. Omit `backTo` for navbar-linked pages (home, settings, profile).
- **`Footer`**: Standard footer with company info, contact email, and GitHub link. Use at bottom of main pages.

### Display Components

- **`Loading`**: DaisyUI loading spinner with configurable size (`xs`, `sm`, `md`, `lg`, `xl`). Use for loading states in buttons and pages.
- **`PostingCard`**: Display card for volunteer opportunity postings. Shows title, description, location, start/end dates, max volunteers, minimum age, and required skills. Accepts optional `footer` ReactNode for action buttons. Use for listing volunteer postings.
- **`SkillsList`**: Display skills as colored badges. Supports expandable view when more than `limit` skills (default 5). Can accept optional `action` render prop for per-skill actions (e.g., remove button). Use `enableLimit={false}` to show all skills.

### Form Components

- **`PasswordResetCard`**: Complete password reset form with current/new/confirm password fields. Integrates with `AuthContext`. Handles validation and success/error states. Use in settings pages.
- **`SkillsInput`**: Input field with add button for building a skill list. Supports Enter key to add. Displays current skills using `SkillsList` with remove buttons. Controlled via `skills` and `setSkills` props.
- **`ToggleButton`**: Form-integrated toggle button group for react-hook-form. Supports two modes:
  - **Compact mode** (`compact={true}`): Horizontal joined buttons, minimal styling
  - **Full mode** (default): Larger cards with icons and descriptions
  - Each option can have `value`, `label`, `description`, `Icon`, and `btnColor` properties
  - Automatically integrates with form state via `form` and `name` props

### Interactive Components

- **`LocationPicker`**: Interactive map with Leaflet and React-Leaflet for selecting geographic locations. Features:
  - Draggable marker for precise positioning
  - Search bar with geocoding (limited to Lebanon)
  - Click-to-place marker (when not `readOnly`)
  - Custom zoom controls
  - Dark theme support
  - Accepts `position` ([lat, lng]), `setPosition` callback, and optional `readOnly` flag
  - The `setPosition` callback receives optional `name` parameter when location selected via search

## Backend Conventions

1. Route modules should live under `server/src/api/routes/<domain>/`.
2. **Always** annotate route handlers with explicit response types: `async (req, res: Response<TypeNameResponse>) => {...}`.
3. **All TypeScript imports must use `.js` extensions** (for ESM compatibility), e.g., `import x from './file.js'`.
4. Validate request bodies with Zod **at the start** of each route: `const body = schema.parse(req.body)`.
5. When throwing errors, **set status code first**: `res.status(403); throw new Error('message');`.
6. Enforce auth with `authorizeOnly(...)` middleware where needed.
7. Access authenticated user ID via `req.userJWT!.id`.
8. Keep DB operations typed via Kysely and shared table types.
9. Never return `{success: true}` in responses. Success status is inferred by the HTTP status code.
10. Never manually call `res.error({/* ... */})`. Instead, throw an error and let the error handler middleware catch it.

## Schema & Type Patterns

1. **Always export both the Zod schema and its inferred TypeScript type:**
   ```typescript
   export const mySchema = zod.object({...});
   export type MyType = zod.infer<typeof mySchema>;
   ```
2. **Prefer schema composition over duplication:**
   - For new entity schemas: `newEntitySchema = entitySchema.omit({ id: true })`
   - For public data: `entityWithoutPasswordSchema = entitySchema.omit({ password: true })`
3. **Reuse canonical schemas from `server/src/db/tables.ts`** in both server routes and client forms.
4. Never recreate table schemas manually when schema composition works.

## Embeddings Scope (Current)

1. Implement embeddings only for currently-backed DB fields and tables.
2. Do not add new domain tables just to support embeddings (e.g. no ad-hoc `volunteer_experience` table) unless explicitly requested in a dedicated DB task.
3. CV is currently a link-only concept; CV text extraction is deferred until CV storage is implemented.
4. When CV extraction is implemented, use a PDF parsing library server-side to extract text from the linked PDF, then feed extracted text into embedding generation.
5. Until experience entities are implemented in DB, do not generate or recompute experience-derived embeddings from synthetic or temporary tables.
6. Vector definitions in current schema:
   `organization_account.org_vector`: embedding of organization profile fields.
   `organization_posting.opportunity_vector`: embedding of posting fields and skills.
   `organization_posting.posting_context_vector`: normalized weighted combination of posting + organization vectors (70/30).
   `volunteer_account.profile_vector`: embedding of volunteer profile fields, skills, and parsed CV text (if available).
   `volunteer_account.experience_vector`: weighted aggregation from attended posting context vectors (latest-first, max 10).

## Migration Rules

1. Never modify old migrations that have likely been applied.
2. Add a new numbered migration file for schema changes (continue sequence in `server/src/db/migrations/`).
3. When adding/removing DB fields:
   - Update migration(s)
   - Update `server/src/db/tables.ts`
   - Update affected insert paths (e.g., signup flows, seed scripts)
4. Verify migration success locally after DB is running.

## Verification Checklist

Before finishing code changes:

1. Client type/build check:
   ```bash
   cd client && npm run type:check && npm run lint:check
   ```
2. Server type check:
   ```bash
   cd server && npm run type:check && npm run lint:check
   ```
3. If backend behavior changed, run server and validate endpoint flow manually.
4. If DB-dependent checks fail due to DB down, state it explicitly and include the exact command needed.

## Notes for Agents

AGENTS.md files may exist at multiple levels. The most specific one in the directory tree takes precedence for files under its scope.
