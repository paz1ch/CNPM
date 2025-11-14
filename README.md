# Hệ thống Đặt đồ ăn - Kiến trúc Microservices

Dự án này là một hệ thống đặt đồ ăn hoàn được xây dựng dựa trên kiến trúc microservice. Hệ thống bao gồm các dịch vụ backend độc lập để xử lý người dùng, sản phẩm, đơn hàng, và một ứng dụng frontend được xây dựng bằng React.

## Tính năng chính

- **Frontend:** Giao diện người dùng đáp ứng (responsive) để duyệt sản phẩm, quản lý giỏ hàng, đặt hàng và xem lịch sử.
- **Xác thực người dùng:** Đăng ký, đăng nhập, và quản lý thông tin người dùng với JWT.
- **Quản lý sản phẩm:** Thêm, sửa, xóa và xem các sản phẩm đồ ăn.
- **Quản lý đơn hàng:** Tạo đơn hàng, theo dõi trạng thái và xem lịch sử đặt hàng.
- **Thanh toán:** Tích hợp cổng thanh toán (mô phỏng).

---

## Kiến trúc hệ thống

Hệ thống bao gồm các microservice sau:

- **API Gateway (`api-gateway`):** Điểm vào duy nhất cho tất cả các yêu cầu từ client. Chịu trách nhiệm định tuyến, xác thực và rate limiting.
- **User Service (`user-service`):** Quản lý tất cả logic liên quan đến người dùng, bao gồm đăng ký, đăng nhập và thông tin người dùng.
- **Product Service (`product-service`):** Quản lý thông tin về sản phẩm và danh mục.
- **Order Service (`order-service`):** Xử lý logic đặt hàng, giỏ hàng và lịch sử đơn hàng.
- **Payment Service (`payment-service`):** Xử lý các giao dịch thanh toán.
- **Frontend (`frontend`):** Ứng dụng React cung cấp giao diện người dùng cho khách hàng.

---

## Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Frontend:** 
- **Cơ sở dữ liệu:** MongoDB (với Mongoose), Redis (cho caching và rate limiting)
- **Giao tiếp giữa các service:** REST API
- **Bảo mật:** JWT (JSON Web Tokens), Helmet
- **Tools:** Docker, Postman, Winston (logging)

---

## Hướng dẫn Cài đặt và Chạy dự án

### Yêu cầu tiên quyết

- [Node.js](https://nodejs.org/) (phiên bản 16.x trở lên)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [Redis](https://redis.io/docs/getting-started/installation/)

### 1. Tải mã nguồn

```bash
git clone <https://github.com/paz1ch/CNPM.git>
cd CNPM
```

### 2. Cài đặt phụ thuộc (Dependencies)

Dự án này bao gồm nhiều service, mỗi service có các phụ thuộc riêng. Bạn cần cài đặt cho tất cả.

Để tiết kiệm thời gian, bạn có thể mở nhiều cửa sổ terminal, mỗi cửa sổ cho một thư mục service và chạy `npm install` song song.

```bash
# Trong thư mục gốc /CNPM

# Terminal 1: API Gateway
cd backend-microservices/api-gateway && npm install

# Terminal 2: User Service
cd backend-microservices/user-service && npm install

# Terminal 3: Product Service
cd backend-microservices/product-service && npm install

# Terminal 4: Order Service
cd backend-microservices/order-service && npm install

# Terminal 5: Payment Service
cd backend-microservices/payment-service && npm install

# Terminal 6: Frontend
cd frontend && npm install
```

### 3. Cấu hình biến môi trường

Mỗi service backend cần một tệp `.env` để hoạt động. Hãy sao chép từ tệp `.env.example` (nếu có) hoặc tạo một tệp `.env` mới trong thư mục gốc của mỗi service và điền các giá trị phù hợp.

**Ví dụ cho `user-service/.env`:**
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/user-service
JWT_SECRET=your_jwt_secret
```

**Ví dụ cho `product-service/.env`:**
```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/product-service
REDIS_URL=redis://localhost:6379
```

**Ví dụ cho `order-service/.env`:**
```env
PORT=5003
MONGO_URI=mongodb://localhost:27017/order-service
JWT_SECRET=your_jwt_secret
AUTH_SERVICE_URL=http://localhost:5001
RESTAURANT_SERVICE_URL=http://localhost:5002
```
*(Lặp lại tương tự cho các service khác)*

### 4. Chạy ứng dụng (Chế độ Development)

Bạn cần chạy tất cả các service cùng một lúc. Hãy mở các cửa sổ terminal riêng biệt cho mỗi service.

```bash
# Terminal 1: API Gateway
cd backend-microservices/api-gateway && npm run dev

# Terminal 2: User Service
cd backend-microservices/user-service && npm run dev

# Terminal 3: Product Service
cd backend-microservices/product-service && npm run dev

# Terminal 4: Order Service
cd backend-microservices/order-service && npm run dev

# Terminal 5: Payment Service
cd backend-microservices/payment-service && npm run dev

# Terminal 6: Frontend
cd frontend && npm run dev
```

Sau khi tất cả đã khởi động:
- **Backend** sẽ có sẵn tại các cổng tương ứng (5000, 5001, ...).
- **Frontend** sẽ có thể truy cập tại `http://localhost:5173` (hoặc một cổng khác do Vite chỉ định).

## API Documentation

*(Phần này có thể được giữ nguyên hoặc mở rộng với các công cụ như Swagger/OpenAPI)*

### User Service API

#### Đăng ký
`POST /api/auth/register`
```json
{
    "username": "string",
    "email": "string",
aliqua",
    "password": "string",
    "role": "user|admin"
}
```

#### Đăng nhập
`POST /api/auth/login`
```json
{
    "email": "string",
    "password": "string"
}
```

... (giữ nguyên phần còn lại của tài liệu API) ...
