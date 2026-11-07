# Eflix Microservices Platform — Implementation Plan & Status

> **Last Updated:** November 5, 2026  
> **Status:** Architecture Migration Complete | Core Business Logic Wired | Real Integrations In Progress

---

## 📊 Executive Status Dashboard

| Service | Port / Protocol | Database | Core Logic | External Integrations | Overall Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Service** | HTTP `5001` | MongoDB (`User`) | ✅ Auth (Register, Login, Profile) | ✅ RabbitMQ Publisher (`user.created`) | 🟢 **100% Done** |
| **Movie Service** | HTTP `5002` | MongoDB (`Movie`) | ✅ Full CRUD, Search, Pagination | ✅ gRPC Access Check, YouTube Embedding on `/play` | 🟢 **100% Done** |
| **Subscription Service** | HTTP `5003` + gRPC `50051` | MongoDB (`Plan`, `Subscription`, `GuestUsage`) | ✅ Plan CRUD, Access Quota Check, Cancellation | ✅ gRPC Server, RabbitMQ Activation | 🟢 **100% Done** |
| **Payment Service** | HTTP `5004` | MongoDB (`PaymentTransaction`) | ✅ Chapa Checkout, Webhook Handler | ✅ Real Gateway Call, RabbitMQ Activation | 🟢 **100% Done** |
| **Notification Service** | RabbitMQ Consumer | N/A (Stateless) | ⚠️ Receives Events | ❌ Mocked Console Logs (No Email/SMS/Telegram) | 🟡 **40% Done** |
| **Analytics Service** | TBD | ❌ None | ❌ Not started | ❌ Not started | ⚪ **0% (Not Started)** |
| **Recommendation Service**| gRPC TBD | ❌ None | ❌ Not started | ❌ Not started | ⚪ **0% (Not Started)** |

---

## 🔍 In-Depth Service Breakdown: What Is Done vs. What Is Left

### 1. User Service (`apps/user-service`)
- **✅ What is DONE:**
  - Password hashing via `bcryptjs`.
  - JWT token generation & validation with `@app/common` guards.
  - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
  - Publishes `user.created` event payload to RabbitMQ (`NOTIFICATION_SERVICE`).
  - Mongoose `User` schema storing `email`, `phoneNumber`, `telegramAccount`, `role`.
- **❌ What is LEFT:**
  - Password reset / forgot password flow (requires email/SMS from Notification Service).
  - Refresh tokens (optional production hardening).

---

### 2. Movie Service (`apps/movie-service`)
- **✅ What is DONE (100% Complete):**
  - MongoDB `Movie` schema with `title`, `genre`, `releaseYear`, `videoUrl` (YouTube URL), `duration`, and `description`.
  - Admin-only routes with `RoleGuard` + `JwtAuthGuard`: `POST`, `PATCH`, `DELETE /api/movies`.
  - Public routes: `GET /api/movies` with regex search and pagination.
  - Streaming check: `GET /api/movies/:id/play` connects via **gRPC** to `subscription-service` (`SubscriptionRpcService.CheckAccess`).
  - Gated playback: Returns the movie's YouTube `videoUrl` only if gRPC access is approved (Frontend embeds it in an `iframe`).
  - Auto-normalizes YouTube URLs (`watch?v=`, `youtu.be/`) into iframe-ready `/embed/` links.
  - Emits `movie.created` event payload to RabbitMQ (`NOTIFICATION_SERVICE`).
- **❌ What is LEFT:**
  - None for core playback.

---

### 3. Subscription Service (`apps/subscription-service`)
- **✅ What is DONE (100% Complete):**
  - Dynamic **Plan Schema** (`Plan`): Admin creates plans with custom duration, price, currency (ETB), type (MONTHLY, YEARLY, PPV).
  - Dynamic **Subscription Schema** (`Subscription`): Tracks `userId`, `plan`, `endDate`, `status` (ACTIVE, CANCELLED, EXPIRED).
  - Dynamic **Guest Usage Schema** (`GuestUsage`): Tracks guest device ID + IP address, enforcing a **10 free movies/month** quota.
  - Dual-transport server: REST on port `5003` + gRPC on port `50051`.
  - Admin endpoints: `POST /api/subscriptions/plans`, `GET /api/subscriptions/plans/all`, `PATCH /api/subscriptions/plans/:id`, `DELETE /api/subscriptions/plans/:id?hard=true`.
  - User endpoints: `GET /api/subscriptions/plans`, `GET /api/subscriptions/my`, `POST /api/subscriptions/subscribe`, `POST /api/subscriptions/cancel`.
  - gRPC `CheckAccess` handler: Distinguishes between unlimited subscriptions, Pay-Per-View rentals, and guest quota.
  - RabbitMQ Consumer: Listens for `payment.success` and auto-activates subscriptions.
- **❌ What is LEFT:**
  - Nothing for core subscription logic. Optional: background cron job to mark expired subscriptions.

---

### 4. Payment Service (`apps/payment-service`)
- **✅ What is DONE (100% Complete for Phase 1 - Chapa):**
  - MongoDB connection & **`PaymentTransaction` schema**: Stores `txRef`, `userId`, `planId`, `amount`, `currency`, `provider` (CHAPA/TELEBIRR), `status` (PENDING, COMPLETED, FAILED), and `paymentUrl`.
  - **`POST /api/payments/checkout`**: Initializes transaction with Chapa API (`https://api.chapa.co/v1/transaction/initialize`) and returns checkout URL.
  - **`POST /api/payments/webhook`**: Asynchronous webhook receiver. Validates `txRef`, marks transaction `COMPLETED`, and emits `payment.success` to RabbitMQ.
  - RabbitMQ publishers: Successfully notifies `subscription-service` (for activation) and `notification-service` (for receipts).
- **❌ What is LEFT for Phase 2:**
  - Direct Telebirr API integration (telebirr H5/SDK).

---

### 5. Notification Service (`apps/notification-service`)
- **✅ What is DONE:**
  - RabbitMQ microservice listening to `notification_service_queue`.
  - Event patterns wired: `@EventPattern('user.created')`, `@EventPattern('movie.created')`, `@EventPattern('payment.success')`.
- **❌ What is LEFT:**
  - **Real Email Dispatcher**: Replace `this.logger.log` with Nodemailer (SMTP / Gmail) or Resend / SendGrid API.
  - **Real SMS Dispatcher**: Integrate SMS provider (e.g., Twilio or Ethiopian SMS gateway) for phone verification / alerts.
  - **Real Telegram Bot**: Connect to Telegram Bot API to notify users via their `telegramAccount`.

---

### 6. Analytics Service (`apps/analytics-service`)
- **❌ Not Started:**
  - Needs to consume `movie.watched` events from `movie-service`.
  - Aggregates view counts, popular genres, watch time.
  - Exposes metrics for admin dashboard and Recommendation Service.

---

### 7. Recommendation Service (`apps/recommendation-service`)
- **❌ Not Started:**
  - gRPC service providing movie recommendations based on user watch history and genre preferences.

---

## 🛠️ Step-by-Step Action Plan to Complete the System

### Phase 1: Build the Real Payment Service (Priority #1)
1. **Add MongoDB to Payment Service**:
   - Install/wire `MongooseModule` in `apps/payment-service/src/payment-service.module.ts`.
2. **Create `PaymentTransaction` Schema**:
   - Fields: `userId`, `planId`, `amount`, `currency`, `provider` (CHAPA/TELEBIRR), `txRef`, `status` (`PENDING`, `COMPLETED`, `FAILED`), `paymentUrl`.
3. **Integrate Payment Provider API (Chapa)**:
   - Call `https://api.chapa.co/v1/transaction/initialize` with user email, phone, and amount.
   - Return checkout URL to frontend.
4. **Implement Webhook Endpoint (`POST /api/payments/webhook`)**:
   - Verify Chapa secret signature hash.
   - Update transaction status to `COMPLETED`.
   - Publish verified `payment.success` event to RabbitMQ.

---

### Phase 2: Connect Real Email / Notification Providers (Priority #2)
1. **Configure Nodemailer / Resend in Notification Service**:
   - Send branded welcome email on `user.created`.
   - Send receipt email with invoice details on `payment.success`.
   - Send new release newsletter on `movie.created`.

---

### Phase 3: Analytics & Recommendation Services (Priority #3)
1. Scaffold `apps/analytics-service` using `npx nest g app analytics-service`.
2. Emit `movie.streamed` from `movie-service` -> store view records in Analytics.
3. Build gRPC endpoint for recommendations.
