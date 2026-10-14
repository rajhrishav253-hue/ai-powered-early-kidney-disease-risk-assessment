CREATE TABLE public.health_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  measured_at timestamptz NOT NULL DEFAULT now(),
  systolic_bp integer CHECK (systolic_bp BETWEEN 60 AND 260),
  diastolic_bp integer CHECK (diastolic_bp BETWEEN 30 AND 160),
  serum_creatinine numeric CHECK (serum_creatinine > 0 AND serum_creatinine <= 20),
  hemoglobin numeric CHECK (hemoglobin > 0 AND hemoglobin <= 25),
  urine_albumin integer CHECK (urine_albumin BETWEEN 0 AND 5),
  notes text CHECK (char_length(notes) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_measurements TO authenticated;
GRANT ALL ON public.health_measurements TO service_role;
ALTER TABLE public.health_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hm all" ON public.health_measurements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX health_measurements_user_date ON public.health_measurements (user_id, measured_at);