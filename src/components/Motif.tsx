import type { TemplateId } from "@/lib/templates";

/** The template backdrop. Purely decorative, so it is hidden from assistive tech. */
export function Motif({ template }: { template: TemplateId }) {
  return <div className={`motif motif-${template}`} aria-hidden="true" />;
}
