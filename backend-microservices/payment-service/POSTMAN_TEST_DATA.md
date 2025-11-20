# Payment Service API - Postman Test Data

## Base URL
```
http://localhost:3000/api/payment
```

## Required Headers for All Requests

```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
Content-Type: application/json
```

---

## 1. CREATE PAYMENT
**Method:** `POST`  
**URL:** `http://localhost:3000/api/payment`  
**Role:** User  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
Content-Type: application/json
```

### Request Body - Credit Card Payment:
```json
{
  "orderId": "674f8b5c8a9d123456789abc",
  "paymentMethod": "Credit Card",
  "amount": 210000
}
```

### Request Body - Cash Payment:
```json
{
  "orderId": "674f8b5c8a9d123456789def",
  "paymentMethod": "Cash",
  "amount": 150000
}
```

### Request Body - E-Wallet (Momo):
```json
{
  "orderId": "674f8b5c8a9d123456789ghi",
  "paymentMethod": "Momo",
  "amount": 350000
}
```

### Request Body - E-Wallet (ZaloPay):
```json
{
  "orderId": "674f8b5c8a9d123456789jkl",
  "paymentMethod": "ZaloPay",
  "amount": 275000
}
```

### Request Body - Bank Transfer:
```json
{
  "orderId": "674f8b5c8a9d123456789mno",
  "paymentMethod": "Bank Transfer",
  "amount": 500000
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "message": "Payment created successfully",
  "payment": {
    "orderId": "674f8b5c8a9d123456789abc",
    "paymentMethod": "Credit Card",
    "amount": 210000,
    "status": "pending",
    "_id": "674f9c8d9a1d234567890xyz",
    "createdAt": "2024-11-21T01:00:00.000Z",
    "updatedAt": "2024-11-21T01:00:00.000Z"
  }
}
```

---

## 2. GET PAYMENT BY ORDER ID
**Method:** `GET`  
**URL:** `http://localhost:3000/api/payment/{orderId}`  
**Example:** `http://localhost:3000/api/payment/674f8b5c8a9d123456789abc`  
**Role:** User/Restaurant/Delivery  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
```

**No Request Body Required**

### Expected Response (Success):
```json
{
  "success": true,
  "payment": {
    "_id": "674f9c8d9a1d234567890xyz",
    "orderId": "674f8b5c8a9d123456789abc",
    "paymentMethod": "Credit Card",
    "amount": 210000,
    "status": "pending",
    "createdAt": "2024-11-21T01:00:00.000Z",
    "updatedAt": "2024-11-21T01:00:00.000Z"
  }
}
```

### Expected Response (Not Found):
```json
{
  "success": false,
  "message": "Payment not found"
}
```

---

## Payment Status

The payment model has 3 possible statuses:
- **pending** - Payment is awaiting processing (default)
- **completed** - Payment has been successfully processed
- **failed** - Payment processing failed

---

## Payment Methods

Common payment methods you can use:
- `Credit Card`
- `Debit Card`
- `Cash`
- `Momo` (E-Wallet)
- `ZaloPay` (E-Wallet)
- `VNPay` (E-Wallet)
- `Bank Transfer`
- `COD` (Cash on Delivery)

---

## Sample Test Scenarios

### Scenario 1: Complete Payment Flow
1. **User creates order** in Order Service → Receives `orderId`
2. **User creates payment** (POST /api/payment) with the `orderId`
3. **Get payment details** (GET /api/payment/{orderId}) to verify payment

### Scenario 2: Multiple Payment Methods
1. Create payment with Credit Card
2. Create payment with Momo
3. Create payment with Cash
4. Compare payment responses

### Scenario 3: Payment Verification
1. Create a payment
2. Get payment by orderId
3. Verify payment status, amount, and method

---

## Integration with Order Service

When creating a payment, the `orderId` should be:
- A valid MongoDB ObjectId from the Order Service
- The `_id` field of an order, NOT the custom `orderID` field (ORD-xxx)

**Example Flow:**
```
1. Create Order → Returns: { orderDetails: { _id: "674f8b5c8a9d123456789abc", orderID: "ORD-1732..." } }
2. Create Payment → Use _id: { orderId: "674f8b5c8a9d123456789abc", ... }
```

---

## Notes

- Replace `{orderId}` with actual MongoDB ObjectId from your orders
- All amounts are in VND (Vietnamese Dong)
- Payment status defaults to `pending` when created
- The `transactionId` field is optional and can be added for external payment gateway integration
- User IDs in headers should be actual MongoDB ObjectIds from your database

---

## Error Responses

### 400 Bad Request
Missing required fields in request body

### 404 Not Found
Payment with given orderId does not exist

### 500 Internal Server Error
Server error occurred during processing
