<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## AI KidneyGuard rules
- The screening model is trained offline by `ml/train.py` and exported to `src/lib/model/ckd-model.json`; inference is pure TS in `src/lib/model/inference.ts` — why: workers can't run Python, and the logic stays testable.
- Saved assessments are recomputed server-side from inputs in `saveAssessment` — why: clients must not be able to forge results.
- Missing inputs return "insufficient", never imputed — why: the medical safety requirement in the brief.
