import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { feeCardLabel, type PassportEntry } from "@/lib/passport-lookup";

// The stay · fee (· processing) line under a country name in the Visa-free
// and eVisa lists, plus badges for entries that only apply conditionally or
// that no Nepal-specific source has confirmed.
export function VisaEntryMeta({ entry, showProcessing }: { entry: PassportEntry; showProcessing?: boolean }) {
  const { t } = useLanguage();
  const stay = entry.stayText
    ?? (entry.maxStay
      ? `${t("visa.up_to" as TranslationKey)} ${entry.maxStay} ${t("visa.days_unit" as TranslationKey)}`
      : t("visa.stay_varies" as TranslationKey));
  const fee = feeCardLabel(entry.fee);
  return (
    <>
      <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {stay}
        {fee ? ` · ${fee}` : ""}
        {showProcessing && entry.processingTime ? ` · ${entry.processingTime}` : ""}
      </div>
      {(entry.conditional || entry.unconfirmed) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {entry.conditional && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(247,200,100,0.12)", color: "hsl(42 90% 65%)" }}>
              Conditions apply
            </span>
          )}
          {entry.unconfirmed && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
              Check before travel
            </span>
          )}
        </div>
      )}
    </>
  );
}
