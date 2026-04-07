import Link from "next/link";

export function Logo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "small" | "default" | "large";
}) {
  const sizes = {
    small: { wrapper: "gap-0.5", valley: "text-lg", sub: "text-[8px] tracking-[0.25em]" },
    default: { wrapper: "gap-1", valley: "text-2xl", sub: "text-[10px] tracking-[0.3em]" },
    large: { wrapper: "gap-1.5", valley: "text-4xl", sub: "text-xs tracking-[0.35em]" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className={`flex flex-col items-center ${s.wrapper} ${className}`}>
      <div className="flex items-center gap-2">
        {/* Coffee bean icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${size === "small" ? "w-4 h-4" : size === "large" ? "w-8 h-8" : "w-5 h-5"} text-primary`}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3" />
          <path d="M12 4c-1.5 0-2.9.4-4.1 1.1C9.4 6.2 11 8.9 11 12s-1.6 5.8-3.1 6.9C9.1 19.6 10.5 20 12 20c4.41 0 8-3.59 8-8s-3.59-8-8-8z" />
        </svg>
        <span
          className={`font-display font-bold ${s.valley} text-foreground tracking-wider`}
        >
          VALLEY
        </span>
      </div>
      <span
        className={`font-sans font-medium ${s.sub} text-muted-foreground uppercase`}
      >
        Specialty Roasters
      </span>
    </Link>
  );
}
