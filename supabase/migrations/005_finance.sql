-- 005_finance.sql
-- Finance module — transactions, RLS, updated_at trigger

CREATE TABLE IF NOT EXISTS finance_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  transaction_date    date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type    text NOT NULL DEFAULT 'expense'
                        CHECK (transaction_type IN ('income','expense')),
  category            text NOT NULL,
  item_name           text NOT NULL,
  amount              numeric(12,2) NOT NULL CHECK (amount >= 0),
  quantity            integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  total_amount        numeric(12,2) NOT NULL,   -- stored: amount * quantity
  payment_method      text CHECK (payment_method IN ('bank_transfer','cash','card','bacs','cheque','stripe','paypal')),
  payment_status      text NOT NULL DEFAULT 'paid'
                        CHECK (payment_status IN ('paid','pending','overdue','cancelled')),
  is_recurring        boolean NOT NULL DEFAULT false,
  recurring_interval  text CHECK (recurring_interval IN ('weekly','monthly','quarterly','yearly')),
  linked_project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  linked_deal_id      uuid REFERENCES deals(id) ON DELETE SET NULL,
  linked_contact_id   uuid REFERENCES contacts(id) ON DELETE SET NULL,
  notes               text
);

-- updated_at trigger (reuse function if already created by earlier migrations)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_finance_updated_at ON finance_transactions;
CREATE TRIGGER trg_finance_updated_at
  BEFORE UPDATE ON finance_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_open_finance" ON finance_transactions;
CREATE POLICY "dev_open_finance" ON finance_transactions FOR ALL USING (true);
