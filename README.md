# eflix-backend

A high-performance, modular backend REST API for **eflix**, built with **NestJS**, **TypeScript**, **MongoDB (Mongoose)**, and **Passport JWT**.

---

## 🏗️ Architecture

The backend follows NestJS modular architecture and SOLID design principles:

- **AppModule**: The root application module orchestrating global configuration and database connections.
- **AuthModule**: Authentication sub-system managing user registration, credentials validation, and JWT issuing.
- **DTO Validation**: Class-validator decorators integrated with global `ValidationPipe` for automatic payload sanitation and validation.
- **Guards & Strategies**: Passport JWT authentication strategy paired with `JwtAuthGuard` for protecting endpoints.
- **Schemas**: Strongly-typed Mongoose data models with lifecycle hooks and password encryption.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js >= 20
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: MongoDB with [Mongoose](https://mongoosejs.com/)
- **Authentication**: Passport.js + JWT (`@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `bcryptjs`)
- **Validation**: `class-validator`, `class-transformer`
- **Testing**: Vitest

---

## 🚀 Getting Started

### 1. Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/eflix
JWT_SECRET=your_secure_jwt_secret_key_here
CORS_ORIGIN=*
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production build
npm run build

# Run production build
npm run start:prod
```

---

## 📡 API Endpoints

All endpoints are prefixed with `/api`.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | ❌ No |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | ❌ No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | 🔒 Yes (Bearer Token) |

#### Register Payload (`POST /api/auth/register`)
```json
{
  "phoneNumber": "+251911223344",
  "password": "securepassword",
  "username": "johndoe",
  "email": "user@example.com",
  "telegramAccount": "@johndoe"
}
```

#### Login Payload (`POST /api/auth/login`)
```json
{
  "phoneNumber": "+251911223344",
  "password": "securepassword"
}
```

### Movies (`/api/movies`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies` | Get paginated list of movies with search and filters | 🌐 Public |
| `GET` | `/api/movies/:id` | Get single movie by ID | 🌐 Public |
| `POST` | `/api/movies` | Create a new movie | 🔒 Admin only (`Bearer <token>`) |
| `PATCH` | `/api/movies/:id` | Update an existing movie | 🔒 Admin only (`Bearer <token>`) |
| `DELETE` | `/api/movies/:id` | Delete a movie | 🔒 Admin only (`Bearer <token>`) |

#### Pagination & Filter Query Parameters (`GET /api/movies`)
* `page`: Page number (default: `1`, min: `1`)
* `limit`: Items per page (default: `10`, min: `1`, max: `100`)
* `genre`: Filter by genre name (case-insensitive substring match)
* `search`: Case-insensitive search on movie `title` and `description`

Example:
```http
GET /api/movies?page=1&limit=10&genre=Action&search=Inception
```

---

## 🧪 Testing

```bash
# Run unit & integration tests
npm run test

# Run e2e tests
npm run test:e2e
```

---

## 📄 License

MIT
