# Hệ thống Đặt đồ ăn - Kiến trúc Microservices

Dự án này là một hệ thống đặt đồ ăn hoàn được xây dựng dựa trên kiến trúc microservice. Hệ thống bao gồm các dịch vụ backend độc lập để xử lý người dùng, sản phẩm, đơn hàng, và một ứng dụng frontend được xây dựng bằng React (chưa hoàn thiện)

## Tính năng chính

- **Frontend:** Giao diện người dùng đáp ứng (responsive) để duyệt sản phẩm, quản lý giỏ hàng, đặt hàng và xem lịch sử
- **Xác thực người dùng:** Đăng ký, đăng nhập, và quản lý thông tin người dùng với JWT
- **Quản lý sản phẩm:** Thêm, sửa, xóa và xem các sản phẩm đồ ăn
- **Quản lý đơn hàng:** Tạo đơn hàng, theo dõi trạng thái và xem lịch sử đặt hàng
- **Thanh toán:** Tích hợp cổng thanh toán (mô phỏng)

---

## Kiến trúc hệ thống

Hệ thống bao gồm các microservice sau:

- **API Gateway (`api-gateway`):** Điểm vào duy nhất cho tất cả các yêu cầu từ client. Chịu trách nhiệm định tuyến, xác thực và rate limiting
- **User Service (`user-service`):** Quản lý tất cả logic liên quan đến người dùng, bao gồm đăng ký, đăng nhập và thông tin người dùng
- **Product Service (`product-service`):** Quản lý thông tin về sản phẩm và danh mục
- **Order Service (`order-service`):** Xử lý logic đặt hàng, giỏ hàng và lịch sử đơn hàng
- **Payment Service (`payment-service`):** Xử lý các giao dịch thanh toán
- **Frontend (`frontend`):** Ứng dụng React cung cấp giao diện người dùng cho khách hàng

---

## Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Frontend:** 
- **Cơ sở dữ liệu:** MongoDB (với Mongoose), Redis (rate limiting)
- **Giao tiếp giữa các service:** REST API
- **Bảo mật:** JWT (JSON Web Tokens), Helmet
- **Tools:** Docker, Postman, Winston (logging)

---

## Hướng dẫn Cài đặt và Chạy dự án
### 1. Tải mã nguồn

```bash
git clone <https://github.com/paz1ch/CNPM.git>
cd CNPM
```

### 2. Mở Docker Desktop
### 3. Chạy Docker Compose
```bash
docker-compose build
docker-compose up -d
```
hoặc
```bash
docker-compose up -d --build
```



