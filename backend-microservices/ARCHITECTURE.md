# Food Delivery Platform - Component Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        CLIENT[Mobile/Web Client]
    end

    subgraph "API Gateway Layer - Port 3000"
        GATEWAY[API Gateway<br/>Express HTTP Proxy<br/>JWT Authentication<br/>Rate Limiting]
    end

    subgraph "Microservices Layer"
        USER[User Service<br/>Port 3001<br/>/api/auth]
        PRODUCT[Product Service<br/>Port 3002<br/>/api/products]
        ORDER[Order Service<br/>Port 3003<br/>/api/orders]
        PAYMENT[Payment Service<br/>Port 3004<br/>/api/payment]
    end

    subgraph "Infrastructure Layer"
        REDIS[(Redis<br/>Cache & Rate Limiting<br/>Port 6379)]
        RABBITMQ[RabbitMQ<br/>Message Queue<br/>Port 5672/15672]
        MONGODB[(MongoDB Atlas<br/>Database)]
    end

    CLIENT -->|HTTP/HTTPS| GATEWAY
    
    GATEWAY -->|/v1/auth| USER
    GATEWAY -->|/v1/products| PRODUCT
    GATEWAY -->|/v1/orders| ORDER
    GATEWAY -->|/v1/payment| PAYMENT

    USER --> MONGODB
    PRODUCT --> MONGODB
    ORDER --> MONGODB
    PAYMENT --> MONGODB

    USER --> REDIS
    PRODUCT --> REDIS
    ORDER --> REDIS
    PAYMENT --> REDIS

    USER --> RABBITMQ
    PRODUCT --> RABBITMQ
    ORDER --> RABBITMQ
    PAYMENT --> RABBITMQ

    GATEWAY --> REDIS

    style GATEWAY fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style USER fill:#50C878,stroke:#2E7D4E,color:#fff
    style PRODUCT fill:#FFB347,stroke:#CC8A38,color:#fff
    style ORDER fill:#FF6B9D,stroke:#CC5679,color:#fff
    style PAYMENT fill:#8E44AD,stroke:#5E2C6F,color:#fff
    style REDIS fill:#DC143C,stroke:#8B0000,color:#fff
    style RABBITMQ fill:#FF6600,stroke:#CC5200,color:#fff
    style MONGODB fill:#4DB33D,stroke:#2E6B26,color:#fff
```

---

## Detailed Service Architecture

### 1. API Gateway (Port 3000)

```mermaid
graph TB
    subgraph "API Gateway Components"
        MIDDLEWARE[Middleware Layer]
        AUTH[Auth Middleware<br/>JWT Validation]
        RATE[Rate Limiter<br/>Redis Store]
        PROXY[HTTP Proxy Router]
    end

    MIDDLEWARE --> AUTH
    MIDDLEWARE --> RATE
    MIDDLEWARE --> PROXY

    PROXY -->|Route /v1/auth| USER_SVC[User Service:3001]
    PROXY -->|Route /v1/products| PROD_SVC[Product Service:3002]
    PROXY -->|Route /v1/orders| ORD_SVC[Order Service:3003]
    PROXY -->|Route /v1/payment| PAY_SVC[Payment Service:3004]

    AUTH -->|Verify Token| REDIS_CACHE[(Redis)]
    RATE -->|Track Requests| REDIS_CACHE

    style MIDDLEWARE fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style AUTH fill:#9370DB,stroke:#5E3A8C,color:#fff
    style RATE fill:#FF6347,stroke:#CC4E39,color:#fff
    style PROXY fill:#20B2AA,stroke:#147A75,color:#fff
```

**Responsibilities:**
- Route requests to appropriate microservices
- JWT token validation and user authentication
- Rate limiting (100 requests per 15 minutes)
- Attach user context headers (x-user-id, x-user-role)
- Centralized error handling and logging

**Technologies:**
- Express.js
- express-http-proxy
- Redis for rate limiting
- Winston for logging
- Helmet for security

---

### 2. User Service (Port 3001)

```mermaid
graph TB
    subgraph "User Service Architecture"
        ROUTES_U[Routes<br/>/api/auth]
        CONTROLLER_U[User Controller]
        MIDDLEWARE_U[Auth Middleware<br/>Rate Limiter]
        MODEL_U[(User Model<br/>MongoDB)]
        UTILS_U[Utils<br/>Token Generation<br/>Validation<br/>Logger]
    end

    ROUTES_U --> MIDDLEWARE_U
    MIDDLEWARE_U --> CONTROLLER_U
    CONTROLLER_U --> MODEL_U
    CONTROLLER_U --> UTILS_U

    style ROUTES_U fill:#50C878,stroke:#2E7D4E,color:#fff
    style CONTROLLER_U fill:#3CB371,stroke:#2E7D4E,color:#fff
    style MODEL_U fill:#228B22,stroke:#154F15,color:#fff
```

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

**Features:**
- User authentication (register/login)
- JWT token generation
- Password hashing with bcrypt
- Role-based access (user, restaurant, delivery)
- Redis caching
- Rate limiting on sensitive endpoints

**Database Schema:**
- User: userId, email, password, role, profile info

---

### 3. Product Service (Port 3002)

```mermaid
graph TB
    subgraph "Product Service Architecture"
        ROUTES_P[Routes<br/>/api/products]
        CONTROLLER_P[Product Controller]
        MIDDLEWARE_P[Auth Middleware<br/>Upload Middleware]
        MODEL_P[(Product Model<br/>MongoDB)]
        CACHE_P[Redis Cache Layer]
    end

    ROUTES_P --> MIDDLEWARE_P
    MIDDLEWARE_P --> CONTROLLER_P
    CONTROLLER_P --> CACHE_P
    CACHE_P --> MODEL_P

    style ROUTES_P fill:#FFB347,stroke:#CC8A38,color:#fff
    style CONTROLLER_P fill:#FFA500,stroke:#CC8400,color:#fff
    style MODEL_P fill:#FF8C00,stroke:#CC7000,color:#fff
```

**Endpoints:**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/restaurant/:restaurantId` - Get products by restaurant
- `GET /api/products/category/:categoryName` - Get products by category
- `POST /api/products` - Create product (admin/restaurant)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/upload` - Upload product image

**Features:**
- Product catalog management
- Category filtering
- Restaurant-based product queries
- Image upload support
- Redis caching for fast retrieval
- RabbitMQ integration

**Database Schema:**
- Product: productId, name, price, description, category, restaurantId, image

---

### 4. Order Service (Port 3003)

```mermaid
graph TB
    subgraph "Order Service Architecture"
        ROUTES_O[Routes<br/>/api/orders]
        CONTROLLER_O[Order Controller]
        MIDDLEWARE_O[Auth Middleware<br/>Validation Middleware]
        MODEL_O[(Order Model<br/>MongoDB)]
        CONFIG_O[Order Config<br/>Status Flow<br/>Modification Deadline]
    end

    ROUTES_O --> MIDDLEWARE_O
    MIDDLEWARE_O --> CONTROLLER_O
    CONTROLLER_O --> MODEL_O
    CONTROLLER_O --> CONFIG_O

    style ROUTES_O fill:#FF6B9D,stroke:#CC5679,color:#fff
    style CONTROLLER_O fill:#FF1493,stroke:#CC1076,color:#fff
    style MODEL_O fill:#C71585,stroke:#8B0A50,color:#fff
```

**Endpoints:**
- `POST /api/orders/create` - Create new order
- `GET /api/orders/user` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/restaurant/:restaurantId` - Get restaurant orders
- `GET /api/orders/postal-code/:postalCode` - Get orders by postal code (delivery)
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id` - Modify pending order
- `PUT /api/orders/:id/update` - Update order (restaurant/delivery)

**Features:**
- Order creation with item details and pricing
- Order status workflow management
- Pending order modification (time-limited)
- Restaurant order management
- Delivery assignment by postal code
- Role-based status transitions
- No external service dependencies (self-contained)

**Order Status Flow:**
- User: Pending → Cancelled
- Restaurant: Pending → Confirmed → Preparing → Ready
- Delivery: Ready → Out for Delivery → Delivered

**Database Schema:**
- Order: orderID, userID, restaurantID, items[], totalAmount, status, postal_code, paymentStatus, modification_deadline

---

### 5. Payment Service (Port 3004)

```mermaid
graph TB
    subgraph "Payment Service Architecture"
        ROUTES_PAY[Routes<br/>/api/payment]
        CONTROLLER_PAY[Payment Controller]
        MIDDLEWARE_PAY[Auth Middleware]
        MODEL_PAY[(Payment Model<br/>MongoDB)]
    end

    ROUTES_PAY --> MIDDLEWARE_PAY
    MIDDLEWARE_PAY --> CONTROLLER_PAY
    CONTROLLER_PAY --> MODEL_PAY

    style ROUTES_PAY fill:#8E44AD,stroke:#5E2C6F,color:#fff
    style CONTROLLER_PAY fill:#9B59B6,stroke:#6C3A80,color:#fff
    style MODEL_PAY fill:#7D3C98,stroke:#4E2560,color:#fff
```

**Endpoints:**
- `POST /api/payment` - Create payment
- `GET /api/payment/:orderId` - Get payment by order ID

**Features:**
- Payment record creation
- Payment method tracking
- Payment status management
- Transaction ID support
- Order-based payment queries

**Payment Methods:**
- Credit/Debit Card
- Cash/COD
- E-Wallets (Momo, ZaloPay, VNPay)
- Bank Transfer

**Payment Status:**
- pending (default)
- completed
- failed

**Database Schema:**
- Payment: orderId, paymentMethod, amount, status, transactionId

---

## Data Flow Diagrams

### Order Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Order
    participant MongoDB

    Client->>Gateway: POST /v1/orders/create<br/>{restaurantID, items[], postal_code}
    Gateway->>Gateway: Validate JWT Token
    Gateway->>Gateway: Attach user headers
    Gateway->>Order: Forward to /api/orders/create
    Order->>Order: Validate request data
    Order->>Order: Calculate total amount
    Order->>Order: Generate orderID (ORD-xxx)
    Order->>MongoDB: Save order
    MongoDB-->>Order: Order saved
    Order-->>Gateway: Return order details
    Gateway-->>Client: 201 Created
```

### Payment Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Payment
    participant MongoDB

    Client->>Gateway: POST /v1/payment<br/>{orderId, paymentMethod, amount}
    Gateway->>Gateway: Validate JWT Token
    Gateway->>Payment: Forward to /api/payment
    Payment->>Payment: Validate payment data
    Payment->>MongoDB: Save payment (status: pending)
    MongoDB-->>Payment: Payment saved
    Payment-->>Gateway: Return payment details
    Gateway-->>Client: 201 Created
```

---

## Infrastructure Components

### Redis

**Purpose:**
- Rate limiting storage
- Session caching
- API response caching

**Port:** 6379

**Used By:** All services + API Gateway

---

### RabbitMQ

**Purpose:**
- Asynchronous message queue
- Event-driven communication
- Service decoupling

**Ports:** 
- 5672 (AMQP)
- 15672 (Management UI)

**Used By:** All microservices

---

### MongoDB Atlas

**Purpose:**
- Primary data storage
- Document-based NoSQL database

**Collections:**
- users
- products
- orders
- payments

**Used By:** All microservices (shared database)

---

## Key Architectural Decisions

### ✅ Strengths

1. **API Gateway Pattern**: Centralized entry point with authentication and rate limiting
2. **Independent Services**: Each microservice is self-contained with its own logic
3. **Shared Infrastructure**: Redis and RabbitMQ for caching and messaging
4. **Role-Based Access**: User, restaurant, and delivery roles with proper authorization
5. **Custom ID Format**: Order service uses custom IDs (ORD-xxx) for better readability

### ⚠️ Considerations

1. **Shared Database**: All services use the same MongoDB instance (not truly independent databases)
2. **No Service Discovery**: Services have hardcoded URLs
3. **Synchronous Communication**: No async event-driven architecture between services
4. **No Circuit Breaker**: No fault tolerance mechanism for service failures

---

## Technology Stack Summary

| Component | Technologies |
|-----------|-------------|
| **Runtime** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Cache** | Redis |
| **Message Queue** | RabbitMQ |
| **Authentication** | JWT |
| **Logging** | Winston |
| **Security** | Helmet, CORS |
| **Validation** | express-validator |
| **Containerization** | Docker, Docker Compose |

---

## Port Mapping

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| API Gateway | 3000 | 3000 |
| User Service | 3001 | - |
| Product Service | 3002 | - |
| Order Service | 3003 | - |
| Payment Service | 3004 | - |
| Redis | 6379 | 6379 |
| RabbitMQ | 5672, 15672 | 5672, 15672 |
