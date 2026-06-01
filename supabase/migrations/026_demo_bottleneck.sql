-- 026: Add bottleneck field to demo_sessions
ALTER TABLE demo_sessions ADD COLUMN IF NOT EXISTS bottleneck text;
NOTIFY pgrst, 'reload schema';
