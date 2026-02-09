# <img src="logo/export.png" alt="Willing Logo" width="30"/> Willing

A platform dedicated to bridging the gap between passionate volunteers and organizations in need. Built for community impact.

## Setup

### Server
```sh
cd server
npm install
npm run migrate
```

### Client
```sh
cd client
npm install
```

## Usage

### Database
```sh
cd server
docker compose up
```

### Server
```sh
cd server
npm start
```

### Client
```sh
cd client
npm start
```

## Tools and Technologies

This project is built using a modern frontend and backend stack with TypeScript, React, Node.js, and PostgreSQL. Below is a breakdown of the technologies and tools used.


## Frontend

- **TypeScript 🔷**  
  - Catches errors early and makes the codebase safer as it grows.  
  - Improves developer experience with autocomplete.

- **React ⚛️**  
  - Allows us to build the UI using reusable components.  
  - Helps manage state efficiently.

- **React Router 🧭**  
  - Handles navigation between pages without reloading the browser.

- **Vite ⚡**  
  - Modern build tool that makes the development server much faster.

- **Tailwind CSS / DaisyUI 🎨**  
  - Faster styling, consistent UI, and less custom CSS.

## Backend

- **TypeScript 🔷**  
  - Catches errors early and makes the backend safer.  
  - Improves developer experience with autocomplete.  
  - **Converting TS to JS:** We write `.ts` code, then run `npm start` which compiles all `.ts` files into `.js` files.

- **Node.js 🌿**  
  - Shares the same language and type system across frontend and backend.  
  - Improves consistency and reduces errors.  
  - Allows server-side execution.

- **Express 🚂**  
  - Lightweight web framework for Node.js.  
  - Helps define routes, handle requests/responses, and structure the backend efficiently.
 
- **Zod ✅**  
  - TypeScript-first schema validation library.  
  - Used to validate and parse data at runtime.  
  - Ensures user inputs and API requests match expected schemas before reaching business logic.

## Database

- **Kysely 📘**  
  - TypeScript-first SQL query builder.  
  - Helps interact with PostgreSQL safely with type checking.

- **PostgreSQL 🐘**  
  - Relational database storing all data for volunteers, admins, and organizations securely and reliably.

- **Adminer 🕵️**  
  - Web-based database management tool for inspecting, querying, and managing PostgreSQL during development.

## Security

- **JWT (JSON Web Token) 🔑**  
  - Used for authentication.  
  - Backend issues a token after login/register which frontend stores and sends with requests to verify identity.

- **Bcrypt 🛡️**  
  - Hashes passwords before storing them in the database.  
  - Makes it much harder for attackers to retrieve plain-text passwords.

## Other Tools

- **Docker 🐳**  
  - Ensures the project runs the same way on every machine.  
  - Eliminates issues like different Node versions, missing dependencies, or OS differences between team members.

- **GitHub Projects 📋**  
  - Used for project management and team coordination.  
  - Helps track tasks, features, bugs, and progress across the team using boards and issues.
