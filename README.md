# User Management Microservice

A simple Node.js microservice for user management with PostgreSQL persistence and Redis caching.

## Features

- CRUD operations for users
- Pagination for user listing
- Full-text search by name or email
- Redis caching for list, search, and individual user reads
- Environment validation at startup

## Run locally

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the service:
   ```bash
   npm start
   ```

## Docker

Run the stack with Docker Compose:

```bash
docker compose up --build
```

This starts:

- `user-service` on port `3000`
- `postgres`
- `redis`

## Scripts

- `npm start` – run the service
- `npm run dev` – run with `nodemon`
- `npm run migrate` – create `users` table
- `npm run seed` – insert seed users

## Endpoints

- `GET /health`
- `GET /users`
- `GET /users/search?q=example`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
