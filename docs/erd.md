# THIẾT KẾ CƠ SỞ DỮ LIỆU & ERD - HỆ THỐNG QUẢN LÝ ĐẶT BÀN BI-DA

---

## 1. SƠ ĐỒ THỰC THỂ LIÊN KẾT (MERMAID ERD)

```mermaid
erDiagram
    Role ||--o{ User : has
    User ||--o{ Booking : creates
    User ||--o{ Invoice : processed_by
    User ||--o{ AuditLog : performs

    TableType ||--o{ BilliardTable : classifies
    BilliardTable ||--o{ Booking : allocated_to
    BilliardTable ||--o{ PlaySession : active_on

    Booking ||--o{ BookingStatusHistory : logs
    Booking ||--o| PlaySession : initiates
    Booking ||--o| Invoice : billed_as

    PlaySession ||--o| Invoice : results_in
    Invoice ||--o{ InvoiceItem : contains
    ServiceItem ||--o{ InvoiceItem : references
    Invoice ||--o{ Payment : receives

    User {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        string full_name
        string role "CUSTOMER, STAFF, ADMIN"
        string status "ACTIVE, INACTIVE, BLOCKED"
        timestamp created_at
        timestamp updated_at
    }

    TableType {
        uuid id PK
        string code UK "POOL, CAROM_3C, SNOOKER"
        string name
        decimal hourly_rate
        string description
        timestamp created_at
    }

    BilliardTable {
        uuid id PK
        string table_number UK "B01, B02..."
        uuid table_type_id FK
        string area "VIP, STANDARD, OUTDOOR"
        string status "AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE"
        text note
        timestamp created_at
        timestamp updated_at
    }

    Booking {
        uuid id PK
        string booking_code UK "BKG-YYYYMMDD-XXXX"
        uuid customer_id FK
        uuid billiard_table_id FK
        timestamp start_time
        timestamp end_time
        decimal estimated_price
        string status "PENDING, CONFIRMED, CHECKED_IN, IN_USE, COMPLETED, CANCELLED, NO_SHOW"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    BookingStatusHistory {
        uuid id PK
        uuid booking_id FK
        string from_status
        string to_status
        uuid changed_by_user_id FK
        text reason
        timestamp created_at
    }

    PlaySession {
        uuid id PK
        string session_code UK
        uuid billiard_table_id FK
        uuid booking_id FK "Nullable"
        timestamp start_time
        timestamp end_time "Nullable"
        integer duration_minutes "Calculated"
        string status "PLAYING, PAUSED, FINISHED"
        timestamp created_at
    }

    ServiceItem {
        uuid id PK
        string code UK
        string name
        string category "DRINK, FOOD, ACCESSORY"
        decimal unit_price
        string unit "Can, Bottle, Plate, Hour"
        boolean is_active
        timestamp created_at
    }

    Invoice {
        uuid id PK
        string invoice_code UK "INV-YYYYMMDD-XXXX"
        uuid booking_id FK "Nullable"
        uuid session_id FK "Nullable"
        uuid customer_id FK "Nullable"
        uuid staff_id FK
        decimal table_amount
        decimal service_amount
        decimal discount_amount
        decimal final_amount
        string status "UNPAID, PAID, CANCELLED, REFUNDED"
        text note
        timestamp created_at
        timestamp paid_at
    }

    InvoiceItem {
        uuid id PK
        uuid invoice_id FK
        string item_type "TABLE_TIME, SERVICE"
        uuid service_id FK "Nullable"
        string item_name
        decimal unit_price_snapshot
        integer quantity
        decimal subtotal
    }

    Payment {
        uuid id PK
        string payment_code UK
        uuid invoice_id FK
        decimal amount
        string method "CASH, BANK_TRANSFER, MOMO_VNPAY, CARD"
        string status "SUCCESS, FAILED, PENDING"
        string transaction_ref
        timestamp created_at
    }

    BusinessSetting {
        uuid id PK
        string setting_key UK
        text setting_value
        string description
        timestamp updated_at
    }

    AuditLog {
        uuid id PK
        uuid user_id FK "Nullable"
        string action "CREATE_BOOKING, CANCEL_BOOKING, CHANGE_PRICE, PAY_INVOICE"
        string entity_name
        string entity_id
        jsonb old_values
        jsonb new_values
        string ip_address
        timestamp created_at
    }
```

---

## 2. QUY TẮC RÀNG BUỘC TOÀN VẸN VÀ CHỈ MỤC (INDEXES & CONSTRAINTS)

1. **Ràng buộc loại trừ (Exclusion Constraint):**
   - Ràng buộc `booking_no_overlap_exclusion` ngăn chặn trùng lặp thời gian `tstzrange(start_time, end_time, '[)')` cho cùng `billiard_table_id` khi trạng thái thuộc nhóm giữ chỗ (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_USE`).
2. **Chỉ mục tăng tốc tìm kiếm bàn trống:**
   - `CREATE INDEX idx_bookings_table_time ON bookings (billiard_table_id, start_time, end_time);`
   - `CREATE INDEX idx_bookings_customer ON bookings (customer_id, status);`
   - `CREATE INDEX idx_invoices_created_at ON invoices (created_at, status);`
3. **Độ chính xác tiền tệ:**
   - Các trường tiền (`hourly_rate`, `estimated_price`, `table_amount`, `service_amount`, `discount_amount`, `final_amount`, `unit_price_snapshot`) dùng kiểu `DECIMAL(12, 2)` (hoặc `NUMERIC(12, 2)`), đảm bảo không gặp sai số dấu phẩy động (Floating-point error) như khi dùng `FLOAT` hoặc `DOUBLE`.
4. **Xóa an toàn (Integrity on Delete):**
   - `ON DELETE RESTRICT` đối với `BilliardTable` nếu còn `Booking` hoặc `PlaySession` liên quan.
   - `ON DELETE RESTRICT` đối với `User` nếu đã có `Invoice` hoặc `Booking`.
   - `ON DELETE CASCADE` cho `InvoiceItem` khi xóa hóa đơn dự thảo (`UNPAID`), nhưng hóa đơn đã `PAID` được bảo vệ không thể xóa.

