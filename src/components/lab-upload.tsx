import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractLabReport, type ExtractedItem } from "@/lib/lab-extract.functions";

const FIELDS: { k: ExtractedItem["maps_to"]; label: string; lo: number; hi: number }[] = [
  { k: "systolic_bp", label: "Systolic BP (mmHg)", lo: 60, hi: 260 },
  { k: "diastolic_bp", label: "Diastolic BP (mmHg)", lo: 30, hi: 160 },
  { k: "serum_creatinine", label: "Serum creatinine (mg/dL)", lo: 0.1, hi: 20 },
  { k: "hemoglobin", label: "Hemoglobin (g/dL)", lo: 1, hi: 25 },
  { k: "urine_albumin", label: "Urine albumin dipstick (0–5)", lo: 0, hi: 5 },
];
const today = () => new Date().toISOString().slice(0, 10);
const isDate = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= today();

type Row = ExtractedItem & { include: boolean; v: string };

export function LabUpload({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const extract = useServerFn(extractLabReport);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState("");
  const inp = "w-full rounded-lg border border-input bg-card px-2 py-1.5 text-foreground";

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Please use a file under 5 MB."); return; }
    setBusy(true); setRows(null); setStatus("Reading your report…");
    const base64 = await new Promise<string>((ok, bad) => {
      const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1] ?? ""); r.onerror = bad; r.readAsDataURL(file);
    });
    try {
      const res = await extract({ data: { mime: file.type, base64, filename: file.name } });
      if (!res.ok) { setStatus(res.reason); toast.error(res.reason); return; }
      const itemDate = res.items.find((i) => isDate(i.date))?.date ?? null;
      setDate(isDate(res.reportDate) ? res.reportDate! : itemDate ?? today());
      setRows(res.items.map((i) => ({ ...i, v: i.value == null ? "" : String(i.value), include: i.maps_to !== "other" && i.value != null })));
      setStatus(res.items.length ? `Found ${res.items.length} values. Please check them against your report before saving.` : "No measurements were found. Try a clearer photo.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read the file."); toast.error("Could not read the file.");
    } finally { setBusy(false); }
  }

  async function save() {
    if (!rows) return;
    const vals: Record<string, number> = {};
    for (const r of rows.filter((r) => r.include && r.maps_to !== "other")) {
      const f = FIELDS.find((x) => x.k === r.maps_to)!;
      const n = Number(r.v);
      if (r.v.trim() === "" || Number.isNaN(n) || n < f.lo || n > f.hi) { toast.error(`${f.label} should be between ${f.lo} and ${f.hi}.`); return; }
      if (vals[r.maps_to] != null) { toast.error(`Only one ${f.label} value can be saved per reading.`); return; }
      vals[r.maps_to] = r.maps_to === "urine_albumin" || r.maps_to.endsWith("_bp") ? Math.round(n) : n;
    }
    if (!Object.keys(vals).length) { toast.error("Select at least one value to save."); return; }
    if (!isDate(date)) { toast.error("Please enter a valid date that isn't in the future."); return; }
    setBusy(true);
    const { error } = await supabase.from("health_measurements").insert({
      user_id: userId, measured_at: new Date(date + "T12:00:00").toISOString(),
      systolic_bp: vals.systolic_bp ?? null, diastolic_bp: vals.diastolic_bp ?? null, serum_creatinine: vals.serum_creatinine ?? null,
      hemoglobin: vals.hemoglobin ?? null, urine_albumin: vals.urine_albumin ?? null, notes: "From uploaded lab report",
    });
    setBusy(false);
    if (error) { toast.error("Could not save. Please try again."); return; }
    toast.success("Measurements saved."); setRows(null); setStatus("Saved."); onSaved();
  }

  const upd = (i: number, p: Partial<Row>) => setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...p } : r)));

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6" aria-labelledby="lab-upload-h">
      <h2 id="lab-upload-h" className="text-xl font-semibold">Read values from a lab report</h2>
      <p className="text-sm text-muted-foreground">Upload a photo or PDF of your report. An AI reader copies the values it can see — it can make mistakes, so check every value against your report before saving. Nothing is saved until you confirm.</p>
      <label className="inline-block cursor-pointer rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted">
        {busy && !rows ? "Reading…" : "Choose photo or PDF"}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" disabled={busy}
          onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{status}</p>

      {rows && rows.length > 0 && (
        <div className="space-y-3">
          <label className="block max-w-xs text-sm font-medium">Report date
            <input type="date" max={today()} className={inp + " mt-1"} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">Save</th><th className="p-2">On report</th><th className="p-2">Value</th><th className="p-2">Save as</th></tr></thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="p-2"><input type="checkbox" aria-label={`Save ${r.name}`} checked={r.include} disabled={r.maps_to === "other"} onChange={(e) => upd(i, { include: e.target.checked })} /></td>
                    <td className="p-2"><span className="font-medium">{r.name}</span><span className="block text-xs text-muted-foreground">{r.unit ?? "no unit shown"}{r.date ? ` · ${r.date}` : ""}</span></td>
                    <td className="p-2"><input aria-label={`${r.name} value`} className={inp + " w-24"} value={r.v} onChange={(e) => upd(i, { v: e.target.value })} /></td>
                    <td className="p-2">
                      <select aria-label={`${r.name} saves as`} className={inp} value={r.maps_to} onChange={(e) => upd(i, { maps_to: e.target.value as Row["maps_to"], include: e.target.value !== "other" })}>
                        {FIELDS.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
                        <option value="other">Not tracked (won't be saved)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Check that each unit matches the field (e.g. creatinine in mg/dL). Units are not converted automatically.</p>
          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-60">{busy ? "Saving…" : "Save selected values"}</button>
            <button onClick={() => { setRows(null); setStatus(""); }} className="rounded-lg border border-input px-5 py-2.5 font-medium">Discard</button>
          </div>
        </div>
      )}
    </section>
  );
}
