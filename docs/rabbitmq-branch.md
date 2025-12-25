# RabbitMQ Implementation Branch

## 📋 Description

The `rabbitmq` branch contains an implementation of asynchronous inter-service communication using **RabbitMQ** as a message broker. RabbitMQ is a popular, open-source message broker implementing the AMQP (Advanced Message Queuing Protocol) protocol.

## 🎯 Main Differences from `main` Branch

### 1. Message Broker Architecture

- **main branch**: Synchronous TCP communication between services
- **rabbitmq branch**: Asynchronous communication through RabbitMQ message queues

### 2. Transport Layer

- **main branch**: `Transport.TCP`
- **rabbitmq branch**: `Transport.RMQ` (RabbitMQ)

### 3. Event-Driven Communication

Instead of direct RPC calls, services communicate through:
- **Events** - fire-and-forget events
- **Message Patterns** - message patterns with responses

### 4. Additional Dependencies

```json
{
  "amqplib": "^0.10.3",
  "amqp-connection-manager": "^4.1.14"
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
    ┌────────┐
    │RabbitMQ│◄────────┐
    │ Broker │         │
    └───┬────┘         │
        │              │
   ┌────▼────┐    ┌───▼─────┐
   │Payments │    │  Auth   │
   │ Service │    │ Service │
   └────┬────┘    └─────────┘
        │
        ▼
   ┌────────────┐
   │Notifications│
   │   Service   │
   └─────────────┘
```

## 🔧 Service Configuration

### Docker Compose - RabbitMQ Service

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - '5672:5672'    # AMQP port
      - '15672:15672'  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
```

### Payments Service (main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URI')],
      queue: 'payments_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
}
```

### Reservations Module (RabbitMQ client)

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PAYMENTS_SERVICE } from '@app/common';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PAYMENTS_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URI')],
            queue: 'payments_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
export class ReservationsModule {}
```

### Payments Controller (message handling)

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create_charge')
  async createCharge(@Payload() data: PaymentsCreateChargeDto) {
    return this.paymentsService.createCharge(data);
  }
}
```

### Notifications Service (event-driven)

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('notify_email')
  async notifyEmail(@Payload() data: NotifyEmailDto) {
    return this.notificationsService.notifyEmail(data);
  }
}
```

### Payments Service (sending events)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATIONS_SERVICE } from '@app/common';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: ClientProxy,
  ) {}

  async createCharge(data: PaymentsCreateChargeDto) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      // ... Stripe configuration
    });

    // Emit event - fire and forget
    this.notificationsService.emit('notify_email', {
      email: data.email,
      text: `Your payment of $${data.amount} has completed successfully`,
    });

    return paymentIntent;
  }
}
```

## 🚀 Running the Application

### 1. Switch to RabbitMQ Branch

```bash
git checkout rabbitmq
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Update Environment Variables

**apps/reservations/.env**
```env
MONGODB_URI=mongodb://mongo:27017/sleepr-reservations
PORT=3000
RABBITMQ_URI=amqp://guest:guest@rabbitmq:5672
```

**apps/auth/.env**
```env
MONGODB_URI=mongodb://mongo:27017/sleepr-auth
PORT=3001
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
RABBITMQ_URI=amqp://guest:guest@rabbitmq:5672
```

**apps/payments/.env**
```env
STRIPE_SECRET_KEY=your_stripe_key
RABBITMQ_URI=amqp://guest:guest@rabbitmq:5672
```

**apps/notifications/.env**
```env
SMTP_USER=your_gmail@gmail.com
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token
RABBITMQ_URI=amqp://guest:guest@rabbitmq:5672
```

### 4. Run Application with Docker Compose

```bash
docker compose up --build
```

### 5. Access RabbitMQ Management UI

Open browser: http://localhost:15672
- Username: `guest`
- Password: `guest`

In the panel you can see:
- Queues
- Exchanges
- Connections
- Channels
- Message statistics

## ✅ Advantages of RabbitMQ

### 1. **Asynchronicity**
- Services don't need to wait for response
- Better resource utilization
- Higher throughput

### 2. **Fault Tolerance**
- Durable queues
- Messages are stored even when service is unavailable
- Automatic retry mechanisms

### 3. **Service Decoupling**
- Services don't need to know each other
- Easier to add new consumers
- Changing one service doesn't affect others

### 4. **Load Balancing**
- Automatic message distribution among multiple instances
- Round-robin distribution
- Fair dispatch

### 5. **Routing Flexibility**
- Direct exchange
- Topic exchange
- Fanout exchange
- Headers exchange

### 6. **Message Acknowledgment**
- Delivery confirmation
- Requeue on error
- Dead letter queues

### 7. **Monitoring**
- Built-in Management UI
- Metrics and statistics
- Easy debugging

## ⚠️ Disadvantages of RabbitMQ

### 1. **Complexity**
- Additional infrastructure component
- Requires management and monitoring
- Learning curve

### 2. **Eventual Consistency**
- No immediate response
- Harder to manage distributed transactions
- Potential issues with message ordering

### 3. **Debugging**
- Harder to trace message flow
- Asynchronicity makes debugging harder
- Additional monitoring tools needed

### 4. **Overhead**
- Additional latency through broker
- Memory consumption for queues
- Network overhead

## 📊 Comparison: TCP vs RabbitMQ

| Aspect | TCP (main) | RabbitMQ |
|--------|-----------|----------|
| Communication | Synchronous | Asynchronous |
| Coupling | Tight coupling | Loose coupling |
| Resilience | Requires service availability | Queues buffer messages |
| Scalability | Limited | High (load balancing) |
| Complexity | Low | Medium/High |
| Latency | Low | Medium |
| Retry logic | Manual implementation | Built-in |
| Monitoring | Basic | Advanced (UI) |

## 🔄 Communication Patterns

### 1. Request-Response Pattern

```typescript
// Client
const result = await this.paymentsService
  .send('create_charge', data)
  .toPromise();

// Server
@MessagePattern('create_charge')
async createCharge(@Payload() data: any) {
  return { id: '123' };
}
```

### 2. Event Pattern (Fire-and-Forget)

```typescript
// Publisher
this.notificationsService.emit('notify_email', data);

// Subscriber
@EventPattern('notify_email')
async notifyEmail(@Payload() data: any) {
  // No return value
}
```

## 🛠️ Advanced Configurations

### Durable Queues

```typescript
queueOptions: {
  durable: true,  // Queue survives RabbitMQ restart
}
```

### Prefetch Count

```typescript
options: {
  prefetchCount: 1,  // How many messages can be processed simultaneously
}
```

### Dead Letter Exchange

```typescript
queueOptions: {
  durable: true,
  deadLetterExchange: 'dlx',
  deadLetterRoutingKey: 'failed_messages',
}
```

### Message TTL (Time To Live)

```typescript
queueOptions: {
  messageTtl: 60000,  // Message expires after 60 seconds
}
```

## 🔍 Monitoring and Debugging

### RabbitMQ Management UI

1. **Queues tab**
   - Number of messages in queue
   - Rate of messages
   - Consumers count

2. **Exchanges tab**
   - Routing rules
   - Bindings

3. **Connections tab**
   - Active connections
   - Channels per connection

### Logging

```typescript
import { Logger } from '@nestjs/common';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  @MessagePattern('create_charge')
  async createCharge(@Payload() data: any) {
    this.logger.log(`Received create_charge message: ${JSON.stringify(data)}`);
    // ...
  }
}
```

## 📚 Additional Resources

- [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
- [NestJS Microservices - RabbitMQ](https://docs.nestjs.com/microservices/rabbitmq)
- [AMQP Protocol Specification](https://www.amqp.org/)
- [RabbitMQ Best Practices](https://www.cloudamqp.com/blog/part1-rabbitmq-best-practice.html)

## 🔙 Return to main Branch

```bash
git checkout main
```
