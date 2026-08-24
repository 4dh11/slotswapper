# SlotSwapper

**SlotSwapper** is a full-stack web application that allows users to manage their schedules and exchange time slots with other users.

The application provides a calendar-based interface where users can create events, mark them as available for swapping, browse other users' available slots, and send or respond to swap requests.

The project focuses on reliable backend operations, database transactions, authentication, and handling concurrent swap requests safely.

## Features

* User registration and login
* JWT-based authentication
* Secure password hashing
* Create, view, update, and delete calendar events
* Mark events as `BUSY` or `SWAPPABLE`
* Browse available slots from other users
* Send swap requests
* Accept or reject swap requests
* Track swap request status
* Protected API routes
* PostgreSQL relational database
* Prisma ORM for database access
* Transaction-based swap operations
* Frontend state management and API integration
* Responsive calendar-based interface

## Tech Stack

### Frontend

* React
* Vite
* React Router
* TanStack React Query
* Axios
* Day.js
* React Icons

### Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT
* bcryptjs

### Development

* Git & GitHub
* npm
* REST APIs

## Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │                     │
                    │ Calendar / Events   │
                    │ Swap Requests       │
                    │ Authentication      │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │                     │
                    │ Routes              │
                    │ Middleware          │
                    │ Business Logic      │
                    │ Authentication      │
                    └──────────┬──────────┘
                               │
                               │ Prisma ORM
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │                     │
                    │ Users               │
                    │ Events              │
                    │ Swap Requests       │
                    └─────────────────────┘
```

## Project Structure

```text
SlotSwapper/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── ...
│   │
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── routes/
│   │   └── server.js
│   │
│   ├── api-tests.http
│   ├── package.json
│   └── prisma.config.ts
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Database Design

The application uses PostgreSQL with Prisma ORM.

### User

Stores account and authentication information.

```text
User
├── id
├── name
├── email
└── password
```

Each user can own multiple events and can send or receive multiple swap requests.

### Event

Represents a calendar time slot.

```text
Event
├── id
├── title
├── startTime
├── endTime
├── status
└── userId
```

Event statuses:

```text
BUSY
SWAPPABLE
SWAP_PENDING
```

### Swap Request

Represents a request to exchange two time slots.

```text
SwapRequest
├── id
├── status
├── mySlotId
├── theirSlotId
├── requesterId
├── recipientId
└── createdAt
```

Swap request statuses:

```text
PENDING
ACCEPTED
REJECTED
```

## Concurrency & Transactions

One of the main backend challenges in SlotSwapper is ensuring that the same time slot cannot be successfully swapped by multiple users at the same time.

For example:

```text
User A ──────┐
             ├──> Same available slot
User B ──────┘
```

Without proper transaction handling, both requests could potentially read the slot as available before either request updates it.

SlotSwapper handles critical swap operations using **database transactions** so that related updates succeed or fail together.

A swap operation involves multiple database changes, such as:

1. Validating the requested slots.
2. Checking their current availability.
3. Creating or updating the swap request.
4. Updating the relevant event states.
5. Committing the changes atomically.

If an operation fails, the transaction can be rolled back instead of leaving the database in an inconsistent state.

This makes the swap workflow safer when multiple users interact with the same slots concurrently.

## Authentication

SlotSwapper uses JWT-based authentication.

The authentication flow is:

```text
Register
   │
   ▼
Password hashed with bcrypt
   │
   ▼
User stored in PostgreSQL
   │
   ▼
Login
   │
   ▼
Credentials verified
   │
   ▼
JWT generated
   │
   ▼
Protected API requests
```

Passwords are never stored as plain text. The backend uses `bcryptjs` for password hashing.

Protected routes verify the user's JWT before allowing access to user-specific resources.

## API Overview

The backend exposes REST APIs for authentication, events, and swap requests.

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
```

### Events

```text
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
```

### Swap Requests

```text
GET    /api/swap/marketplace
GET    /api/swap/my-swappable
POST   /api/swap/request
GET    /api/swap/incoming
GET    /api/swap/outgoing
POST   /api/swap/respond/:id
```

The exact API routes are implemented inside the backend `routes` and `modules` directories.

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL
* Git

### 1. Clone the repository

```bash
git clone https://github.com/4dh11/SlotSwapper.git
cd SlotSwapper
```

## 2. Configure PostgreSQL

Create a PostgreSQL database for the project.

For example:

```sql
CREATE DATABASE slotswapper;
```

Make sure PostgreSQL is running before starting the backend.

## 3. Configure Backend Environment Variables

Navigate to the backend:

```bash
cd backend
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/slotswapper"
JWT_SECRET="your-secret-key"
PORT=5000
```

Replace `USERNAME` and `PASSWORD` with your PostgreSQL credentials.

Do not commit your `.env` file to GitHub.

## 4. Install Backend Dependencies

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npm run migrate
```

If seed data is available/configured:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

The backend will start on the configured port.

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

Vite will provide the local development URL in the terminal, typically:

```text
http://localhost:5173
```

## Available Backend Commands

From the `backend` directory:

```bash
npm run dev
```

Starts the backend in development mode.

```bash
npm start
```

Starts the backend normally.

```bash
npm run migrate
```

Runs Prisma database migrations.

```bash
npm run seed
```

Seeds the database.

```bash
npm run studio
```

Opens Prisma Studio for viewing and managing database records.

## Available Frontend Commands

From the `frontend` directory:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint.

## Application Workflow

### 1. Create an Account

A new user registers with their name, email, and password.

### 2. Login

The user logs into the application and receives an authenticated session.

### 3. Create a Time Slot

The user creates a calendar event containing:

* Event title
* Start time
* End time

New events are initially treated as unavailable/busy.

### 4. Make a Slot Swappable

A user can mark an event as `SWAPPABLE`.

This makes the slot visible to other users looking for available slots.

### 5. Browse Available Slots

Users can view swappable slots belonging to other users.

### 6. Send a Swap Request

A user selects one of their slots and requests an exchange with another user's available slot.

### 7. Respond to the Request

The recipient can:

* Accept the request
* Reject the request

When a swap is accepted, the backend performs the necessary database updates as part of the swap operation.

## Key Backend Concepts

### Prisma ORM

Prisma provides a type-safe interface between the Express backend and PostgreSQL database.

Instead of writing raw SQL for every operation, the backend can interact with database models through Prisma Client.

Example:

```javascript
const events = await prisma.event.findMany({
    where: {
        userId: userId
    }
});
```

### Database Transactions

Critical operations that require multiple database changes are handled using transactions.

Conceptually:

```text
BEGIN TRANSACTION

Validate slots
      ↓
Create/update swap request
      ↓
Update event status
      ↓
Commit

If anything fails:
      ↓
ROLLBACK
```

This prevents partially completed swap operations.

## Future Improvements

Potential improvements include:

* Real-time notifications for swap requests
* Email notifications
* Calendar integrations
* Advanced event conflict detection
* Recurring events
* Refresh token authentication
* Improved concurrency controls
* Automated testing
* Deployment with CI/CD
* Mobile application support

## License

This project is developed for educational and project purposes.

## Author

**Adityaa S S**

GitHub:
https://github.com/4dh11

Project Repository:
https://github.com/4dh11/SlotSwapper
