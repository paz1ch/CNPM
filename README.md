# Food Delivery Microservices System

## Technology Stack
- Frontend: React.js with Vite
- Backend: Express.js microservices
- Database: MongoDB
- Tools: Postman, RabbitMQ
- Authentication: JWT

## System Architecture

This project implements a microservices-based food delivery system with the following components:

### 1. API Gateway (`api-gateway`)
- Entry point for all client requests
- Routes requests to appropriate services
- Handles authentication token validation
- Port: 5000

### 2. User Service (`user-service`)
- Manages user accounts and authentication
- Handles user registration and login
- Manages user profiles and preferences
- Port: 5001

Key Features:
- JWT-based authentication
- Password hashing with bcrypt
- Refresh token management
- User role management (customer, admin)

### 3. Product Service (`product-service`)
- Manages food products and categories
- Handles menu items 
- Manages product availability
- Port: 5002

Key Features:
- Product CRUD operations
- Category management
- Product search and filtering
- Image management

### 4. Order Service (`order-service`)
- Processes and manages food orders
- Tracks order status and history
- Handles order modifications and cancellations
- Port: 5003

Key Features:
- Order creation and management
- Real-time order status updates
- Order history tracking
- Integration with payment service

### 5. Payment Service (`payment-service`)
- Processes payments
- Manages payment status
- Handles refunds and payment confirmations
- Port: 5004

Key Features:
- Secure payment processing
- Multiple payment method support
- Payment status tracking
- Refund handling

## API Documentation

### User Service API

#### Authentication
```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "user|admin"
}

Response: 201 Created
{
    "userId": "string",
    "token": "string"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "string",
    "password": "string"
}

Response: 200 OK
{
    "token": "string",
    "user": {
        "id": "string",
        "username": "string",
        "role": "string"
    }
}
```

### Product Service API

#### Product Management
```http
POST /api/products
Content-Type: application/json
Authorization: Bearer {token}

{
    "name": "string",
    "description": "string",
    "price": number,
    "category": "string",
    "image_url": "string"
}

Response: 201 Created
{
    "id": "string",
    "name": "string",
    "price": number
}
```

```http
GET /api/products
Authorization: Bearer {token}

Response: 200 OK
{
    "items": [
        {
            "id": "string",
            "name": "string",
            "description": "string",
            "price": number,
            "category": "string"
        }
    ]
}
```

### Order Service API

#### Order Management
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer {token}

{
    "items": [
        {
            "productId": "string",
            "quantity": number
        }
    ],
    "deliveryAddress": {
        "street": "string",
        "city": "string",
        "postalCode": "string"
    }
}

Response: 201 Created
{
    "orderId": "string",
    "status": "PENDING",
    "totalAmount": number
}
```

```http
PUT /api/orders/{orderId}/status
Content-Type: application/json
Authorization: Bearer {token}

{
    "status": "PREPARING|READY|DELIVERED|CANCELLED"
}

Response: 200 OK
{
    "orderId": "string",
    "status": "string",
    "updatedAt": "string"
}
```

### Payment Service API

#### Payment Processing
```http
POST /api/payments
Content-Type: application/json
Authorization: Bearer {token}

{
    "orderId": "string",
    "amount": number,
    "method": "CARD|CASH"
}

Response: 201 Created
{
    "paymentId": "string",
    "status": "PENDING|COMPLETED",
    "transactionId": "string"
}
```

## Error Handling

All services follow a standard error response format:

```json
{
    "error": {
        "code": "string",
        "message": "string",
        "details": {} // optional
    }
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Setup & Installation

1. Prerequisites:
   - Node.js ≥ 14
   - MongoDB ≥ 4.4
   - RabbitMQ

2. Environment Setup:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd CNPM

   # Install dependencies for all services
   cd api-gateway && npm install
   cd ../user-service && npm install
   cd ../product-service && npm install
   cd ../order-service && npm install
   cd ../payment-service && npm install
   ```

3. Environment Variables:
   Create `.env` files in each service directory with:
   ```
   PORT=service_port
   MONGODB_URI=mongodb://localhost:27017/service_name
   JWT_SECRET=your_jwt_secret
   RABBITMQ_URL=amqp://localhost
   ```

4. Start Services:
   ```bash
   # In separate terminals
   cd api-gateway && npm run dev
   cd user-service && npm run dev
   cd product-service && npm run dev
   cd order-service && npm run dev
   cd payment-service && npm run dev
   ```

## Security Features

1. Authentication:
   - JWT tokens with expiration
   - Refresh token rotation
   - Password hashing with bcrypt

2. Authorization:
   - Role-based access control
   - Resource-level permissions
   - Request validation

3. Data Protection:
   - Input sanitization
   - CORS configuration
   - Rate limiting

## Monitoring & Logging

Each service implements:
- Health check endpoints (/health)
- Winston logging
- Request tracing
- Error tracking

## Frontend Features

1. User Interface:
   - Responsive design
   - Cart management
   - Order tracking
   - User profile management

2. Performance:
   - Lazy loading
   - State management with Context API
   - Optimized image loading
   - Error boundary implementation

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Create pull request

## License

ISC
