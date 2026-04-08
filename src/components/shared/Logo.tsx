import Link from "next/link";
import Image from "next/image";

export function Logo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "small" | "default" | "large";
}) {
  const sizes = {
    small: { img: 40, wrapper: "" },
    default: { img: 56, wrapper: "" },
    large: { img: 120, wrapper: "" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Valley Specialty Roasters"
        width={s.img}
        height={s.img}
        className="rounded-full"
        priority
      />
      {size !== "small" && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight tracking-wide">
            VALLEY SPECIALTY
          </span>
          <span className="font-display font-bold text-lg leading-tight tracking-wide">
            ROASTERS
          </span>
        </div>
      )}
    </Link>
  );
}
