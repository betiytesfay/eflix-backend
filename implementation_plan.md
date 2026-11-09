# Eflix Backend — Roadmap & Status

## 1. Services Overview

| Service | Port | Status | Core Responsibility |
| :--- | :--- | :--- | :--- |
| **user-service** | `5001` | In Progress | Auth, User Profiles, Admin Management |
| **movie-service** | `5002` | Complete | Movie CRUD, Streaming Check, YouTube Embed |
| **subscription-service** | `5003` / `50051` | Complete | Plans, Subscriptions, Guest Quotas (gRPC) |
| **payment-service** | `5004` | Complete | Chapa Checkout & Webhook Integration |
| **notification-service** | RabbitMQ | Functional | Event Logging (Email/SMS pending) |

---

## 2. Current Sprint: User Service Expansion

- [ ] **Flexible Login**
  - Allow login with either `phoneNumber` OR `email` + `password`.
- [ ] **Password Management**
  - `POST /api/auth/forgot-password` (emits reset event to RabbitMQ).
  - `POST /api/auth/reset-password` (validates reset code/token).
  - `POST /api/auth/change-password` (for logged-in users).
- [ ] **Profile Management**
  - `PATCH /api/auth/profile` (update username, email, telegram).
- [ ] **Admin User Management**
  - `GET /api/users` (list users with pagination & search).
  - `PATCH /api/users/:id/role` (promote/demote user roles).
  - `DELETE /api/users/:id` (remove user account).

---

## 3. Completed Architecture Highlights

- **Streaming Access Flow**:
  - `GET /api/movies/:id/play` calls `SubscriptionRpcService.CheckAccess` via gRPC.
  - Automatically handles guest limit (10 free movies) and active subscriptions.
  - Normalizes YouTube URLs to iframe-embed format.
- **Payment & Activation Flow**:
  - `POST /api/payments/checkout` creates Chapa checkout session.
  - `POST /api/payments/webhook` verifies payment and emits `payment.success` via RabbitMQ.
  - `subscription-service` consumes `payment.success` and activates the subscription instantly.
