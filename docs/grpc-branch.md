# gRPC Implementation Branch

## 📋 Description

The `grpc` branch contains an implementation of inter-service communication using **gRPC** (Google Remote Procedure Call) instead of standard TCP transport. gRPC is a modern, high-performance RPC framework that uses Protocol Buffers as the interface definition language and data serialization format.

## 🎯 Main Differences from `main` Branch

### 1. Protocol Buffers (.proto files)

Instead of TypeScript interfaces, the API is defined in `.proto` files:

```
proto/
├── auth.proto           # Definitions for Auth Service
├── payments.proto       # Definitions for Payments Service
└── notifications.proto  # Definitions for Notifications Service
```

### 2. Transport Layer

- **main branch**: `Transport.TCP`
- **grpc branch**: `Transport.GRPC`

### 3. Additional Dependencies

```json
{
  "@grpc/grpc-js": "^1.14.3",
  "@grpc/proto-loader": "^0.8.0"
}
```

## 🏗️ Protocol Buffers Structure

### auth.proto

```protobuf
syntax = "proto3";

package auth;

service AuthService {
  rpc Authenticate(Authentication) returns (UserMessage);
}

message Authentication {
  string Authentication = 1;
}

message UserMessage {
  string id = 1;
  string email = 2;
  string password = 3;
  repeated string roles = 4;
}
```

### payments.proto

```protobuf
syntax = "proto3";

package payments;

service PaymentsService {
  rpc CreateCharge(CreateChargeMessage) returns (CreateChargeResponse);
}

message CreateChargeMessage {
  string email = 1;
  int32 amount = 2;
  CardMessage card = 3;
}

message CardMessage {
  string cvc = 1;
  int32 expMonth = 2;
  int32 expYear = 3;
  string number = 4;
}

message CreateChargeResponse {
  string id = 1;
}
```

## 🔧 Service Configuration

### Payments Service (main.ts)

```typescript
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PAYMENTS_PACKAGE_NAME } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: PAYMENTS_PACKAGE_NAME,
      protoPath: join(__dirname, '../../../proto/payments.proto'),
      url: configService.getOrThrow<string>('PAYMENTS_GRPC_URL'),
    },
  });

  await app.startAllMicroservices();
}
```

### Reservations Module (gRPC client)

```typescript
ClientsModule.registerAsync([
  {
    name: PAYMENTS_SERVICE_NAME,
    useFactory: (configService: ConfigService) => ({
      transport: Transport.GRPC,
      options: {
        package: PAYMENTS_PACKAGE_NAME,
        protoPath: join(__dirname, '../../../proto/payments.proto'),
        url: configService.getOrThrow<string>('PAYMENTS_GRPC_URL'),
      },
    }),
    inject: [ConfigService],
  },
])
```

### Reservations Service (using gRPC client)

```typescript
@Injectable()
export class ReservationsService implements OnModuleInit {
  private paymentsService: PaymentsServiceClient;

  constructor(
    @Inject(PAYMENTS_SERVICE_NAME)
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.paymentsService = this.client.getService<PaymentsServiceClient>(
      PAYMENTS_SERVICE_NAME,
    );
  }

  create(createReservationDto: CreateReservationDto, user: UserDto) {
    return this.paymentsService
      .createCharge({
        ...createReservationDto.charge,
        email: user.email,
      })
      .pipe(
        map((response) => {
          // ... reservation creation logic
        }),
      );
  }
}
```

## 🚀 Running the Application

### 1. Switch to gRPC Branch

```bash
git checkout grpc
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate TypeScript from Protocol Buffers (optional)

If you want to generate TypeScript types from `.proto` files:

```bash
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
       --ts_proto_out=./ \
       --ts_proto_opt=nestJs=true \
       ./proto/auth.proto

protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
       --ts_proto_out=./ \
       --ts_proto_opt=nestJs=true \
       ./proto/payments.proto

protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
       --ts_proto_out=./ \
       --ts_proto_opt=nestJs=true \
       ./proto/notifications.proto
```

This command will generate TypeScript files containing:
- TypeScript interfaces corresponding to proto messages
- NestJS-compatible service definitions
- gRPC communication types
- Metadata needed for serialization/deserialization

### 4. Update Environment Variables

**apps/reservations/.env**
```env
MONGODB_URI=mongodb://mongo:27017/sleepr-reservations
PORT=3000
AUTH_GRPC_URL=auth:3001
PAYMENTS_GRPC_URL=payments:3003
```

**apps/auth/.env**
```env
MONGODB_URI=mongodb://mongo:27017/sleepr-auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
AUTH_GRPC_URL=0.0.0.0:3001
```

**apps/payments/.env**
```env
STRIPE_SECRET_KEY=your_stripe_key
PAYMENTS_GRPC_URL=0.0.0.0:3003
NOTIFICATIONS_GRPC_URL=notifications:3004
```

**apps/notifications/.env**
```env
SMTP_USER=your_gmail@gmail.com
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token
NOTIFICATIONS_GRPC_URL=0.0.0.0:3004
```

### 5. Run the Application

```bash
# Docker Compose
docker compose up --build

# Or locally
npm run start:dev reservations
npm run start:dev auth
npm run start:dev payments
npm run start:dev notifications
```

## ✅ Advantages of gRPC

### 1. **Performance**
- Binary data format (Protocol Buffers) - smaller message size
- HTTP/2 - multiplexing, header compression
- Faster serialization/deserialization than JSON

### 2. **Strong Typing**
- API contract defined in `.proto`
- Automatic code generation for multiple languages
- Compile-time validation

### 3. **Streaming**
- Unary RPC (request-response)
- Server streaming
- Client streaming
- Bidirectional streaming

### 4. **Interoperability**
- Support for multiple languages (Go, Java, Python, C++, etc.)
- Unified contract between different technologies

### 5. **Documentation**
- `.proto` files serve as living API documentation
- Easy to understand and maintain

## ⚠️ Disadvantages of gRPC

### 1. **Debugging**
- Binary format makes debugging harder
- Requires special tools (grpcurl, Postman)

### 2. **Browser Support**
- Limited browser support
- Requires gRPC-Web for frontend applications

### 3. **Learning Curve**
- New Protocol Buffers syntax
- Additional code generation step

### 4. **Human-readability**
- Binary messages are not human-readable
- JSON is more friendly for debugging

## 📊 Comparison: TCP vs gRPC

| Aspect | TCP (main) | gRPC |
|--------|-----------|------|
| Data format | JSON | Protocol Buffers (binary) |
| Protocol | TCP | HTTP/2 |
| Typing | TypeScript interfaces | .proto definitions |
| Performance | Good | Very good |
| Debugging | Easy | Requires tools |
| Streaming | Limited | Full support |
| Documentation | Manual | Auto-generated from .proto |

## 🛠️ Testing Tools

### grpcurl

```bash
# Installation
brew install grpcurl

# List services
grpcurl -plaintext localhost:3003 list

# Call method
grpcurl -plaintext \
  -d '{"email": "test@test.com", "amount": 100}' \
  localhost:3003 \
  payments.PaymentsService/CreateCharge
```

### Postman
- Postman supports gRPC from version 9.7
- Import `.proto` files
- Graphical interface for testing

### BloomRPC
- Dedicated GUI application for gRPC
- Import `.proto` files
- Easy testing and debugging

## 📚 Additional Resources

- [gRPC Official Documentation](https://grpc.io/docs/)
- [Protocol Buffers Guide](https://protobuf.dev/)
- [NestJS Microservices - gRPC](https://docs.nestjs.com/microservices/grpc)
- [gRPC Best Practices](https://grpc.io/docs/guides/performance/)

## 🔙 Return to main Branch

```bash
git checkout main
```
