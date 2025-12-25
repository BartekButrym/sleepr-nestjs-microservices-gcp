# GraphQL Gateway Implementation Branch

## 📋 Description

The `graphql-gateway` branch contains an implementation of **Apollo Federation** with **GraphQL Gateway**, which aggregates multiple GraphQL subgraphs into one unified API. Instead of REST API, clients can use GraphQL to flexibly fetch data from multiple microservices through a single endpoint.

## 🎯 Main Differences from `main` Branch

### 1. API Gateway Pattern

- **main branch**: Direct REST endpoints for each service
- **graphql-gateway branch**: Central GraphQL Gateway aggregating all services

### 2. Query Language

- **main branch**: REST API (HTTP methods: GET, POST, PATCH, DELETE)
- **graphql-gateway branch**: GraphQL queries and mutations

### 3. New Service: Gateway

```
apps/
├── gateway/          # 🆕 Apollo Gateway (Federation)
├── reservations/     # GraphQL Subgraph
├── auth/            # GraphQL Subgraph
├── payments/        # GraphQL Subgraph
└── notifications/   # TCP (without GraphQL)
```

### 4. Additional Dependencies

```json
{
  "@nestjs/graphql": "^12.0.0",
  "@nestjs/apollo": "^12.0.0",
  "@apollo/gateway": "^2.5.0",
  "@apollo/subgraph": "^2.5.0",
  "apollo-server-express": "^3.12.0",
  "graphql": "^16.8.0"
}
```

## 🏗️ Apollo Federation Architecture

```
                    ┌──────────────┐
                    │   Clients    │
                    │ (Frontend)   │
                    └──────┬───────┘
                           │
                           │ GraphQL Query
                           ▼
                    ┌──────────────┐
                    │   Gateway    │
                    │  (Apollo)    │
                    │   Port 3002  │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ Reservations  │  │     Auth     │  │   Payments   │
│   Subgraph    │  │   Subgraph   │  │   Subgraph   │
│   Port 3000   │  │   Port 3001  │  │   Port 3003  │
└───────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │                 │                  │
        ▼                 ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │ MongoDB │       │ MongoDB │       │ Stripe  │
   └─────────┘       └─────────┘       └─────────┘
```

## 🔧 Service Configuration

### Gateway Service (gateway.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      useFactory: (configService: ConfigService) => ({
        server: {
          context: authContext,  // Passing authentication context
        },
        gateway: {
          supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
              {
                name: 'reservations',
                url: configService.getOrThrow<string>('RESERVATIONS_GRAPHQL_URL'),
              },
              {
                name: 'auth',
                url: configService.getOrThrow<string>('AUTH_GRAPHQL_URL'),
              },
              {
                name: 'payments',
                url: configService.getOrThrow<string>('PAYMENTS_GRAPHQL_URL'),
              },
            ],
          }),
          buildService({ url }) {
            return new RemoteGraphQLDataSource({
              url,
              willSendRequest({ request, context }) {
                // Passing user context to subgraphs
                if (request.http && context.user) {
                  request.http.headers.set('user', JSON.stringify(context.user));
                }
              },
            });
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class GatewayModule {}
```

### Auth Context (auth.context.ts)

```typescript
import { UnauthorizedException } from '@nestjs/common';

export const authContext = async ({ req }) => {
  try {
    const authentication = req.headers?.authentication;
    if (!authentication) {
      return {};
    }

    // JWT token verification through Auth Service
    const user = await authService.authenticate(authentication);
    return { user };
  } catch (err) {
    throw new UnauthorizedException();
  }
};
```

### Reservations Subgraph (reservations.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
    // ... other modules
  ],
  providers: [ReservationsResolver, ReservationsService],
})
export class ReservationsModule {}
```

### Reservations Resolver

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CurrentUser, UserDto } from '@app/common';
import { ReservationDocument } from './models/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Resolver(() => ReservationDocument)
export class ReservationsResolver {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Mutation(() => ReservationDocument)
  createReservation(
    @Args('createReservationInput') createReservationInput: CreateReservationDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.reservationsService.create(createReservationInput, user);
  }

  @Query(() => [ReservationDocument], { name: 'reservations' })
  findAll() {
    return this.reservationsService.findAll();
  }

  @Query(() => ReservationDocument, { name: 'reservation' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Mutation(() => ReservationDocument)
  removeReservation(@Args('id', { type: () => String }) id: string) {
    return this.reservationsService.remove(id);
  }
}
```

### Reservation Schema (GraphQL Object Type)

```typescript
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';

@Schema({ versionKey: false })
@ObjectType()
@Directive('@key(fields: "_id")')
export class ReservationDocument extends AbstractDocument {
  @Field(() => ID)
  _id: string;

  @Prop()
  @Field()
  timestamp: Date;

  @Prop()
  @Field()
  startDate: Date;

  @Prop()
  @Field()
  endDate: Date;

  @Prop()
  @Field()
  userId: string;

  @Prop()
  @Field()
  invoiceId: string;
}
```

### Create Reservation DTO (GraphQL Input Type)

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateChargeDto } from '@app/common';

@InputType()
export class CreateReservationDto {
  @Field()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @Field()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @Field(() => CreateChargeDto)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateChargeDto)
  charge: CreateChargeDto;
}
```

## 🚀 Running the Application

### 1. Switch to GraphQL Gateway Branch

```bash
git checkout graphql-gateway
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Update Environment Variables

**apps/gateway/.env**
```env
PORT=3002
RESERVATIONS_GRAPHQL_URL=http://reservations:3000/graphql
AUTH_GRAPHQL_URL=http://auth:3001/graphql
PAYMENTS_GRAPHQL_URL=http://payments:3003/graphql
AUTH_HOST=auth
AUTH_PORT=3001
```

**apps/reservations/.env**
```env
MONGODB_URI=mongodb://mongo:27017/sleepr-reservations
PORT=3000
AUTH_HOST=auth
AUTH_PORT=3001
PAYMENTS_HOST=payments
PAYMENTS_PORT=3003
```

**apps/auth/.env**
```env
MONGODB_URI=mongodb://mongo:27017/sleepr-auth
PORT=3001
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
```

**apps/payments/.env**
```env
PORT=3003
STRIPE_SECRET_KEY=your_stripe_key
NOTIFICATIONS_HOST=notifications
NOTIFICATIONS_PORT=3004
```

### 4. Run the Application

```bash
# Docker Compose
docker compose up --build

# Or locally
npm run start:dev gateway
npm run start:dev reservations
npm run start:dev auth
npm run start:dev payments
npm run start:dev notifications
```

### 5. Access GraphQL Playground

Open browser: http://localhost:3002/graphql

## 📝 Example GraphQL Queries

### Register User

```graphql
mutation CreateUser {
  createUser(createUserInput: {
    email: "test@example.com"
    password: "StrongPassword123!"
  }) {
    _id
    email
  }
}
```

### Login

```graphql
mutation Login {
  login(loginInput: {
    email: "test@example.com"
    password: "StrongPassword123!"
  }) {
    user {
      _id
      email
    }
  }
}
```

### Create Reservation (requires authentication)

```graphql
mutation CreateReservation {
  createReservation(createReservationInput: {
    startDate: "2025-12-20"
    endDate: "2025-12-25"
    charge: {
      amount: 100
      card: {
        cvc: "123"
        expMonth: 12
        expYear: 2026
        number: "4242424242424242"
      }
    }
  }) {
    _id
    startDate
    endDate
    userId
    invoiceId
    timestamp
  }
}
```

**Headers:**
```json
{
  "Authentication": "your_jwt_token_here"
}
```

### Get All Reservations

```graphql
query GetReservations {
  reservations {
    _id
    startDate
    endDate
    userId
    invoiceId
    timestamp
  }
}
```

### Get Specific Reservation

```graphql
query GetReservation {
  reservation(id: "507f1f77bcf86cd799439011") {
    _id
    startDate
    endDate
    userId
    invoiceId
  }
}
```

### Remove Reservation

```graphql
mutation RemoveReservation {
  removeReservation(id: "507f1f77bcf86cd799439011") {
    _id
  }
}
```

## ✅ Advantages of GraphQL Gateway

### 1. **Single Endpoint**
- Client communicates only with Gateway
- Simplified frontend
- Easier CORS management

### 2. **Flexible Queries**
- Client fetches only needed data
- No over-fetching and under-fetching
- Nested queries in one request

### 3. **Strong Typing**
- Schema-first approach
- Auto-generated documentation
- Type-safe queries

### 4. **Federation**
- Each service manages its part of schema
- Independent development
- Easy to add new services

### 5. **Introspection**
- Self-documenting API
- GraphQL Playground
- Automatic developer tools

### 6. **Real-time Capabilities**
- GraphQL Subscriptions (WebSockets)
- Live updates
- Reactive UI

### 7. **Versioning**
- No need for API versioning
- Deprecation instead of breaking changes
- Evolving schema

## ⚠️ Disadvantages of GraphQL Gateway

### 1. **Complexity**
- GraphQL learning curve
- Additional layer (Gateway)
- Harder debugging

### 2. **Performance**
- Potential N+1 problem
- Requires DataLoader for optimization
- Overhead through Gateway

### 3. **Caching**
- Harder HTTP caching
- Requires dedicated solutions (Apollo Client Cache)
- Limited CDN caching

### 4. **File Uploads**
- More complicated than REST
- Requires special solutions

### 5. **Rate Limiting**
- Harder than REST
- Requires query complexity analysis
- Potential issues with expensive queries

## 📊 Comparison: REST vs GraphQL

| Aspect | REST (main) | GraphQL |
|--------|-------------|---------|
| Endpoints | Multiple endpoints | Single endpoint |
| Data fetching | Fixed structure | Flexible queries |
| Over-fetching | Yes | No |
| Under-fetching | Yes (requires multiple requests) | No |
| Versioning | /v1, /v2 | Deprecation |
| Documentation | Manual (Swagger) | Auto-generated |
| Caching | HTTP caching | Client-side cache |
| Learning curve | Low | Medium/High |
| Tooling | Standard HTTP | Specialized (Apollo) |

## 🛠️ Advanced Features

### DataLoader (N+1 problem)

```typescript
import DataLoader from 'dataloader';

@Injectable()
export class UsersLoader {
  private readonly loader = new DataLoader<string, User>(
    async (userIds: string[]) => {
      const users = await this.usersService.findByIds(userIds);
      return userIds.map(id => users.find(user => user.id === id));
    }
  );

  async load(userId: string): Promise<User> {
    return this.loader.load(userId);
  }
}
```

### Field Resolvers (Cross-service data)

```typescript
@Resolver(() => ReservationDocument)
export class ReservationsResolver {
  @ResolveField('user', () => User)
  async getUser(@Parent() reservation: ReservationDocument) {
    return this.authService.getUserById(reservation.userId);
  }
}
```

### Custom Directives

```typescript
@Directive('@auth(requires: ADMIN)')
@Query(() => [User])
getAllUsers() {
  return this.usersService.findAll();
}
```

### Subscriptions (Real-time)

```typescript
@Subscription(() => ReservationDocument)
reservationCreated() {
  return this.pubSub.asyncIterator('reservationCreated');
}
```

## 🔍 Monitoring and Debugging

### Apollo Studio
- Free monitoring tool
- Query performance metrics
- Schema registry
- Error tracking

### GraphQL Playground
- Interactive IDE
- Auto-complete
- Documentation explorer
- Query history

### Logging

```typescript
import { Plugin } from '@nestjs/apollo';
import { ApolloServerPlugin } from '@apollo/server';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  async requestDidStart() {
    console.log('Request started');
    return {
      async willSendResponse() {
        console.log('Response sent');
      },
    };
  }
}
```

## 📚 Additional Resources

- [GraphQL Official Documentation](https://graphql.org/)
- [Apollo Federation Documentation](https://www.apollographql.com/docs/federation/)
- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

## 🔙 Return to main Branch

```bash
git checkout main
```
