import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ExtractedItem = {
  name: string;
  value: number | null;
  unit: string | null;
  date: string | null;
  maps_to: "systolic_bp" | "diastolic_bp" | "serum_creatinine" | "hemoglobin" | "urine_albumin" | "other";
};
export type ExtractResult =
  | { ok: true; reportDate: string | null; items: ExtractedItem[] }
  | { ok: false; reason: string };

const MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_B64 = 7_000_000; // ~5 MB file

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["report_date", "measurements"],
  properties: {
    report_date: { type: ["string", "null"], description: "Report/collection date as YYYY-MM-DD, or null if not printed." },
    measurements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "value", "unit", "date", "maps_to"],
        properties: {
          name: { type: "string" },
          value: { type: ["number", "null"] },
          unit: { type: ["string", "null"] },
          date: { type: ["string", "null"], description: "YYYY-MM-DD if a per-test date is printed, else null." },
          maps_to: { type: "string", enum: ["systolic_bp", "diastolic_bp", "serum_creatinine", "hemoglobin", "urine_albumin", "other"] },
        },
      },
    },
  },
};

const PROMPT = `You read photos of medical lab reports. Transcribe ONLY what is printed: each test name, its numeric result, its unit, and any date. Never guess, compute, convert units, or fill in values that are not clearly visible — use null instead. Do not interpret or diagnose.
maps_to: "serum_creatinine" for serum/blood creatinine; "hemoglobin" for hemoglobin/Hb; "urine_albumin" only for a urine albumin/protein dipstick graded 0-5 (map Negative=0, Trace=1, 1+=1, 2+=2 ... 5+=5); "systolic_bp"/"diastolic_bp" for blood pressure readings; everything else "other". If the image is not a lab report, return an empty measurements list.`;

export const extractLabReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mime: string; base64: string; filename?: string }) => {
    if (!input || !MIMES.includes(input.mime) || typeof input.base64 !== "string") throw new Error("Unsupported file type.");
    if (!input.base64.trim() || input.base64.length > MAX_B64) throw new Error("File is empty or larger than 5 MB.");
    return { mime: input.mime, base64: input.base64, filename: String(input.filename ?? "report.pdf").slice(0, 100) };
  })
  .handler(async ({ data }): Promise<ExtractResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, reason: "The reader isn't configured yet." };
    const media =
      data.mime === "application/pdf"
        ? { type: "input_file", filename: data.filename, file_data: `data:application/pdf;base64,${data.base64}` }
        : { type: "input_image", image_url: `data:${data.mime};base64,${data.base64}` };
    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          stream: true,
          store: false,
          reasoning: { effort: "low", summary: "auto" },
          include: ["reasoning.encrypted_content"],
          text: { format: { type: "json_schema", name: "lab_report", strict: true, schema } },
          input: [
            { role: "system", content: PROMPT },
            { role: "user", content: [{ type: "input_text", text: "Extract the measurements from this lab report." }, media] },
          ],
        }),
      });
    } catch (e) {
      console.error("lab extract fetch", e);
      return { ok: false, reason: "Could not reach the reader. Please try again." };
    }
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("lab extract", res.status, body);
      let msg = "";
      try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? ""; } catch { /* ignore */ }
      if (res.status === 429) return { ok: false, reason: "Too many requests right now. Please wait a moment and try again." };
      if (res.status === 402) return { ok: false, reason: msg || "AI credits have run out for this workspace." };
      if (res.status === 403) return { ok: false, reason: msg || "The reader isn't available for this account." };
      if (res.status === 400) return { ok: false, reason: "This file couldn't be read. Try a clearer photo." };
      return { ok: false, reason: "The reader had a problem. Please try again later." };
    }
    // Consume SSE
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", failed: string | null = null, refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, i); buf = buf.slice(i + 2);
        const line = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
        if (!line || line === "[DONE]") continue;
        try {
          const ev = JSON.parse(line);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") refused = true;
          else if (ev.type === "response.failed" || ev.type === "error") failed = ev.response?.error?.message ?? ev.message ?? "failed";
        } catch { /* partial */ }
      }
    }
    if (refused) return { ok: false, reason: "The reader declined to process this image." };
    if (failed || !text.trim()) { console.error("lab extract stream", failed); return { ok: false, reason: "No readable results were found. Try a clearer photo." }; }
    try {
      const parsed = JSON.parse(text) as { report_date: string | null; measurements: ExtractedItem[] };
      return { ok: true, reportDate: parsed.report_date, items: parsed.measurements ?? [] };
    } catch {
      return { ok: false, reason: "The results couldn't be read. Please try again." };
    }
  });
