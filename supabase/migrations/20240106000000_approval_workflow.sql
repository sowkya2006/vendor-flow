-- =============================================================================
-- VendorFlow — Multi-Level Approval Workflow
-- Migration: 20240106000000_approval_workflow.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE approval_entity_type AS ENUM (
    'vendor', 'rfq', 'quotation', 'purchase_order', 'contract', 'invoice'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_request_status AS ENUM (
    'draft',
    'pending_manager',
    'pending_procurement',
    'pending_finance',
    'pending_final',
    'approved',
    'rejected',
    'cancelled',
    'completed',
    'returned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_step_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'returned',
    'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_action_type AS ENUM (
    'submitted',
    'approved',
    'rejected',
    'returned',
    'cancelled',
    'reassigned',
    'escalated',
    'commented',
    'reopened'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_role AS ENUM (
    'employee',
    'manager',
    'procurement_officer',
    'finance',
    'administrator'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABLE: approval_workflows
-- Defines a reusable workflow template for a company + entity type
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID                  NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT                  NOT NULL,
  description     TEXT,
  entity_type     approval_entity_type  NOT NULL,
  is_active       BOOLEAN               NOT NULL DEFAULT TRUE,
  is_default      BOOLEAN               NOT NULL DEFAULT FALSE,
  created_by      UUID                  REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_company_id   ON public.approval_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity_type  ON public.approval_workflows(entity_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_workflows_default
  ON public.approval_workflows(company_id, entity_type)
  WHERE is_default = TRUE;

COMMENT ON TABLE public.approval_workflows IS 'Reusable approval workflow templates per company and entity type.';

-- ---------------------------------------------------------------------------
-- TABLE: approval_workflow_steps
-- Ordered steps within a workflow template
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_workflow_steps (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID            NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  company_id      UUID            NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step_order      INTEGER         NOT NULL,
  name            TEXT            NOT NULL,
  role_required   approval_role   NOT NULL DEFAULT 'manager',
  approver_id     UUID            REFERENCES public.users(id) ON DELETE SET NULL,
  is_optional     BOOLEAN         NOT NULL DEFAULT FALSE,
  timeout_hours   INTEGER,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON public.approval_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_approver_id ON public.approval_workflow_steps(approver_id);

COMMENT ON TABLE public.approval_workflow_steps IS 'Ordered steps within an approval workflow template.';

-- ---------------------------------------------------------------------------
-- TABLE: approval_requests
-- A concrete approval instance for a specific entity
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id                UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID                      NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_id       UUID                      REFERENCES public.approval_workflows(id) ON DELETE SET NULL,

  -- What is being approved
  entity_type       approval_entity_type      NOT NULL,
  entity_id         UUID                      NOT NULL,
  entity_ref        TEXT,                     -- human-readable reference, e.g. PO-2024-0001

  -- Status & routing
  status            approval_request_status   NOT NULL DEFAULT 'draft',
  current_step      INTEGER                   NOT NULL DEFAULT 0,
  total_steps       INTEGER                   NOT NULL DEFAULT 0,

  -- Financial context (for budget checks)
  amount            NUMERIC(15,2),
  currency          CHAR(3)                   DEFAULT 'INR',

  title             TEXT                      NOT NULL,
  description       TEXT,
  priority          TEXT                      NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low','normal','high','urgent')),
  due_date          DATE,

  -- Requester
  requested_by      UUID                      REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,

  -- Rejection / return
  rejection_reason  TEXT,
  return_reason     TEXT,

  created_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_company_id    ON public.approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity_type   ON public.approval_requests(entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity_id     ON public.approval_requests(entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status        ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by  ON public.approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at    ON public.approval_requests(created_at DESC);

COMMENT ON TABLE public.approval_requests IS 'Concrete approval instances for procurement entities.';

-- ---------------------------------------------------------------------------
-- TABLE: approval_steps
-- Tracks each step's state within a concrete approval request
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_steps (
  id                UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id        UUID                  NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  company_id        UUID                  NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_step_id  UUID                  REFERENCES public.approval_workflow_steps(id) ON DELETE SET NULL,

  step_order        INTEGER               NOT NULL,
  name              TEXT                  NOT NULL,
  role_required     approval_role         NOT NULL DEFAULT 'manager',
  approver_id       UUID                  REFERENCES public.users(id) ON DELETE SET NULL,
  is_optional       BOOLEAN               NOT NULL DEFAULT FALSE,

  status            approval_step_status  NOT NULL DEFAULT 'pending',
  comments          TEXT,
  decided_at        TIMESTAMPTZ,
  due_at            TIMESTAMPTZ,

  created_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_steps_request_id   ON public.approval_steps(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver_id  ON public.approval_steps(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_status       ON public.approval_steps(status);

COMMENT ON TABLE public.approval_steps IS 'Per-step state within an approval request (the actual decision trail).';

-- ---------------------------------------------------------------------------
-- TABLE: approval_actions
-- Immutable audit log of every action taken on a request
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_actions (
  id            UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id    UUID                  NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_id       UUID                  REFERENCES public.approval_steps(id) ON DELETE SET NULL,
  company_id    UUID                  NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  action_type   approval_action_type  NOT NULL,
  actor_id      UUID                  REFERENCES public.users(id) ON DELETE SET NULL,
  comment       TEXT,
  is_internal   BOOLEAN               NOT NULL DEFAULT FALSE,

  old_status    approval_request_status,
  new_status    approval_request_status,
  metadata      JSONB,

  performed_at  TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_actions_request_id  ON public.approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_actor_id    ON public.approval_actions(actor_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_company_id  ON public.approval_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_performed_at ON public.approval_actions(performed_at DESC);

COMMENT ON TABLE public.approval_actions IS 'Immutable audit trail for all approval workflow actions.';

-- ---------------------------------------------------------------------------
-- TABLE: approval_notifications
-- Email/in-app notification queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_notifications (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id    UUID        NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_id  UUID        REFERENCES public.users(id) ON DELETE SET NULL,

  type          TEXT        NOT NULL,  -- 'approval_requested','approved','rejected','returned','reminder'
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_notifs_request_id   ON public.approval_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifs_recipient_id ON public.approval_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifs_is_read      ON public.approval_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_approval_notifs_company_id   ON public.approval_notifications(company_id);

COMMENT ON TABLE public.approval_notifications IS 'Notification queue for approval workflow events.';

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_approval_workflow_steps_updated_at
  BEFORE UPDATE ON public.approval_workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_approval_steps_updated_at
  BEFORE UPDATE ON public.approval_steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- FUNCTION: advance_approval_request
-- Called after a step is approved to move to the next step or mark complete
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_approval_request(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_step RECORD;
  v_total     INTEGER;
  v_approved  INTEGER;
BEGIN
  SELECT total_steps INTO v_total
  FROM public.approval_requests WHERE id = p_request_id;

  SELECT COUNT(*) INTO v_approved
  FROM public.approval_steps
  WHERE request_id = p_request_id
    AND status = 'approved';

  -- Find next pending step
  SELECT * INTO v_next_step
  FROM public.approval_steps
  WHERE request_id = p_request_id
    AND status = 'pending'
  ORDER BY step_order
  LIMIT 1;

  IF v_next_step IS NULL THEN
    -- All steps done — mark request approved
    UPDATE public.approval_requests
    SET status       = 'approved',
        completed_at = NOW(),
        current_step = v_total,
        updated_at   = NOW()
    WHERE id = p_request_id;
  ELSE
    -- Update current step pointer
    UPDATE public.approval_requests
    SET current_step = v_next_step.step_order,
        status       = CASE v_next_step.role_required
                         WHEN 'manager'            THEN 'pending_manager'::approval_request_status
                         WHEN 'procurement_officer' THEN 'pending_procurement'::approval_request_status
                         WHEN 'finance'            THEN 'pending_finance'::approval_request_status
                         ELSE                           'pending_final'::approval_request_status
                       END,
        updated_at   = NOW()
    WHERE id = p_request_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.approval_workflows        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflow_steps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_notifications    ENABLE ROW LEVEL SECURITY;

-- ---- approval_workflows ----
DROP POLICY IF EXISTS approval_workflows_select ON public.approval_workflows;
CREATE POLICY approval_workflows_select ON public.approval_workflows
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_workflows_insert ON public.approval_workflows;
CREATE POLICY approval_workflows_insert ON public.approval_workflows
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_workflows_update ON public.approval_workflows;
CREATE POLICY approval_workflows_update ON public.approval_workflows
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_workflows_delete ON public.approval_workflows;
CREATE POLICY approval_workflows_delete ON public.approval_workflows
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- approval_workflow_steps ----
DROP POLICY IF EXISTS approval_workflow_steps_select ON public.approval_workflow_steps;
CREATE POLICY approval_workflow_steps_select ON public.approval_workflow_steps
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_workflow_steps_insert ON public.approval_workflow_steps;
CREATE POLICY approval_workflow_steps_insert ON public.approval_workflow_steps
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_workflow_steps_update ON public.approval_workflow_steps;
CREATE POLICY approval_workflow_steps_update ON public.approval_workflow_steps
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_workflow_steps_delete ON public.approval_workflow_steps;
CREATE POLICY approval_workflow_steps_delete ON public.approval_workflow_steps
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- approval_requests ----
DROP POLICY IF EXISTS approval_requests_select ON public.approval_requests;
CREATE POLICY approval_requests_select ON public.approval_requests
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_requests_insert ON public.approval_requests;
CREATE POLICY approval_requests_insert ON public.approval_requests
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_requests_update ON public.approval_requests;
CREATE POLICY approval_requests_update ON public.approval_requests
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_requests_delete ON public.approval_requests;
CREATE POLICY approval_requests_delete ON public.approval_requests
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- approval_steps ----
DROP POLICY IF EXISTS approval_steps_select ON public.approval_steps;
CREATE POLICY approval_steps_select ON public.approval_steps
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_steps_insert ON public.approval_steps;
CREATE POLICY approval_steps_insert ON public.approval_steps
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_steps_update ON public.approval_steps;
CREATE POLICY approval_steps_update ON public.approval_steps
  FOR UPDATE USING (company_id = public.current_company_id());

-- ---- approval_actions (insert-only audit) ----
DROP POLICY IF EXISTS approval_actions_select ON public.approval_actions;
CREATE POLICY approval_actions_select ON public.approval_actions
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_actions_insert ON public.approval_actions;
CREATE POLICY approval_actions_insert ON public.approval_actions
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- ---- approval_notifications ----
DROP POLICY IF EXISTS approval_notifs_select ON public.approval_notifications;
CREATE POLICY approval_notifs_select ON public.approval_notifications
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_notifs_insert ON public.approval_notifications;
CREATE POLICY approval_notifs_insert ON public.approval_notifications
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS approval_notifs_update ON public.approval_notifications;
CREATE POLICY approval_notifs_update ON public.approval_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
