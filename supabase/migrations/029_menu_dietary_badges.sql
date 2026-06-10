-- ============================================================
-- Migration 029 — Add dietary badge columns to menu_items
-- Run in Supabase SQL Editor BEFORE migration 030.
-- Safe to re-run (IF NOT EXISTS guards).
-- ============================================================

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_vegetarian  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vegan       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN NOT NULL DEFAULT false;

-- Verify columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'menu_items'
  AND column_name  IN ('is_vegetarian', 'is_vegan', 'is_gluten_free')
ORDER BY column_name;
