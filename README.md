# Hệ thống Đặt đồ ăn - Kiến trúc Microservices

Dự án này là một hệ thống đặt đồ ăn hoàn chỉnh được xây dựng dựa trên kiến trúc microservices. Hệ thống bao gồm các dịch vụ backend độc lập để xử lý người dùng, sản phẩm, đơn hàng và thanh toán.

---

## 📋 Tính năng chính

### Backend Microservices
- **API Gateway:** Điểm vào duy nhất, xác thực JWT, rate limiting và định tuyến
- **Xác thực người dùng:** Đăng ký, đăng nhập, quản lý thông tin người dùng với JWT và Argon2
- **Quản lý sản phẩm:** CRUD sản phẩm, phân loại theo danh mục, upload ảnh
- **Quản lý đơn hàng:** Tạo đơn, theo dõi trạng thái theo workflow, phân quyền theo role
- **Thanh toán:** Tích hợp nhiều phương thức thanh toán (Card, Cash, Momo, ZaloPay, VNPay)

### Hệ thống phân quyền (Role-based)
- **User:** Tạo đơn hàng, chỉnh sửa đơn pending, hủy đơn
- **Restaurant:** Xác nhận, chuẩn bị và hoàn thành đơn hàng
- **Delivery:** Giao hàng theo mã bưu điện, cập nhật trạng thái giao hàng

---

## 🏗️ Kiến trúc hệ thống

```mermaid
graph TB
    subgraph "Client Layer"
        CLIENT[Mobile/Web Client]
    end

    subgraph "API Gateway - Port 3000"
        GATEWAY[API Gateway<br/>JWT Auth<br/>Rate Limiting<br/>HTTP Proxy]
    end

    subgraph "Microservices"
        USER[User Service<br/>Port 3001]
        PRODUCT[Product Service<br/>Port 3002]
        ORDER[Order Service<br/>Port 3003]
        PAYMENT[Payment Service<br/>Port 3004]
    end

    subgraph "Infrastructure"
        REDIS[(Redis<br/>Cache & Rate Limit)]
        RABBITMQ[RabbitMQ<br/>Message Queue]
        MONGODB[(MongoDB Atlas<br/>Database)]
    end

    CLIENT --> GATEWAY
    GATEWAY --> USER
    GATEWAY --> PRODUCT
    GATEWAY --> ORDER
    GATEWAY --> PAYMENT

    USER --> MONGODB
    PRODUCT --> MONGODB
    ORDER --> MONGODB
    PAYMENT --> MONGODB

    GATEWAY --> REDIS
    USER --> REDIS
    PRODUCT --> REDIS
    ORDER --> REDIS
    PAYMENT --> REDIS

    USER --> RABBITMQ
    PRODUCT --> RABBITMQ
    ORDER --> RABBITMQ
    PAYMENT --> RABBITMQ
```

### Tài liệu chi tiết
Xem [ARCHITECTURE.md](backend-microservices/ARCHITECTURE.md) để biết thêm chi tiết về kiến trúc hệ thống, data flow và component diagram.

---

## 🛠️ Công nghệ sử dụng

### Backend Stack
| Công nghệ | Mô tả |
|-----------|-------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas (NoSQL) |
| **Cache** | Redis |
| **Message Queue** | RabbitMQ |
| **Authentication** | JWT (JSON Web Tokens) |
| **Password Hashing** | Argon2 |
| **Logging** | Winston |
| **Security** | Helmet, CORS |
| **Validation** | Joi, express-validator |
| **Containerization** | Docker, Docker Compose |

### Dependencies chính
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `ioredis` - Redis client
- `amqplib` - RabbitMQ client
- `jsonwebtoken` - JWT implementation
- `argon2` - Password hashing
- `express-http-proxy` - HTTP proxy cho API Gateway
- `express-rate-limit` - Rate limiting
- `multer` - File upload middleware

---

## 🚀 Hướng dẫn Cài đặt và Chạy dự án

### Yêu cầu hệ thống
- Docker Desktop
- Git
- Node.js 18+ (nếu chạy local không dùng Docker)

### 1. Clone repository
```bash
git clone https://github.com/paz1ch/CNPM.git
cd CNPM/backend-microservices
```

### 2. Cấu hình môi trường
Mỗi microservice đã có file `.env`. Các biến môi trường chính:

#### API Gateway (`.env`)
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
ORDER_SERVICE_URL=http://order-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq:5672
```

#### User/Product/Order/Payment Services (`.env`)
```env
PORT=3001  # 3002, 3003, 3004 tương ứng
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq:5672
JWT_SECRET=your_jwt_secret_here
```

### 3. Chạy với Docker Compose

#### Mở Docker Desktop
Đảm bảo Docker Desktop đang chạy trước khi thực hiện các lệnh sau.

#### Build và chạy tất cả services
```bash
# Từ thư mục backend-microservices
docker-compose up -d --build
```

Hoặc chạy từng bước:
```bash
# Build images
docker-compose build

# Chạy containers
docker-compose up -d
```

#### Kiểm tra trạng thái
```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f api-gateway

# Kiểm tra containers đang chạy
docker-compose ps
```

#### Dừng services
```bash
# Dừng containers
docker-compose down

# Dừng và xóa volumes
docker-compose down -v
```

### 4. Chạy local (không dùng Docker)

#### Cài đặt dependencies cho tất cả services
```bash
# Từ thư mục backend-microservices
cd api-gateway && npm install
cd ../user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install
```

#### Chạy Redis và RabbitMQ (cần thiết)
```bash
# Sử dụng Docker cho Redis và RabbitMQ
docker run -d -p 6379:6379 redis:alpine
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

#### Chạy từng service
```bash
# Terminal 1 - User Service
cd user-service
npm run dev

# Terminal 2 - Product Service
cd product-service
npm run dev

# Terminal 3 - Order Service
cd order-service
npm run dev

# Terminal 4 - Payment Service
cd payment-service
npm run dev

# Terminal 5 - API Gateway
cd api-gateway
npm run dev
```

---

## 📡 API Endpoints

### API Gateway URL
```
http://localhost:3000
```

### 1. User Service (`/v1/auth`)
| Method | Endpoint | Mô tả | Authentication |
|--------|----------|-------|----------------|
| POST | `/v1/auth/register` | Đăng ký người dùng mới | ❌ |
| POST | `/v1/auth/login` | Đăng nhập | ❌ |
| GET | `/v1/auth/profile` | Lấy thông tin profile | ✅ |
| PUT | `/v1/auth/profile` | Cập nhật profile | ✅ |

#### Request Body - Register
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nguyen Van A",
  "role": "user"  // user, restaurant, delivery
}
```

#### Request Body - Login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Product Service (`/v1/products`)
| Method | Endpoint | Mô tả | Authentication |
|--------|----------|-------|----------------|
| GET | `/v1/products` | Lấy tất cả sản phẩm | ❌ |
| GET | `/v1/products/:id` | Lấy sản phẩm theo ID | ❌ |
| GET | `/v1/products/restaurant/:restaurantId` | Lấy sản phẩm theo nhà hàng | ❌ |
| GET | `/v1/products/category/:categoryName` | Lấy sản phẩm theo danh mục | ❌ |
| POST | `/v1/products` | Tạo sản phẩm mới | ✅ (admin/restaurant) |
| PUT | `/v1/products/:id` | Cập nhật sản phẩm | ✅ (admin/restaurant) |
| DELETE | `/v1/products/:id` | Xóa sản phẩm | ✅ (admin/restaurant) |
| POST | `/v1/products/upload` | Upload ảnh sản phẩm | ✅ (admin/restaurant) |

### 3. Order Service (`/v1/orders`)
| Method | Endpoint | Mô tả | Role |
|--------|----------|-------|------|
| POST | `/v1/orders` | Tạo đơn hàng mới | user |
| GET | `/v1/orders/user` | Lấy đơn hàng của user | user |
| GET | `/v1/orders/:id` | Lấy đơn hàng theo ID | user/restaurant/delivery |
| GET | `/v1/orders/restaurant/:restaurantId` | Lấy đơn hàng của nhà hàng | restaurant |
| GET | `/v1/orders/postal-code/:postalCode` | Lấy đơn hàng theo mã bưu điện | delivery |
| PUT | `/v1/orders/:id/status` | Cập nhật trạng thái đơn hàng | user/restaurant/delivery |
| PUT | `/v1/orders/:id` | Chỉnh sửa đơn pending | user |
| PUT | `/v1/orders/:id/update` | Cập nhật đơn hàng | restaurant/delivery |

#### Request Body - Create Order
```json
{
  "restaurantID": "RESTO123",
  "postal_code_of_restaurant": "100000",
  "items": [
    {
      "menuItemId": "MENU001",
      "quantity": 2,
      "price": 50000
    }
  ]
}
```

#### Order Status Flow
- **User:** Pending → Cancelled
- **Restaurant:** Pending → Confirmed → Preparing → Ready
- **Delivery:** Ready → Out for Delivery → Delivered

### 4. Payment Service (`/v1/payment`)
| Method | Endpoint | Mô tả | Authentication |
|--------|----------|-------|----------------|
| POST | `/v1/payment` | Tạo payment mới | ✅ |
| GET | `/v1/payment/:orderId` | Lấy payment theo order ID | ✅ |

#### Request Body - Create Payment
```json
{
  "orderId": "674f8b5c8a9d123456789abc",
  "paymentMethod": "Momo",  // Credit Card, Cash, Momo, ZaloPay, VNPay, Bank Transfer
  "amount": 210000
}
```

#### Payment Methods
- Credit Card / Debit Card
- Cash / COD (Cash on Delivery)
- E-Wallets: Momo, ZaloPay, VNPay
- Bank Transfer

---

## 🔐 Authentication

### Headers cần thiết cho các request có authentication
```
Authorization: Bearer <JWT_TOKEN>
x-user-id: <USER_ID>
x-user-role: <ROLE>  // user, restaurant, delivery
Content-Type: application/json
```

### Lấy JWT Token
1. Đăng ký hoặc đăng nhập qua `/v1/auth/register` hoặc `/v1/auth/login`
2. Response sẽ trả về `token`
3. Sử dụng token trong header `Authorization: Bearer <token>` cho các request tiếp theo

---

## 📊 Port Mapping

| Service | Internal Port | External Port | Mô tả |
|---------|---------------|---------------|-------|
| API Gateway | 3000 | 3000 | Điểm vào duy nhất |
| User Service | 3001 | - | Internal only |
| Product Service | 3002 | - | Internal only |
| Order Service | 3003 | - | Internal only |
| Payment Service | 3004 | - | Internal only |
| Redis | 6379 | 6379 | Cache & Rate Limiting |
| RabbitMQ | 5672, 15672 | 5672, 15672 | Message Queue & Management UI |

**Chú ý:** Chỉ API Gateway được expose ra ngoài (port 3000). Các microservices khác chỉ giao tiếp nội bộ qua Docker network.

---

## 🧪 Testing

### Postman Collections
Mỗi service có file `POSTMAN_TEST_DATA.md` chứa các test case mẫu:
- [Order Service Test Data](backend-microservices/order-service/POSTMAN_TEST_DATA.md)
- [Payment Service Test Data](backend-microservices/payment-service/POSTMAN_TEST_DATA.md)

### Seed Data
User Service có script seed data:
```bash
cd user-service
npm run seed
```

### Test Flow hoàn chỉnh
```
1. Register User → POST /v1/auth/register
2. Login → POST /v1/auth/login → Nhận JWT token
3. Browse Products → GET /v1/products
4. Create Order → POST /v1/orders
5. Create Payment → POST /v1/payment
6. Restaurant confirms → PUT /v1/orders/:id/status
7. Track order → GET /v1/orders/:id
```

---

## 📁 Cấu trúc thư mục

```
backend-microservices/
├── api-gateway/          # API Gateway service
│   ├── src/
│   │   ├── middleware/   # Auth, rate limiting
│   │   ├── utils/        # Logger
│   │   └── server.js     # Main entry point
│   ├── Dockerfile
│   └── package.json
│
├── user-service/         # User authentication service
│   ├── src/
│   │   ├── config/       # Database, Redis config
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, validation
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Helper functions
│   │   └── server.js
│   ├── seed.js           # Seed data script
│   └── Dockerfile
│
├── product-service/      # Product management service
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   └── Dockerfile
│
├── order-service/        # Order management service
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── POSTMAN_TEST_DATA.md
│   └── Dockerfile
│
├── payment-service/      # Payment processing service
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── POSTMAN_TEST_DATA.md
│   └── Dockerfile
│
├── docker-compose.yml    # Docker orchestration
└── ARCHITECTURE.md       # Detailed architecture docs
```

---

## 🔧 Troubleshooting

### 1. Không kết nối được MongoDB
- Kiểm tra `MONGO_URI` trong file `.env`
- Đảm bảo MongoDB Atlas cho phép kết nối từ IP của bạn
- Kiểm tra username/password trong connection string

### 2. Redis connection refused
```bash
# Kiểm tra Redis container
docker ps | grep redis

# Restart Redis
docker-compose restart redis
```

### 3. RabbitMQ không khả dụng
```bash
# Kiểm tra RabbitMQ
docker-compose logs rabbitmq

# Access Management UI
http://localhost:15672 (guest/guest)
```

### 4. Port đã được sử dụng
```bash
# Tìm process đang dùng port
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F
```

### 5. Xem logs chi tiết
```bash
# Logs của tất cả services
docker-compose logs -f

# Logs của một service
docker-compose logs -f user-service

# Xem error logs
docker-compose logs | grep ERROR
```

---

## 🎯 Tính năng nổi bật

### 1. API Gateway Pattern
- Single entry point cho tất cả requests
- Centralized authentication và authorization
- Rate limiting (100 requests/15 phút)
- Request logging và monitoring

### 2. Security Best Practices
- JWT token authentication
- Password hashing với Argon2
- Helmet.js cho HTTP security headers
- CORS configuration
- Input validation với Joi và express-validator

### 3. Caching Strategy
- Redis caching cho API responses
- Cache invalidation
- Session management

### 4. Message Queue
- RabbitMQ cho async communication
- Event-driven architecture
- Service decoupling

### 5. Order Management
- Custom order ID format (ORD-xxx)
- Role-based status transitions
- Pending order modification (time-limited)
- Delivery assignment by postal code

---

## 📚 Tài liệu tham khảo

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Docker Documentation](https://docs.docker.com/)
- [JWT.io](https://jwt.io/)

---

## 👥 Đóng góp

Dự án được phát triển bởi nhóm CNPM - Food Delivery Platform.

### Repository
```
https://github.com/paz1ch/CNPM
```

---

## 📝 License

ISC

---

## 🔄 Changelog

### Version 1.0.0
- ✅ API Gateway với JWT authentication và rate limiting
- ✅ User Service với Argon2 password hashing
- ✅ Product Service với image upload
- ✅ Order Service với workflow management
- ✅ Payment Service với multiple payment methods
- ✅ Docker Compose setup
- ✅ Redis caching
- ✅ RabbitMQ integration
- ✅ MongoDB Atlas integration

---

## 🎓 Ghi chú phát triển

### Best Practices được áp dụng
1. **Separation of Concerns:** Mỗi service độc lập và có trách nhiệm riêng
2. **Code Organization:** Cấu trúc thư mục rõ ràng (controllers, models, routes, utils)
3. **Error Handling:** Centralized error handling
4. **Logging:** Winston logger với separate log files
5. **Environment Variables:** Configuration qua .env files
6. **Containerization:** Docker cho consistent deployment
7. **API Versioning:** `/v1/` prefix cho API routes

### Hướng phát triển tiếp theo
- [ ] Service Discovery (Consul, Eureka)
- [ ] Circuit Breaker pattern (hystrix)
- [ ] Distributed tracing (Jaeger, Zipkin)
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Unit & Integration tests
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment
- [ ] Monitoring & Alerting (Prometheus, Grafana)
- [ ] Database per service pattern
- [ ] Event sourcing
- [ ] CQRS pattern
