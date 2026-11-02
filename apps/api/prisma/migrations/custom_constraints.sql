-- =========================================================================
-- CUSTOM POSTGRESQL MIGRATION: BTREE_GIST EXTENSION & EXCLUSION CONSTRAINT
-- Mục đích: Đảm bảo tính toàn vẹn dữ liệu và chống trùng lịch đặt bàn tuyệt đối
-- ở cấp độ Engine của PostgreSQL, triệt tiêu hoàn toàn Race Condition.
-- =========================================================================

-- 1. Kích hoạt tiện ích mở rộng btree_gist để hỗ trợ toán tử = của UUID trong chỉ mục GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Thêm Exclusion Constraint chống xung đột khoảng thời gian [start_time, end_time)
-- cho cùng một bàn bi-da (billiard_table_id) đối với các trạng thái giữ chỗ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap_exclusion'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT booking_no_overlap_exclusion
        EXCLUDE USING gist (
            billiard_table_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
        WHERE (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_USE'));
    END IF;
END $$;

