# Eflix Microservices Monorepo - Implementation Plan

This implementation plan details how to transition the current standalone backend into a **NestJS Monorepo** that implements the target architecture diagram (REST, gRPC, and RabbitMQ).

---

## 🏗 Target Architecture Overview

```
                        ┌──────────────────┐
                        │     Frontend     │
                        └────────┬─────────┘
                                 │ HTTP / REST
         ┌───────────────┬───────┴────────┬───────────────┐
         ▼               ▼                ▼               ▼
  ┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
  │ User Service ││ Movie Service││ Subscription ││Payment Service│
  └──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘
         │               │               │               │
         │ gRPC          │ gRPC          │               │
         │ (Recommend)   │ (Check Access)│               │
         ▼               └───────►───────┘               │
  ┌──────────────┐                                       │
  │Recommendation│                                       │
  │   Service    │                                       │
  └──────────────┘                                       │
         ▲                                               ▼
         │             Events via RabbitMQ               │
  ═══════╪═══════════════════════════════════════════════╪═══════
         │          ▲                  ▲                 │
         │          │                  │                 │
  ┌──────┴───────┐┌─┴────────────┐┌────┴─────────┐       │
  │  Analytics   ││ Notification ││ Subscription │◄──────┘
  │   Service    ││   Service    ││ (Activates)  │ (Payment Success)
  └──────────────┘└──────────────┘└──────────────┘
```

---

## 📁 Monorepo Folder Structure

When converted, your directory structure will look like this:

```
eflix-backend/
├── apps/
│   ├── user-service/           # User Auth, Profiles (Port 5001)
│   │   └── src/
│   ├── movie-service/          # Movies CRUD, Streaming (Port 5002)
│   │   └── src/
│   ├── subscription-service/   # Plans, Access Check via gRPC (Port 5003 + gRPC 50051)
│   │   └── src/
│   ├── payment-service/        # Checkout & Payments (Port 5004)
│   │   └── src/
│   └── notification-service/   # Background email/event consumer (No HTTP port needed)
│       └── src/
├── libs/
│   └── common/                 # Shared code: DB configs, decorators, proto files
│       └── src/
├── docker-compose.yml          # MongoDB + RabbitMQ
├── nest-cli.json               # Monorepo configuration
├── package.json
└── tsconfig.json
```

---

## 📋 Step-by-Step Implementation Checklist

### Phase 1: Convert to NestJS Monorepo Mode

NestJS has a built-in monorepo generator that automatically refactors your `nest-cli.json` and creates an `apps/` directory.

1. **Convert the project structure:**
   ```bash
   nest generate app user-service
   ```
   *What happens:* NestJS detects you want multiple apps. It automatically moves the root source into `apps/` and updates `nest-cli.json` to monorepo format.

2. **Generate the second service (Movie Service):**
   ```bash
   nest generate app movie-service
   ```

3. **Generate the shared library:**
   ```bash
   nest generate library common
   ```
   *What happens:* Creates `libs/common` with path aliases (e.g., `@app/common`) inside `tsconfig.json`.

4. **Move existing code:**
   - Move `src/auth/*` and `src/users/*` into `apps/user-service/src/`.
   - Move `src/movies/*` into `apps/movie-service/src/`.
   - Move shared guards, decorators (like `@Roles()`, `JwtAuthGuard`) into `libs/common/src/`.

---

### Phase 2: Docker Infrastructure (MongoDB + RabbitMQ)

Update [docker-compose.yml](file:///c:/Users/LENOVO/eflix-backend/docker-compose.yml) so both MongoDB and RabbitMQ run locally:

```yaml
services:
  mongodb:
    image: mongo:7-jammy
    container_name: eflix-mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  rabbitmq:
    image: rabbitmq:3-management
    container_name: eflix-rabbitmq
    restart: always
    ports:
      - "5672:5672"     # AMQP protocol port for NestJS services
      - "15672:15672"   # Management Web UI (http://localhost:15672 - user: guest/guest)

volumes:
  mongo-data:
```

Start the containers:
```bash
docker compose up -d
```

---

### Phase 3: Install Microservices & Communication Packages

Run this in the root folder:
```bash
npm install @nestjs/microservices amqplib amqp-connection-manager @grpc/grpc-js @grpc/proto-loader
```

---

### Phase 4: Event-Driven Communication with RabbitMQ

RabbitMQ connects events without blocking user requests.

#### 1. Configure RabbitMQ Client in `libs/common`
Create a helper module in `libs/common/src/rmq/` so any service can easily publish and listen to events:

```typescript
// libs/common/src/rmq/rmq.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({})
export class RmqModule {
  static register({ name }: { name: string }): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ClientsModule.register([
          {
            name,
            transport: Transport.RMQ,
            options: {
              urls: ['amqp://localhost:5672'],
              queue: `${name}_QUEUE`,
              queueOptions: { durable: false },
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
```

#### 2. Key Events to Implement:
- **`user.created`**:
  - **Publisher:** `user-service` emits after successful user registration.
  - **Subscriber:** `notification-service` listens and sends a welcome email.
- **`payment.success`**:
  - **Publisher:** `payment-service` emits when a checkout completes.
  - **Subscriber:** `subscription-service` listens and activates the user's plan.
  - **Subscriber:** `notification-service` sends a receipt.
- **`movie.viewed`**:
  - **Publisher:** `movie-service` emits when a user streams a title.
  - **Subscriber:** `analytics-service` records telemetry.

---

### Phase 5: High-Speed Synchronous Check via gRPC

When a user clicks "Play", `movie-service` must synchronously check if the user has an active subscription.

#### 1. Define Protobuf Contract (`libs/common/src/proto/subscription.proto`)
```protobuf
syntax = "proto3";

package subscription;

service SubscriptionRpcService {
  rpc CheckAccess (CheckAccessRequest) returns (CheckAccessResponse);
}

message CheckAccessRequest {
  string userId = 1;
}

message CheckAccessResponse {
  bool hasAccess = 1;
  string planType = 2;
}
```

#### 2. Implement the gRPC Server in `subscription-service`:
In `apps/subscription-service/src/main.ts`:
```typescript
app.connectMicroservice({
  transport: Transport.GRPC,
  options: {
    package: 'subscription',
    protoPath: join(__dirname, '../../libs/common/src/proto/subscription.proto'),
    url: '0.0.0.0:50051',
  },
});
await app.startAllMicroservices();
```

#### 3. Call gRPC from `movie-service`:
Before serving a movie stream:
```typescript
const response = await this.subscriptionRpcService.checkAccess({ userId });
if (!response.hasAccess) {
  throw new ForbiddenException('Active subscription required to watch this movie');
}
```

---

### Phase 6: How to Run and Test During Development

Each service can be run independently in watch mode:

```bash
# Terminal 1: Run User Service on Port 5001
nest start user-service --watch

# Terminal 2: Run Movie Service on Port 5002
nest start movie-service --watch

# Terminal 3: Run Subscription Service on Port 5003 + gRPC 50051
nest start subscription-service --watch

# Terminal 4: Run Notification Service
nest start notification-service --watch
```

---

## 🚀 Recommended Execution Order for You

1. Run `nest generate app user-service` to initialize monorepo mode.
2. Run `nest generate app movie-service`.
3. Run `nest generate library common`.
4. Move current code from `src/` into the respective `apps/` folders.
5. Add RabbitMQ to `docker-compose.yml` and run `docker compose up -d`.
6. Start `user-service` with `nest start user-service --watch` and verify it runs.
