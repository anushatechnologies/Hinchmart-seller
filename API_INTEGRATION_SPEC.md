# HinchMart Seller Portal — API Integration & Backend Architecture Specification

**Version:** 2.0.0  
**Target Platform:** HinchMart B2B E-Commerce Marketplace (Seller Service)  
**Standard:** RESTful JSON API / OpenAPI 3.0 Compatible  
**Base URL:** `https://api.hinchmart.com/v1` (Configurable via `VITE_API_BASE_URL`)  
**Auth Mechanism:** Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. Architectural Guidelines & Conventions

### 1.1 Envelope Structure
All HTTP API endpoints must return a standardized JSON response envelope.

#### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully.",
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 240,
    "totalPages": 12
  }
}
```

#### Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields failed statutory validation.",
    "details": [
      {
        "field": "gstin",
        "message": "Please enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5)."
      }
    ]
  }
}
```

### 1.2 Authentication & Headers
All authenticated endpoints require the following headers:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
Accept: application/json
X-Client-Version: 2.0.0
X-Seller-ID: <SELLER_UUID> (Optional context)
```

---

## 2. Authentication & Onboarding Endpoints

### 2.1 Check Account Existence
*Used in Login Page (Step 1) to verify whether the seller account exists before triggering OTP.*

- **Method:** `POST`
- **Endpoint:** `/auth/check-account`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "mobileNumber": "9876543210"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "exists": true,
      "mobileNumber": "9876543210",
      "sellerName": "Rajesh Sharma",
      "companyName": "Tata Infra Supplies Pvt Ltd",
      "verificationStatus": "Verified"
    }
  }
  ```
- **Response `200 OK` (Not Found):**
  ```json
  {
    "success": true,
    "data": {
      "exists": false,
      "mobileNumber": "9876543210"
    }
  }
  ```

---

### 2.2 Send OTP
*Triggers SMS OTP via SMS Gateway or Firebase Auth.*

- **Method:** `POST`
- **Endpoint:** `/auth/send-otp`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "mobileNumber": "9876543210",
    "purpose": "login"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "otp_sess_9a87d6f5e4",
      "expiresIn": 300,
      "resendAfter": 45
    },
    "message": "6-digit OTP sent to +91 9876543210."
  }
  ```

---

### 2.3 Verify OTP & Issue Tokens
- **Method:** `POST`
- **Endpoint:** `/auth/verify-otp`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "mobileNumber": "9876543210",
    "otp": "123456",
    "sessionId": "otp_sess_9a87d6f5e4"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "ref_98a7b6c5d4...",
      "seller": {
        "id": "seller-001",
        "fullName": "Rajesh Sharma",
        "email": "rajesh@tatainfra.com",
        "mobileNumber": "9876543210",
        "companyName": "Tata Infra Supplies Pvt Ltd",
        "businessType": "Manufacturer",
        "gstin": "27AABCT1332L1Z5",
        "verificationStatus": "Verified",
        "role": "seller"
      }
    }
  }
  ```

---

### 2.4 Complete 5-Step Business Registration
*Submits multi-step onboarding payload with Personal, Business & Tax, Bank Settlement, and Security credentials.*

- **Method:** `POST`
- **Endpoint:** `/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "fullName": "Rajesh Sharma",
    "mobileNumber": "9876543210",
    "email": "rajesh@tatainfra.com",
    "aadhaarNumber": "548912345678",
    "panCardNumber": "ABCDE1234F",
    "panCardDocumentUrl": "https://storage.hinchmart.com/docs/pan_sample.pdf",
    "companyName": "Tata Infra Supplies Pvt Ltd",
    "businessType": "Manufacturer",
    "gstin": "27AABCT1332L1Z5",
    "businessAddress": "Plot 42, Industrial Logistics Park, Phase 2",
    "state": "Maharashtra",
    "city": "Mumbai",
    "pincode": "400001",
    "bankName": "HDFC Bank",
    "accountHolderName": "Tata Infra Supplies Pvt Ltd",
    "accountNumber": "50200012345678",
    "confirmAccountNumber": "50200012345678",
    "ifscCode": "HDFC0000123",
    "password": "SecurePassword@2026",
    "confirmPassword": "SecurePassword@2026",
    "termsAgreed": true
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "sellerId": "seller-001",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "verificationStatus": "Pending",
      "notes": "Account created. Trade compliance under review by Admin."
    },
    "message": "Seller registered successfully."
  }
  ```

---

## 3. Seller Profile & Trade Compliance Documents

### 3.1 Get Profile & Verification Status
- **Method:** `GET`
- **Endpoint:** `/seller/profile`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "seller-001",
      "fullName": "Rajesh Sharma",
      "email": "rajesh@tatainfra.com",
      "phone": "9876543210",
      "company": "Tata Infra Supplies Pvt Ltd",
      "businessType": "Manufacturer",
      "gstin": "27AABCT1332L1Z5",
      "panNumber": "ABCDE1234F",
      "verificationStatus": "Pending",
      "bankDetails": {
        "bankName": "HDFC Bank",
        "accountHolder": "Tata Infra Supplies Pvt Ltd",
        "accountNumberMasked": "•••• •••• •••• 5678",
        "ifscCode": "HDFC0000123"
      }
    }
  }
  ```

---

### 3.2 List Compliance Documents
- **Method:** `GET`
- **Endpoint:** `/seller/documents`
- **Query Params:** `status=Pending|Verified|Rejected` (Optional)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "doc-01",
        "name": "GST Registration Certificate",
        "type": "GST Certificate",
        "fileName": "gst_registration_2026.pdf",
        "fileSize": "1.4 MB",
        "fileUrl": "https://storage.hinchmart.com/docs/gst_01.pdf",
        "status": "Pending",
        "uploadedAt": "2026-08-20T10:30:00Z",
        "verifiedAt": null,
        "rejectionReason": null
      },
      {
        "id": "doc-02",
        "name": "Company PAN Card",
        "type": "PAN Card",
        "fileName": "pan_card_doc.pdf",
        "fileSize": "850 KB",
        "fileUrl": "https://storage.hinchmart.com/docs/pan_01.pdf",
        "status": "Pending",
        "uploadedAt": "2026-08-20T10:30:00Z",
        "verifiedAt": null,
        "rejectionReason": null
      }
    ]
  }
  ```

---

### 3.3 Upload New Compliance Document
- **Method:** `POST`
- **Endpoint:** `/seller/documents`
- **Content-Type:** `multipart/form-data`
- **Request Form:**
  - `file`: Binary file (PDF, JPG, PNG up to 10MB)
  - `type`: `GST Certificate` | `PAN Card` | `Cancelled Cheque` | `Trade License` | `Factory License` | `Other`
  - `name`: String
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "doc-03",
      "name": "Cancelled Cheque",
      "type": "Cancelled Cheque",
      "fileName": "hdfc_cheque_2026.pdf",
      "fileSize": "1.1 MB",
      "fileUrl": "https://storage.hinchmart.com/docs/cheque_01.pdf",
      "status": "Pending",
      "uploadedAt": "2026-08-29T12:00:00Z"
    },
    "message": "Document uploaded and submitted for admin review."
  }
  ```

---

## 4. Dashboard & Analytics Endpoints

### 4.1 Get Overview Metrics
- **Method:** `GET`
- **Endpoint:** `/analytics/overview`
- **Query Params:**
  - `timeRange`: `7d` | `30d` | `90d` | `1y` | `custom`
  - `startDate`: `2026-08-01` (if custom)
  - `endDate`: `2026-08-29` (if custom)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "kpis": {
        "totalRevenue": 4850000.0,
        "revenueGrowthPercent": 14.8,
        "totalOrders": 128,
        "ordersGrowthPercent": 18.2,
        "activeCatalogItems": 64,
        "totalCustomers": 42,
        "lowStockAlerts": 7,
        "pendingRfqs": 5
      },
      "revenueTrend": [
        { "date": "2026-08-01", "revenue": 142000, "orders": 4 },
        { "date": "2026-08-02", "revenue": 198000, "orders": 6 }
      ],
      "categoryRevenue": [
        { "category": "Steel & Rebars", "revenue": 2400000, "percent": 49.5 },
        { "category": "Cement & Concrete", "revenue": 1450000, "percent": 29.9 }
      ]
    }
  }
  ```

---

## 5. Catalog Management Endpoints (v2.4.0)

### 5.1 List Seller's Products
- **Method:** `GET`
- **Endpoint:** `/api/seller/products`
- **Headers:** `Authorization: Bearer <SELLER_JWT_TOKEN>`
- **Query Params:**
  - `page`: Integer (default: 1)
  - `limit`: Integer (default: 20)
  - `status`: `ALL` | `PENDING` | `APPROVED` | `REJECTED` | `INACTIVE`
  - `search`: String (searches name, SKU, HSN, brand)
  - `category`: String
  - `brand`: String
  - `sortBy`: `newest` | `oldest` | `price-asc` | `price-desc` | `stock-asc` | `stock-desc`
- **Response `200 OK`:**
  ```json
  {
    "products": [
      {
        "id": 101,
        "productId": 101,
        "name": "Tata Tiscon 550D TMT Rebar (12mm)",
        "sku": "TATA-TMT-12MM-550D",
        "hsn": "7214",
        "hsnCode": "7214",
        "gstRate": 18,
        "price": 54200.00,
        "mrp": 59000.00,
        "stockQty": 500,
        "unit": "MT",
        "moq": 5,
        "categoryId": 1,
        "categoryName": "Civil & Structural",
        "subcategoryId": 1,
        "subcategoryName": "TMT Steel & Rebars",
        "brandId": 1,
        "brandName": "Tata Tiscon",
        "imageUrl": "https://s3.ap-south-1.amazonaws.com/hinchmart-media/products/tata-tmt-12mm.jpg",
        "status": "APPROVED",
        "approvalStatus": "APPROVED",
        "active": true,
        "createdAt": "2026-09-08T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
  ```

---

### 5.2 Create New Product (Seller Submission)
- **Method:** `POST`
- **Endpoint:** `/api/seller/products`
- **Headers:** `Authorization: Bearer <SELLER_JWT_TOKEN>`
- **Request Body:**
  ```json
  {
    "name": "Tata Tiscon 550D TMT Rebar (12mm)",
    "slug": "tata-tiscon-550d-tmt-rebar-12mm",
    "sku": "TATA-TMT-12MM-550D",
    "categoryId": 1,
    "subcategoryId": 1,
    "brandId": 1,
    "price": 54200.00,
    "mrp": 59000.00,
    "unit": "MT",
    "moq": 5,
    "stockQty": 500,
    "hsn": "7214",
    "gstRate": 18.0,
    "description": "High-ductility earthquake resistant primary steel rebars conforming to IS 1786:2008 standards.",
    "imageUrl": "https://s3.ap-south-1.amazonaws.com/hinchmart-media/products/tata-tmt-12mm.jpg",
    "images": [
      "https://s3.ap-south-1.amazonaws.com/hinchmart-media/products/tata-tmt-12mm.jpg",
      "https://s3.ap-south-1.amazonaws.com/hinchmart-media/products/tata-tmt-12mm-testcert.jpg"
    ],
    "bulkPricingTiers": [
      { "minQty": 5, "maxQty": 19, "price": 54200.00, "discountPercentage": 8.1 },
      { "minQty": 20, "maxQty": null, "price": 51200.00, "discountPercentage": 13.2 }
    ],
    "specifications": {
      "Grade": "Fe 550D",
      "Standard": "IS 1786:2008",
      "Diameter": "12 mm"
    },
    "is24HourDelivery": true,
    "active": true
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Product submitted successfully and is under review.",
    "data": {
      "id": 101,
      "productId": 101,
      "status": "PENDING",
      "approvalStatus": "PENDING",
      "name": "Tata Tiscon 550D TMT Rebar (12mm)",
      "sku": "TATA-TMT-12MM-550D",
      "createdAt": "2026-09-08T10:30:00.000Z"
    }
  }
  ```

---

### 5.3 Toggle Product Active / Inactive
- **Method:** `PATCH`
- **Endpoint:** `/api/seller/products/{id}/toggle-active`
- **Headers:** `Authorization: Bearer <SELLER_JWT_TOKEN>`
- **Request Body:**
  ```json
  {
    "active": false
  }
  ```

---

### 5.4 Inline Quick Brand Add
- **Method:** `POST`
- **Endpoint:** `/api/brands`
- **Headers:** `Authorization: Bearer <SELLER_JWT_TOKEN>`
- **Request Body:**
  ```json
  {
    "name": "Tata Tiscon",
    "slug": "tata-tiscon",
    "categoryId": 1,
    "subcategoryId": 1,
    "active": true
  }
  ```


## 6. Order Management & Statutory Dispatch Lifecycle

### 6.1 Get Orders List
- **Method:** `GET`
- **Endpoint:** `/orders`
- **Query Params:**
  - `page`: Integer
  - `limit`: Integer
  - `status`: `All` | `New` | `Confirmed` | `Processing` | `Ready for Dispatch` | `Dispatched` | `In Transit` | `Delivered` | `Completed` | `Cancelled`
  - `customer`: String (Buyer / Company name)
  - `paymentStatus`: `All` | `Paid` | `Pending` | `Credit`
  - `search`: String (Order ID, invoice #, buyer name, site location, SKU)
  - `startDate`: `2026-08-01`
  - `endDate`: `2026-08-29`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ord-101",
        "orderNumber": "HINCH-ORD-2026-8801",
        "createdAt": "2026-08-28T14:30:00Z",
        "orderStatus": "Processing",
        "paymentStatus": "Paid",
        "buyer": {
          "name": "Vikram Patel",
          "company": "Patel Infrastructure Ltd",
          "gstin": "27AAACP9921M1Z2",
          "phone": "9820011223",
          "email": "vikram@patelinfra.com"
        },
        "deliveryAddress": {
          "siteName": "Metro Line 4 Project Site",
          "address": "Ghodbunder Road, Near Hypercity",
          "city": "Thane",
          "state": "Maharashtra",
          "pincode": "400607"
        },
        "items": [
          {
            "productId": "prod-001",
            "name": "Tata Tiscon 550D TMT Rebars - 12mm",
            "sku": "TIS-550D-12MM",
            "quantity": 25,
            "unit": "Metric Ton",
            "unitPrice": 61200.0,
            "taxRate": 18,
            "totalAmount": 1530000.0
          }
        ],
        "subtotal": 1530000.0,
        "discountTotal": 0.0,
        "taxTotal": 275400.0,
        "freightCharges": 12000.0,
        "totalAmount": 1817400.0,
        "invoice": null,
        "dispatch": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "totalRecords": 128, "totalPages": 7 }
  }
  ```

---

### 6.2 Generate Commercial Tax Invoice (Idempotent)
*Statutory Requirement: Must be generated before dispatch.*

- **Method:** `POST`
- **Endpoint:** `/orders/:id/invoice`
- **Request Body:**
  ```json
  {
    "invoicePrefix": "INV-2026",
    "notes": "Original for Recipient"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "invoiceNumber": "INV-2026-8801",
      "invoiceDate": "2026-08-29T10:00:00Z",
      "subtotal": 1530000.0,
      "cgstAmount": 137700.0,
      "sgstAmount": 137700.0,
      "igstAmount": 0.0,
      "grandTotal": 1817400.0,
      "pdfDownloadUrl": "https://api.hinchmart.com/v1/invoices/INV-2026-8801.pdf"
    },
    "message": "Commercial Tax Invoice generated."
  }
  ```

---

### 6.3 Dispatch Order (With Logistics & Driver Validation)
*Statutory Rule: Fails if invoice is not generated or transporter details are missing.*

- **Method:** `POST`
- **Endpoint:** `/orders/:id/dispatch`
- **Request Body:**
  ```json
  {
    "transporterName": "VRL Logistics Heavy Freight",
    "vehicleNumber": "MH-04-AZ-9988",
    "driverName": "Ramesh Yadav",
    "driverPhone": "9819922334",
    "trackingNumber": "VRL-TRK-778901",
    "estimatedDeliveryDate": "2026-08-31"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "orderStatus": "Dispatched",
      "dispatchDetails": {
        "transporterName": "VRL Logistics Heavy Freight",
        "vehicleNumber": "MH-04-AZ-9988",
        "driverName": "Ramesh Yadav",
        "driverPhone": "9819922334",
        "trackingNumber": "VRL-TRK-778901",
        "dispatchedAt": "2026-08-29T12:00:00Z"
      }
    },
    "message": "Order dispatched and tracking updated."
  }
  ```

---

### 6.4 Update Order Status (State Machine)
- **Method:** `PATCH`
- **Endpoint:** `/orders/:id/status`
- **Valid Transitions:**
  - `New` -> `Confirmed`
  - `Confirmed` -> `Processing`
  - `Processing` -> `Ready for Dispatch`
  - `Ready for Dispatch` -> `Dispatched` (via dispatch endpoint)
  - `Dispatched` -> `In Transit`
  - `In Transit` -> `Delivered`
  - `Delivered` -> `Completed`
  - `*` -> `Cancelled` (Only allowed before `Dispatched`)
- **Request Body:**
  ```json
  {
    "status": "Ready for Dispatch",
    "notes": "Materials inspected and packaged at Warehouse 3."
  }
  ```

---

## 7. RFQs, Enquiries & Quotations Endpoints

### 7.1 List Quotations
- **Method:** `GET`
- **Endpoint:** `/quotations`
- **Query Params:** `status=Draft|Sent|Accepted|Rejected|Expired`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "qt-201",
        "quotationNumber": "HINCH-QT-2026-042",
        "buyer": {
          "name": "Suresh Raina",
          "company": "BuildCon Developers",
          "phone": "9833445566"
        },
        "items": [
          {
            "name": "Tata Tiscon 550D TMT Rebars - 16mm",
            "quantity": 50,
            "unit": "Metric Ton",
            "unitPrice": 59800.0,
            "taxRate": 18,
            "totalAmount": 2990000.0
          }
        ],
        "grandTotal": 3528200.0,
        "validUntil": "2026-09-15",
        "status": "Sent"
      }
    ]
  }
  ```

---

### 7.2 Convert Quotation to Order
- **Method:** `POST`
- **Endpoint:** `/quotations/:id/convert-order`
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "orderId": "ord-109",
      "orderNumber": "HINCH-ORD-2026-8809",
      "quotationId": "qt-201"
    },
    "message": "Quotation converted to Purchase Order."
  }
  ```

---

## 8. Global & Voice Omni Search

### 8.1 Search Everything
- **Method:** `GET`
- **Endpoint:** `/search/omni`
- **Query Params:**
  - `q`: String (e.g. "Tata", "Patel", "INV-2026", "Rebars")
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "orders": [
        { "id": "ord-101", "orderNumber": "HINCH-ORD-2026-8801", "buyerCompany": "Patel Infrastructure" }
      ],
      "invoices": [
        { "invoiceNumber": "INV-2026-8801", "orderId": "ord-101", "amount": 1817400 }
      ],
      "products": [
        { "id": "prod-001", "name": "Tata Tiscon 550D TMT Rebars - 12mm", "category": "Steel & Rebars" }
      ],
      "customers": [
        { "id": "cust-01", "company": "Patel Infrastructure Ltd", "contact": "Vikram Patel" }
      ],
      "quotations": [
        { "id": "qt-201", "quotationNumber": "HINCH-QT-2026-042", "buyerCompany": "BuildCon Developers" }
      ]
    }
  }
  ```

---

## 9. Data Integrity & Validation Matrix

| Field | Type | Validation Rules |
| :--- | :--- | :--- |
| `mobileNumber` | String | Exactly 10 digits, starts with `6, 7, 8, 9` |
| `gstin` | String | Exactly 15 alphanumeric chars matching `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` |
| `panCardNumber` | String | Exactly 10 alphanumeric chars matching `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| `aadhaarNumber` | String | Exactly 12 digits |
| `ifscCode` | String | Exactly 11 uppercase alphanumeric chars matching `^[A-Z]{4}0[A-Z0-9]{6}$` |
| `accountNumber` | String | Numbers only; length conforms to selected Bank's statutory limits (e.g., SBI 11-17, HDFC 14, ICICI 12) |
| `password` | String | Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character |
| `vehicleNumber` | String | Valid Indian RTO registration pattern (e.g., `MH-04-AZ-9988`) |
| `driverPhone` | String | Exactly 10 digits |
