CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text CHECK (char_length(full_name) <= 100),
  birth_year int CHECK (birth_year BETWEEN 1900 AND 2010),
  preferred_units text NOT NULL DEFAULT 'conventional' CHECK (preferred_units IN ('conventional','si')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.health_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  hypertension_history boolean,
  diabetes_history boolean,
  family_history_ckd boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_profiles TO authenticated;
GRANT ALL ON public.health_profiles TO service_role;
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hp all" ON public.health_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assessment_date timestamptz NOT NULL DEFAULT now(),
  model_version text NOT NULL,
  model_output_type text NOT NULL DEFAULT 'classifier_score',
  model_output text NOT NULL,
  probability numeric,
  risk_category text,
  confidence text,
  data_completeness numeric NOT NULL,
  input_snapshot jsonb NOT NULL,
  result_explanation jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.risk_assessments (user_id, assessment_date DESC);
GRANT SELECT, INSERT, DELETE ON public.risk_assessments TO authenticated;
GRANT ALL ON public.risk_assessments TO service_role;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ra select" ON public.risk_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ra insert" ON public.risk_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ra delete" ON public.risk_assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t1 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t2 BEFORE UPDATE ON public.health_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, left(NEW.raw_user_meta_data->>'full_name', 100));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();