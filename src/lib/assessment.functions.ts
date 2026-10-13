import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAssessment, type AssessmentResult } from "@/lib/model/inference";

type RawInput = Record<string, unknown>;

function cleanInput(input: unknown): RawInput {
  if (!input || typeof input !== "object") return {};
  const out: RawInput = {};
  for (const k of ["age", "bp", "sc", "al", "hemo", "htn", "dm"]) {
    const v = (input as RawInput)[k];
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Public: guests can run an assessment. Nothing is stored. */
export const predictAssessment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cleanInput(input))
  .handler(async ({ data }): Promise<AssessmentResult | { status: "error"; modelVersion: string }> => {
    try {
      return runAssessment(data);
    } catch (e) {
      console.error("inference failed", e);
      return { status: "error", modelVersion: "unknown" };
    }
  });

/** Signed-in: re-runs inference server-side so saved results can't be forged. */
export const saveAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cleanInput(input))
  .handler(async ({ data, context }) => {
    const r = runAssessment(data);
    if (r.status !== "ok") return { ok: false as const, reason: "Only completed assessments can be saved." };
    const { error } = await context.supabase.from("risk_assessments").insert({
      user_id: context.userId,
      model_version: r.modelVersion,
      model_output_type: "classifier_score",
      model_output: r.classification,
      probability: null,
      risk_category: null,
      confidence: r.confidence,
      data_completeness: r.completeness,
      input_snapshot: data as never,
      result_explanation: { score: r.score, factors: r.factors, confidenceReasons: r.confidenceReasons } as never,
    });
    if (error) { console.error(error); return { ok: false as const, reason: "Could not save right now. Please try again." }; }
    return { ok: true as const };
  });
