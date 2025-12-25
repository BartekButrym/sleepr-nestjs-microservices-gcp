# PostgreSQL + Prisma Implementation Branch

## 📋 Description

The `postgres-and-prisma` branch contains an implementation using **PostgreSQL** as the database and **Prisma** as a modern ORM (Object-Relational Mapping). Prisma offers type-safe database access, automatic TypeScript type generation, and an intuitive query language.

## 🎯 Main Differences from `main` Branch

### 1. Database

- **main branch**: MongoDB (NoSQL)
- **postgres-and-prisma branch**: PostgreSQL (SQL)

### 2. ORM/ODM

- **main branch**: Mongoose (ODM for MongoDB)
- **postgres-and-prisma branch**: Prisma (modern ORM)

### 3. Schema Definition

- **main branch**: Mongoose Schemas (TypeScript decorators)
- **postgres-and-prisma branch**: Prisma Schema (own DSL - Domain Specific Language)

### 4. Additional Dependencies

```json
{
  "@prisma/client": "^5.7.0",
  "prisma": "^5.7.0"
}
```

## 🏗️ Architecture

```
┌─────────────────┐
│  Reservations   │
│    Service      │
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │PostgreSQL│
    │ Database │
    └──────────┘

┌─────────────────┐
│     Auth        │
│    Service      │
└────────┬────────┘
         │
         ▼
    ┌──────────┐
    │PostgreSQL│
    │ Database │
    └──────────┘
```

## 🔧 Configuration

### Prisma Schema - Reservations (apps/reservations/prisma/schema.prisma)

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Reservation {
  id        Int      @id @default(autoincrement())
  timestamp DateTime @default(now())
  startDate DateTime
  endDate   DateTime
  userId    Int
  invoiceId String

  @@map("reservations")
}
```

### Prisma Schema - Auth (apps/auth/prisma/schema.prisma)

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  password String
  roles    String[]

  @@map("users")
}
```

### Prisma Service (apps/reservations/src/prisma.service.ts)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Reservations Service (using Prisma Client)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservationDto: CreateReservationDto) {
    return this.prisma.reservation.create({
      data: {
        ...createReservationDto,
        timestamp: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.reservation.findMany();
  }

  async findOne(id: number) {
    return this.prisma.reservation.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  async remove(id: number) {
    return this.prisma.reservation.delete({
      where: { id },
    });
  }
}
```

### Reservations Module

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { LoggerModule, AUTH_SERVICE, PAYMENTS_SERVICE } from '@app/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().required(),
        AUTH_HOST: Joi.string().required(),
        AUTH_PORT: Joi.number().required(),
        PAYMENTS_HOST: Joi.string().required(),
        PAYMENTS_PORT: Joi.number().required(),
      }),
    }),
    // ... ClientsModule for inter-service communication
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, PrismaService],
})
export class ReservationsModule {}
```

### Prisma Config (apps/reservations/prisma.config.ts)

```typescript
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export default {
  datasources: {
    db: {
      url: configService.get<string>('DATABASE_URL'),
    },
  },
};
```

## 🚀 Running the Application

### 1. Switch to PostgreSQL + Prisma Branch

```bash
git checkout postgres-and-prisma
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run PostgreSQL (Docker Compose)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sleepr
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 4. Update Environment Variables

**apps/reservations/.env**
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/sleepr_reservations?schema=public"
PORT=3000
AUTH_HOST=auth
AUTH_PORT=3001
PAYMENTS_HOST=payments
PAYMENTS_PORT=3003
```

**apps/auth/.env**
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/sleepr_auth?schema=public"
PORT=3001
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
```

### 5. Generate Prisma Client

```bash
# For Reservations service
cd apps/reservations
npx prisma generate

# For Auth service
cd apps/auth
npx prisma generate
```

### 6. Run Migrations

```bash
# For Reservations service
cd apps/reservations
npx prisma migrate dev --name init

# For Auth service
cd apps/auth
npx prisma migrate dev --name init
```

### 7. Run the Application

```bash
# Docker Compose
docker compose up --build

# Or locally
npm run start:dev reservations
npm run start:dev auth
npm run start:dev payments
npm run start:dev notifications
```

## 📊 Prisma Migrations

### Create Migration

```bash
# Development
npx prisma migrate dev --name add_user_profile

# Production
npx prisma migrate deploy
```

### Reset Database (development)

```bash
npx prisma migrate reset
```

### Migration Status

```bash
npx prisma migrate status
```

### Example Migration (auto-generated)

```sql
-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);
```

## 🎨 Prisma Studio

Prisma Studio is a graphical interface for browsing and editing database data.

```bash
npx prisma studio
```

Opens in browser at http://localhost:5555

## ✅ Advantages of PostgreSQL + Prisma

### 1. **Type Safety**
- Automatic TypeScript type generation
- IntelliSense in IDE
- Compile-time errors

```typescript
// Types are automatically generated
const reservation: Reservation = await this.prisma.reservation.findUnique({
  where: { id: 1 },
});
```

### 2. **Intuitive API**
- Clean and simple syntax
- Chainable methods
- Auto-completion

```typescript
const reservations = await this.prisma.reservation.findMany({
  where: {
    startDate: {
      gte: new Date(),
    },
    userId: 123,
  },
  orderBy: {
    startDate: 'asc',
  },
  take: 10,
});
```

### 3. **Migrations**
- Automatic SQL generation
- Version control
- Rollback possible
- Diff-based migrations

### 4. **Prisma Studio**
- Graphical interface
- Easy data browsing
- Edit without SQL

### 5. **Relations**
- Easy relation definition
- Eager/Lazy loading
- Nested writes

```prisma
model User {
  id           Int           @id @default(autoincrement())
  email        String        @unique
  reservations Reservation[]
}

model Reservation {
  id     Int  @id @default(autoincrement())
  userId Int
  user   User @relation(fields: [userId], references: [id])
}
```

```typescript
// Nested create
const user = await this.prisma.user.create({
  data: {
    email: 'test@test.com',
    reservations: {
      create: [
        { startDate: new Date(), endDate: new Date() },
      ],
    },
  },
  include: {
    reservations: true,
  },
});
```

### 6. **Query Optimization**
- N+1 problem prevention
- Efficient joins
- Select specific fields

```typescript
const reservations = await this.prisma.reservation.findMany({
  select: {
    id: true,
    startDate: true,
    user: {
      select: {
        email: true,
      },
    },
  },
});
```

### 7. **Transactions**
- Interactive transactions
- Sequential operations
- Automatic rollback

```typescript
const result = await this.prisma.$transaction(async (prisma) => {
  const reservation = await prisma.reservation.create({ data: reservationData });
  const payment = await prisma.payment.create({ data: paymentData });
  return { reservation, payment };
});
```

### 8. **Raw SQL Support**
- When you need custom queries
- Type-safe raw queries

```typescript
const result = await this.prisma.$queryRaw`
  SELECT * FROM reservations 
  WHERE "startDate" > ${new Date()}
`;
```

### 9. **Multi-database Support**
- PostgreSQL
- MySQL
- SQLite
- SQL Server
- MongoDB (preview)
- CockroachDB

### 10. **Seeding**
- Easy test data population

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: 'test@test.com',
      password: 'hashed_password',
      roles: ['USER'],
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

## ⚠️ Disadvantages of PostgreSQL + Prisma

### 1. **Vendor Lock-in**
- Prisma-specific syntax
- Harder migration to another ORM

### 2. **Learning Curve**
- New DSL (Prisma Schema)
- Different from TypeORM/Sequelize

### 3. **Bundle Size**
- Prisma Client can be large
- Binary targets for different platforms

### 4. **Limited Control**
- Less control than raw SQL
- Some advanced SQL features unavailable

### 5. **Migration Limitations**
- Not all schema changes are automatically detected
- Sometimes requires manual SQL editing

## 📊 Comparison: MongoDB vs PostgreSQL + Prisma

| Aspect | MongoDB (main) | PostgreSQL + Prisma |
|--------|----------------|---------------------|
| Data model | Document | Relational |
| Schema | Flexible | Rigid (but type-safe) |
| ORM/ODM | Mongoose | Prisma |
| Type safety | Schemas + decorators | Auto-generated types |
| Migrations | Not required | Required (but easy) |
| Query language | MongoDB Query | Prisma Client API |
| Relations | Embedded/Referenced | Foreign keys |
| IDE Support | Good | Excellent (IntelliSense) |
| Learning curve | Medium | Low |
| Raw queries | Yes | Yes (type-safe) |

## 📊 Comparison: TypeORM vs Prisma

| Aspect | TypeORM | Prisma |
|--------|---------|--------|
| Schema definition | Decorators | DSL (.prisma) |
| Type generation | Manual | Automatic |
| Migrations | CLI + manual | Auto-generated |
| Query builder | Yes | No (Prisma Client API) |
| Raw SQL | Yes | Yes (type-safe) |
| IDE Support | Good | Excellent |
| Learning curve | Medium | Low |
| Active Record | Yes | No (Data Mapper only) |
| Maturity | High | Medium (but growing fast) |

## 🔍 Advanced Prisma Features

### Middleware

```typescript
this.prisma.$use(async (params, next) => {
  console.log('Query:', params.model, params.action);
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  console.log(`Query took ${after - before}ms`);
  return result;
});
```

### Soft Delete

```prisma
model Reservation {
  id        Int       @id @default(autoincrement())
  deletedAt DateTime?
}
```

```typescript
// Soft delete
await this.prisma.reservation.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Find only non-deleted
await this.prisma.reservation.findMany({
  where: { deletedAt: null },
});
```

### Aggregations

```typescript
const stats = await this.prisma.reservation.aggregate({
  _count: true,
  _avg: {
    price: true,
  },
  _sum: {
    price: true,
  },
  where: {
    userId: 123,
  },
});
```

### Group By

```typescript
const groupedReservations = await this.prisma.reservation.groupBy({
  by: ['userId'],
  _count: {
    id: true,
  },
  _sum: {
    price: true,
  },
});
```

### Batch Operations

```typescript
// Create many
await this.prisma.reservation.createMany({
  data: [
    { startDate: new Date(), endDate: new Date(), userId: 1 },
    { startDate: new Date(), endDate: new Date(), userId: 2 },
  ],
});

// Update many
await this.prisma.reservation.updateMany({
  where: { userId: 123 },
  data: { status: 'CANCELLED' },
});

// Delete many
await this.prisma.reservation.deleteMany({
  where: { deletedAt: { not: null } },
});
```

### Upsert

```typescript
await this.prisma.user.upsert({
  where: { email: 'test@test.com' },
  update: { password: 'new_password' },
  create: { email: 'test@test.com', password: 'password' },
});
```

## 🛠️ Tools

### Prisma CLI

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from database
npx prisma db pull

# Push schema to database (without migrations)
npx prisma db push
```

### Prisma Studio
- Graphical interface
- Port 5555
- CRUD operations
- Visual relations

### pgAdmin
- Graphical interface for PostgreSQL
- Query tool
- Schema visualization

### DBeaver
- Universal database tool
- Free and open-source

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## 🔙 Return to main Branch

```bash
git checkout main
```
