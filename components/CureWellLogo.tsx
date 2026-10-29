
import Link from "next/link";

type CureWellLogoProps = {
  light?: boolean;
  compact?: boolean;
  className?: string;
};

export default function CureWellLogo({
  light = false,
  compact = false,
  className = "",
}: CureWellLogoProps) {
  return (
    <Link
      href="/"
      aria-label="CureWell home"
      className={`inline-flex w-fit items-center gap-3 rounded-xl ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#187b91] text-xl font-bold text-white shadow-sm"
      >
        +
      </span>

      {!compact && (
        <span className="min-w-0">
          <span
            className={`block text-xl font-extrabold leading-tight tracking-tight ${
              light ? "text-white" : "text-slate-900"
            }`}
          >
            CureWell<span className="text-teal-500">.</span>
          </span>

          <span
            className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.13em] ${
              light ? "text-white/75" : "text-slate-500"
            }`}
          >
            Multispecialty Hospital
          </span>
        </span>
      )}
    </Link>
  );
}
