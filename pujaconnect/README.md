# PujaConnect — Puja Booking Admin Dashboard

A responsive MERN-style admin dashboard for managing puja bookings.

## Features
- JWT admin login and protected booking APIs
- Dashboard metrics and revenue summary
- Search, status/puja/date filters, sorting and pagination
- Booking detail modal and status history
- Create booking form
- MongoDB persistence with Mongoose
- Input validation, centralized API errors, password hashing
- Responsive interface

## Requirements
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Run locally

### 1. Backend
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```
The API runs at `http://localhost:5000`.

Seed admin credentials:
- Email: `admin@pujaconnect.com`
- Password: `PujaAdmin@123`

Change these credentials and `JWT_SECRET` before deploying.

### 2. Frontend
In another terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL (normally `http://localhost:5173`).

## Environment
Set `MONGO_URI`, `JWT_SECRET`, `PORT`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`.

## API overview
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/bookings` — search/filter/sort/paginate
- `GET /api/bookings/stats`
- `GET /api/bookings/:id`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/status`

All booking routes require `Authorization: Bearer <token>`.

## Suggested production improvements
Use HTTPS, rotate secrets, configure CORS to the deployed frontend origin, add rate limiting and audit logging, back up MongoDB, and integrate a real payment gateway only through its verified server-side workflow. Do not store card data.
