# Hệ thống Đặt đồ ăn - Kiến trúc Microservices

Dự án này là một hệ thống đặt đồ ăn hoàn chỉnh được xây dựng dựa trên kiến trúc microservices. Hệ thống bao gồm các dịch vụ backend độc lập để xử lý người dùng, sản phẩm, đơn hàng và thanh toán

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
Đảm bảo Docker Desktop đang chạy

#### Build và chạy tất cả services
```bash
docker-compose up -d --build
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
  "role": "user"  // user, restaurant, delivery, admin
}
```

#### Request Body - Login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Order Status Flow
- **User:** Pending → Cancelled
- **Restaurant:** Pending → Confirmed → Preparing → Ready
- **Delivery:** Ready → Out for Delivery → Delivered



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

