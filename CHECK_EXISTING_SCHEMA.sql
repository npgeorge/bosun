-- =====================================================
-- BOSUN - CHECK EXISTING SCHEMA
-- =====================================================
-- Run this first to see what tables you already have
-- =====================================================

-- List all existing tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- List all columns in each table
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
