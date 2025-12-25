# Sleepr - Microservices Booking Platform

## 📋 Project Description

Sleepr is an advanced booking platform built with microservices architecture using NestJS. The application demonstrates best practices in building scalable, distributed backend systems using modern technologies and design patterns.

The system enables users to create reservations, manage user accounts, process payments, and send email notifications. Each of these functional areas is separated into its own microservice, ensuring independence, scalability, and ease of maintenance.

## 🏗️ Architecture

The application consists of the following microservices:

### **Reservations Service** (Port: 3000)
- Main service managing reservations
- Handles CRUD operations for reservations
- Communicates with Auth service (authorization) and Payments service (payments)
- Stores data in MongoDB

### **Auth Service** (Port: 3001)
- Service responsible for authentication and authorization
- User management (registration, login)
- JWT (JSON Web Tokens) implementation for secure communication
- Strategies: Local Strategy and JWT Strategy
- Stores user data in MongoDB

### **Payments Service**
- Integration with Stripe API for payment processing
- Creating and managing payment intents
- Communication with Notifications service after transaction completion
- Operates as TCP microservice

### **Notifications Service**
- Sending email notifications
- Integration with Gmail via OAuth2
- Sends payment confirmations to users
- Operates as TCP microservice

## 🛠️ Technology Stack

### Backend Framework
- **NestJS** - progressive Node.js framework for building efficient, scalable server-side applications
- **TypeScript** - strongly typed JavaScript for better code quality

### Databases
- **MongoDB** - NoSQL database for Reservations and Auth services
- **Mongoose** - ODM (Object Data Modeling) for MongoDB

### Inter-service Communication
- **NestJS Microservices** - module for inter-service communication
- **TCP Transport** - default communication protocol

### Authorization and Authentication
- **Passport.js** - authentication middleware
- **JWT (JSON Web Tokens)** - tokens for secure communication
- **bcrypt** - password hashing

### Payments
- **Stripe API** - online payment processing

### Email
- **Nodemailer** - sending emails
- **Gmail OAuth2** - secure integration with Gmail

### DevOps & Cloud
- **Docker** - application containerization
- **Docker Compose** - local environment orchestration
- **Kubernetes** - container orchestration in production
- **Helm** - package manager for Kubernetes
- **Google Cloud Platform (GCP)**:
  - **Artifact Registry** - storing Docker images
  - **Cloud Build** - CI/CD pipeline
  - **Google Kubernetes Engine (GKE)** - managed Kubernetes cluster

### Logging
- **Pino** - fast logger for Node.js
- **nestjs-pino** - Pino integration with NestJS

### Validation
- **class-validator** - DTO validation
- **class-transformer** - object transformation
- **Joi** - environment variable validation

### Testing
- **Jest** - testing framework
- **Supertest** - HTTP endpoint testing
- **E2E Tests** - end-to-end tests in isolated Docker environment

## 🚀 Running the Project

### Prerequisites

- Node.js (v18+)
- Docker Desktop
- npm or yarn
- Google Cloud Platform account (optional, for deployment)
- Stripe account (for payments)
- Gmail account with OAuth2 (for notifications)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sleepr
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` files for each service:

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
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600
```

**apps/payments/.env**
```env
PORT=3003
STRIPE_SECRET_KEY=your_stripe_secret_key
NOTIFICATIONS_HOST=notifications
NOTIFICATIONS_PORT=3004
```

**apps/notifications/.env**
```env
PORT=3004
SMTP_USER=your_gmail@gmail.com
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token
```

### Running Locally with Docker Compose

```bash
# Start all services
docker compose up --build

# Run in background
docker compose up -d --build

# Stop services
docker compose down
```

### Running in Development Mode

```bash
# Start specific service
npm run start:dev reservations
npm run start:dev auth
npm run start:dev payments
npm run start:dev notifications

# Start with debugger
npm run start:debug reservations
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📡 API Endpoints

### Reservations Service (http://localhost:3000)

- `POST /reservations` - Create new reservation (requires authentication)
- `GET /reservations` - Get all reservations (requires authentication)
- `GET /reservations/:id` - Get specific reservation (requires authentication)
- `PATCH /reservations/:id` - Update reservation (requires authentication)
- `DELETE /reservations/:id` - Delete reservation (requires authentication)

### Auth Service (http://localhost:3001)

- `POST /users` - Register new user
- `POST /auth/login` - Login user (returns JWT token)
- `GET /users/:id` - Get user data (requires authentication)

### Health Checks

Each service has a health check endpoint:
- `GET /health` - Service status

## ☁️ Deployment on Google Cloud Platform

### 1. GCP Configuration

Detailed instructions can be found in [docs/local-setup.md](docs/local-setup.md)

#### Artifact Registry
1. Create Docker repositories for each service (reservations, auth, payments, notifications)
2. Region: europe-central2 (or any)
3. Format: Docker

#### Cloud Build
1. Enable Cloud Build API
2. Configure trigger for automatic building on push to GitHub
3. Configuration file: `cloudbuild.yaml`

### 2. Kubernetes Deployment

```bash
# Switch context to local cluster
kubectl config use-context docker-desktop

# Install application using Helm
cd k8s/sleepr
helm install sleepr .

# Update deployment
helm upgrade sleepr .

# Remove deployment
helm uninstall sleepr

# Check pod status
kubectl get pods

# Check logs
kubectl logs <pod-name>
```

### 3. Ingress

The application uses Ingress for HTTP traffic routing:
- Configuration in `k8s/sleepr/templates/ingress.yaml`
- Access to services through single entry point

## 🔀 Alternative Implementations

The repository contains several branches demonstrating different technological approaches:

### 📡 [gRPC](docs/grpc-branch.md)
Implementation of inter-service communication using gRPC instead of TCP.
- Protocol Buffers for API definition
- More efficient binary communication
- Strong typing of contracts

### 🐰 [RabbitMQ](docs/rabbitmq-branch.md)
Asynchronous communication between services using RabbitMQ message broker.
- Event-driven architecture
- Message queues
- Better service decoupling

### 🔷 [GraphQL Gateway](docs/graphql-gateway-branch.md)
Implementation of GraphQL Federation with Apollo Gateway.
- Unified GraphQL API
- Federation subgraphs
- Flexible queries

### 🐬 [MySQL + TypeORM](docs/mysql-typeorm-branch.md)
Using MySQL relational database with TypeORM instead of MongoDB.
- SQL database
- TypeORM as ORM
- Database migrations

### 🐘 [PostgreSQL + Prisma](docs/postgres-prisma-branch.md)
Implementation with PostgreSQL and Prisma ORM.
- PostgreSQL database
- Prisma as modern ORM
- Type-safe database access

## 📚 Additional Documentation

- [Local setup and GCP deployment](docs/local-setup.md)
- [gRPC Implementation](docs/grpc-branch.md)
- [RabbitMQ Implementation](docs/rabbitmq-branch.md)
- [GraphQL Gateway Implementation](docs/graphql-gateway-branch.md)
- [MySQL + TypeORM Implementation](docs/mysql-typeorm-branch.md)
- [PostgreSQL + Prisma Implementation](docs/postgres-prisma-branch.md)

## 🏛️ Patterns and Best Practices

### Clean Architecture
- Layer separation (Controllers, Services, Repositories)
- Dependency Injection
- Interface-based design

### Microservices Patterns
- Service Discovery
- API Gateway (in GraphQL case)
- Circuit Breaker (health checks)
- Distributed Logging

### Security
- JWT-based authentication
- Password hashing (bcrypt)
- Environment variables for secrets
- HTTP-only cookies

### Code Quality
- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- Unit tests and E2E tests

## 📝 Project Structure

```
sleepr/
├── apps/                          # Microservices
│   ├── reservations/             # Reservations service
│   ├── auth/                     # Authentication service
│   ├── payments/                 # Payments service
│   ├── notifications/            # Notifications service
│   └── gateway/                  # API Gateway (in graphql-gateway branch)
├── libs/                         # Shared libraries
│   └── common/                   # Common modules, decorators, DTOs
│       ├── auth/                 # Guards, strategies
│       ├── database/             # Database modules
│       ├── decorators/           # Custom decorators
│       ├── dto/                  # Data Transfer Objects
│       ├── health/               # Health check module
│       └── logger/               # Logging module
├── k8s/                          # Kubernetes manifests
│   └── sleepr/                   # Helm chart
│       ├── templates/            # K8s templates
│       └── values.yaml           # Helm configuration
├── e2e/                          # End-to-end tests
├── docs/                         # Documentation
├── proto/                        # Protocol Buffers (in grpc branch)
├── docker-compose.yml            # Local orchestration
├── cloudbuild.yaml               # GCP Cloud Build config
└── nest-cli.json                 # NestJS CLI configuration
```

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

UNLICENSED - educational project

## 👨‍💻 Author

Project created as a demonstration of advanced microservices techniques in NestJS.

## 🔗 Useful Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
