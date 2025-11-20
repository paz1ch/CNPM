# Order Service API - Postman Test Data

## Base URL
```
http://localhost:3000/api/orders
```

## Required Headers for All Requests

```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
Content-Type: application/json
```

For restaurant role:
```
x-user-id: 674f8b5c8a9d123456789def
x-user-role: restaurant
x-restaurant-id: RESTO123
Content-Type: application/json
```

For delivery role:
```
x-user-id: 674f8b5c8a9d123456789ghi
x-user-role: delivery
Content-Type: application/json
```

---

## 1. CREATE ORDER
**Method:** `POST`  
**URL:** `http://localhost:3000/api/orders`  
**Role:** User  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
Content-Type: application/json
```

### Request Body:
```json
{
  "restaurantID": "RESTO123",
  "postal_code_of_restaurant": "100000",
  "items": [
    {
      "menuItemId": "MENU001",
      "quantity": 2,
      "price": 50000
    },
    {
      "menuItemId": "MENU002",
      "quantity": 1,
      "price": 35000
    },
    {
      "menuItemId": "MENU003",
      "quantity": 3,
      "price": 25000
    }
  ]
}
```

**Expected Total:** 210,000 VND (2×50,000 + 1×35,000 + 3×25,000)

---

## 2. GET USER ORDERS
**Method:** `GET`  
**URL:** `http://localhost:3000/api/orders/user`  
**Role:** User  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
```

**No Request Body Required**

---

## 3. GET ORDER BY ID
**Method:** `GET`  
**URL:** `http://localhost:3000/api/orders/{orderId}`  
**Example:** `http://localhost:3000/api/orders/674f8b5c8a9d123456789abc`  
**Role:** User/Restaurant/Delivery  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
```

**No Request Body Required**

---

## 4. GET RESTAURANT ORDERS
**Method:** `GET`  
**URL:** `http://localhost:3000/api/orders/restaurant/{restaurantId}`  
**Example:** `http://localhost:3000/api/orders/restaurant/RESTO123`  
**Role:** Restaurant  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789def
x-user-role: restaurant
x-restaurant-id: RESTO123
```

**No Request Body Required**

---

## 5. GET ORDERS BY POSTAL CODE (Delivery)
**Method:** `GET`  
**URL:** `http://localhost:3000/api/orders/postal-code/{postalCode}`  
**Example:** `http://localhost:3000/api/orders/postal-code/100000`  
**Role:** Delivery  

### Headers:
```
x-user-id: 674f8b5c8a9d123456789ghi
x-user-role: delivery
```

**No Request Body Required**

---

## 6. UPDATE ORDER STATUS
**Method:** `PUT`  
**URL:** `http://localhost:3000/api/orders/{orderId}/status`  
**Example:** `http://localhost:3000/api/orders/ORD-1732130400000-123/status`  
**Role:** User/Restaurant/Delivery (depends on status flow)  

### Headers (Restaurant confirming order):
```
x-user-id: 674f8b5c8a9d123456789def
x-user-role: restaurant
x-restaurant-id: RESTO123
Content-Type: application/json
```

### Request Body - Confirm Order:
```json
{
  "status": "Confirmed"
}
```

### Request Body - Start Preparing:
```json
{
  "status": "Preparing"
}
```

### Request Body - Mark Ready:
```json
{
  "status": "Ready"
}
```

### Request Body - Out for Delivery:
```json
{
  "status": "Out for Delivery"
}
```

### Request Body - Delivered:
```json
{
  "status": "Delivered"
}
```

### Request Body - Cancel (User):
```json
{
  "status": "Cancelled"
}
```

---

## 7. MODIFY PENDING ORDER (User Only)
**Method:** `PUT`  
**URL:** `http://localhost:3000/api/orders/{orderId}`  
**Example:** `http://localhost:3000/api/orders/ORD-1732130400000-123`  
**Role:** User  
**Note:** Only works for orders with status "Pending" and within modification deadline

### Headers:
```
x-user-id: 674f8b5c8a9d123456789abc
x-user-role: user
Content-Type: application/json
```

### Request Body:
```json
{
  "items": [
    {
      "menuItemId": "MENU001",
      "quantity": 3,
      "price": 50000
    },
    {
      "menuItemId": "MENU004",
      "quantity": 2,
      "price": 45000
    }
  ]
}
```

---

## 8. UPDATE ORDER (Restaurant/Delivery)
**Method:** `PUT`  
**URL:** `http://localhost:3000/api/orders/{orderId}/update`  
**Example:** `http://localhost:3000/api/orders/ORD-1732130400000-123/update`  
**Role:** Restaurant or Delivery  

### Headers (Restaurant):
```
x-user-id: 674f8b5c8a9d123456789def
x-user-role: restaurant
x-restaurant-id: RESTO123
Content-Type: application/json
```

### Request Body (Restaurant updating status):
```json
{
  "status": "Preparing"
}
```

### Headers (Delivery):
```
x-user-id: 674f8b5c8a9d123456789ghi
x-user-role: delivery
Content-Type: application/json
```

### Request Body (Delivery assigning):
```json
{
  "status": "Out for Delivery",
  "delivery_person_id": "DELIV001",
  "delivery_person_name": "Nguyen Van A"
}
```

---

## Order Status Flow

### User can:
- **Pending** → **Cancelled**

### Restaurant can:
- **Pending** → **Confirmed**
- **Confirmed** → **Preparing**
- **Preparing** → **Ready**

### Delivery can:
- **Ready** → **Out for Delivery**
- **Out for Delivery** → **Delivered**

---

## Sample Test Scenarios

### Scenario 1: Complete Order Flow
1. **User creates order** (POST /api/orders) → Status: Pending
2. **Restaurant confirms** (PUT /api/orders/{id}/status) → Status: Confirmed
3. **Restaurant starts preparing** (PUT /api/orders/{id}/status) → Status: Preparing
4. **Restaurant marks ready** (PUT /api/orders/{id}/status) → Status: Ready
5. **Delivery picks up** (PUT /api/orders/{id}/update) → Status: Out for Delivery
6. **Delivery completes** (PUT /api/orders/{id}/status) → Status: Delivered

### Scenario 2: User Cancels Order
1. **User creates order** (POST /api/orders) → Status: Pending
2. **User cancels** (PUT /api/orders/{id}/status) → Status: Cancelled

### Scenario 3: User Modifies Pending Order
1. **User creates order** (POST /api/orders) → Status: Pending
2. **User modifies items** (PUT /api/orders/{id}) → Updated items, still Pending
3. **Restaurant confirms** (PUT /api/orders/{id}/status) → Status: Confirmed

---

## Notes

- Replace `{orderId}` with actual order ID returned from create order API
- Order IDs follow format: `ORD-{timestamp}-{random}`
- Item IDs follow format: `ITEM-{timestamp}-{random}`
- All prices are in VND (Vietnamese Dong)
- User IDs in headers should be actual MongoDB ObjectIds from your database
