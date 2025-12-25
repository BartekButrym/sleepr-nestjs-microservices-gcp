# MySQL + TypeORM Implementation Branch

## 📋 Description

The `mysql-typeorm` branch contains an implementation using **MySQL** relational database and **TypeORM** as ORM (Object-Relational Mapping). This is an alternative to MongoDB + Mongoose used in the `main` branch.

## 🎯 Main Differences from `main` Branch

### 1. Database

- **main branch**: MongoDB (NoSQL)
- **mysql-typeorm branch**: MySQL (SQL)

### 2. ORM/ODM

- **main branch**: Mongoose (ODM for MongoDB)
- **mysql-typeorm branch**: TypeORM (ORM for SQL)

### 3. Schema Definition

- **main branch**: Mongoose Schemas with `@Schema()`, `@Prop()` decorators
- **mysql-typeorm branch**: TypeORM Entities with `@Entity()`, `@Column()` decorators

### 4. Additional Dependencies

```json
{
  "@nestjs/typeorm": "^10.0.0",
  "typeorm": "^0.3.17",
  "mysql2": "^3.6.0"
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
    │ MySQL  │
    │Database│
    └────────┘

┌─────────────────┐
│     Auth        │
│    Service      │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ MySQL  │
    │Database│
    └────────┘
```

## 🔧 Configuration

### Database Module (libs/common/src/database/database.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('MYSQL_HOST'),
        port: configService.getOrThrow<number>('MYSQL_PORT'),
        database: configService.getOrThrow<string>('MYSQL_DATABASE'),
        username: configService.getOrThrow<string>('MYSQL_USERNAME'),
        password: configService.getOrThrow<string>('MYSQL_PASSWORD'),
        synchronize: configService.getOrThrow<boolean>('MYSQL_SYNCHRONIZE'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  static forFeature(models: EntityClassOrSchema[]) {
    return TypeOrmModule.forFeature(models);
  }
}
```

### Abstract Entity (libs/common/src/database/abstract.entity.ts)

```typescript
import { PrimaryGeneratedColumn } from 'typeorm';

export class AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
```

### Reservation Entity (apps/reservations/src/models/reservation.entity.ts)

```typescript
import { Entity, Column, CreateDateColumn } from 'typeorm';
import { AbstractEntity } from '@app/common';

@Entity('reservations')
export class ReservationEntity extends AbstractEntity {
  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column()
  userId: number;

  @Column()
  invoiceId: string;
}
```

### User Entity (libs/common/src/models/user.entity.ts)

```typescript
import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { AbstractEntity } from '../database/abstract.entity';
import { RoleEntity } from './role.entity';

@Entity('users')
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles: RoleEntity[];
}
```

### Role Entity (libs/common/src/models/role.entity.ts)

```typescript
import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../database/abstract.entity';

@Entity('roles')
export class RoleEntity extends AbstractEntity {
  @Column({ unique: true })
  name: string;
}
```

### Abstract Repository (libs/common/src/database/abstract.repository.ts)

```typescript
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { Logger, NotFoundException } from '@nestjs/common';

export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly repository: Repository<T>) {}

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity);
    return await this.repository.save(newEntity);
  }

  async findOne(filterQuery: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.repository.findOne({ where: filterQuery });
    if (!entity) {
      this.logger.warn('Entity not found with filter:', filterQuery);
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }

  async findOneAndUpdate(
    filterQuery: FindOptionsWhere<T>,
    update: Partial<T>,
  ): Promise<T> {
    const entity = await this.findOne(filterQuery);
    Object.assign(entity, update);
    return await this.repository.save(entity);
  }

  async find(filterQuery?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(filterQuery);
  }

  async findOneAndDelete(filterQuery: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.findOne(filterQuery);
    await this.repository.remove(entity);
    return entity;
  }
}
```

### Reservations Repository

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '@app/common';
import { ReservationEntity } from './models/reservation.entity';

@Injectable()
export class ReservationsRepository extends AbstractRepository<ReservationEntity> {
  protected readonly logger = new Logger(ReservationsRepository.name);

  constructor(
    @InjectRepository(ReservationEntity)
    reservationsRepository: Repository<ReservationEntity>,
  ) {
    super(reservationsRepository);
  }
}
```

### Reservations Module

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { DatabaseModule, LoggerModule, AUTH_SERVICE, PAYMENTS_SERVICE } from '@app/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationEntity } from './models/reservation.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([ReservationEntity]),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MYSQL_HOST: Joi.string().required(),
        MYSQL_PORT: Joi.number().required(),
        MYSQL_DATABASE: Joi.string().required(),
        MYSQL_USERNAME: Joi.string().required(),
        MYSQL_PASSWORD: Joi.string().required(),
        MYSQL_SYNCHRONIZE: Joi.boolean().required(),
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
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
```

## 🚀 Running the Application

### 1. Switch to MySQL + TypeORM Branch

```bash
git checkout mysql-typeorm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run MySQL (Docker Compose)

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: sleepr
      MYSQL_USER: sleepr_user
      MYSQL_PASSWORD: sleepr_password
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### 4. Update Environment Variables

**apps/reservations/.env**
```env
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=sleepr_reservations
MYSQL_USERNAME=sleepr_user
MYSQL_PASSWORD=sleepr_password
MYSQL_SYNCHRONIZE=true
PORT=3000
AUTH_HOST=auth
AUTH_PORT=3001
PAYMENTS_HOST=payments
PAYMENTS_PORT=3003
```

**apps/auth/.env**
```env
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=sleepr_auth
MYSQL_USERNAME=sleepr_user
MYSQL_PASSWORD=sleepr_password
MYSQL_SYNCHRONIZE=true
PORT=3001
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
```

⚠️ **Warning**: `MYSQL_SYNCHRONIZE=true` automatically synchronizes schema with database. **DO NOT use this in production!** Use migrations instead.

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

## 📊 Migrations (Production)

### Generate Migration

```bash
npm run typeorm migration:generate -- -n CreateReservationsTable
```

### Run Migrations

```bash
npm run typeorm migration:run
```

### Revert Migration

```bash
npm run typeorm migration:revert
```

### Example Migration

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateReservationsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reservations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'timestamp',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'startDate',
            type: 'datetime',
          },
          {
            name: 'endDate',
            type: 'datetime',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'invoiceId',
            type: 'varchar',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reservations');
  }
}
```

## ✅ Advantages of MySQL + TypeORM

### 1. **ACID Transactions**
- Atomicity, Consistency, Isolation, Durability
- Distributed transactions
- Rollback on error

```typescript
await this.repository.manager.transaction(async (manager) => {
  await manager.save(reservation);
  await manager.save(payment);
});
```

### 2. **Relations**
- One-to-One
- One-to-Many
- Many-to-Many
- Eager/Lazy loading

```typescript
@Entity()
export class User {
  @OneToMany(() => Reservation, reservation => reservation.user)
  reservations: Reservation[];
}

@Entity()
export class Reservation {
  @ManyToOne(() => User, user => user.reservations)
  user: User;
}
```

### 3. **Query Builder**
- Type-safe queries
- Complex SQL queries
- Joins, subqueries

```typescript
const reservations = await this.repository
  .createQueryBuilder('reservation')
  .leftJoinAndSelect('reservation.user', 'user')
  .where('reservation.startDate > :date', { date: new Date() })
  .orderBy('reservation.startDate', 'ASC')
  .getMany();
```

### 4. **Migrations**
- Version control for database
- Safe schema changes
- Rollback possible

### 5. **Indexes**
- Performance optimization
- Unique constraints
- Composite indexes

```typescript
@Entity()
@Index(['email', 'userId'])
export class Reservation {
  @Column()
  @Index()
  email: string;
}
```

### 6. **Data Integrity**
- Foreign keys
- Constraints
- Cascading deletes

```typescript
@ManyToOne(() => User, { onDelete: 'CASCADE' })
user: User;
```

## ⚠️ Disadvantages of MySQL + TypeORM

### 1. **Schema Rigidity**
- Schema changes require migrations
- Less flexible than NoSQL
- Downtime during migrations

### 2. **Horizontal Scaling**
- Harder horizontal scaling
- Sharding more complicated
- Master-slave replication

### 3. **Complex Queries**
- Joins can be expensive
- N+1 problem
- Requires optimization

### 4. **Learning Curve**
- SQL knowledge required
- Understanding relations
- Migrations

## 📊 Comparison: MongoDB vs MySQL

| Aspect | MongoDB (main) | MySQL (typeorm) |
|--------|----------------|-----------------|
| Data model | Document | Relational |
| Schema | Flexible | Rigid |
| Transactions | Limited | Full ACID |
| Joins | Lookup ($lookup) | Native joins |
| Scaling | Horizontal (sharding) | Vertical + replication |
| Query language | MongoDB Query | SQL |
| Relations | Embedded/Referenced | Foreign keys |
| Migrations | Not required | Required |
| Type safety | Mongoose schemas | TypeORM entities |

## 🔍 Advanced TypeORM Features

### Soft Delete

```typescript
@Entity()
export class Reservation extends AbstractEntity {
  @DeleteDateColumn()
  deletedAt?: Date;
}

// Soft delete
await repository.softDelete(id);

// Restore
await repository.restore(id);

// Find with deleted
await repository.find({ withDeleted: true });
```

### Subscribers (Lifecycle hooks)

```typescript
@EventSubscriber()
export class ReservationSubscriber implements EntitySubscriberInterface<Reservation> {
  listenTo() {
    return Reservation;
  }

  beforeInsert(event: InsertEvent<Reservation>) {
    console.log('Before reservation insert:', event.entity);
  }

  afterInsert(event: InsertEvent<Reservation>) {
    console.log('After reservation insert:', event.entity);
  }
}
```

### Custom Repository Methods

```typescript
@Injectable()
export class ReservationsRepository extends AbstractRepository<ReservationEntity> {
  async findUpcoming(): Promise<ReservationEntity[]> {
    return this.repository
      .createQueryBuilder('reservation')
      .where('reservation.startDate > :now', { now: new Date() })
      .orderBy('reservation.startDate', 'ASC')
      .getMany();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ReservationEntity[]> {
    return this.repository
      .createQueryBuilder('reservation')
      .where('reservation.startDate >= :startDate', { startDate })
      .andWhere('reservation.endDate <= :endDate', { endDate })
      .getMany();
  }
}
```

### Transactions

```typescript
async createReservationWithPayment(data: CreateReservationDto) {
  return await this.repository.manager.transaction(async (manager) => {
    const reservation = manager.create(ReservationEntity, data);
    await manager.save(reservation);

    const payment = manager.create(PaymentEntity, {
      reservationId: reservation.id,
      amount: data.amount,
    });
    await manager.save(payment);

    return reservation;
  });
}
```

## 🛠️ Tools

### MySQL Workbench
- Graphical interface for MySQL
- Query builder
- Schema design

### DBeaver
- Universal database tool
- Supports multiple databases
- Free and open-source

### TypeORM CLI

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert

# Show migrations
npm run typeorm migration:show
```

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [SQL Best Practices](https://www.sqlstyle.guide/)

## 🔙 Return to main Branch

```bash
git checkout main
```
