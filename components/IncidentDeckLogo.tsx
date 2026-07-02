import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

/**
 * Logo = ready-made FontAwesome icon (triangle-exclamation) + plain text mark.
 * No custom/generated logo. Icon source documented in README:
 * https://fontawesome.com/icons/triangle-exclamation
 */
export function IncidentDeckLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded border border-line2 bg-bg2 text-degraded">
        <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-semibold tracking-tight text-ink">
            Incident<span className="text-muted">Deck</span>
          </span>
        </span>
      )}
    </span>
  );
}
