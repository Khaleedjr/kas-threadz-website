import Image from "next/image";
import Link from "next/link";

/*
 * The house mark with the desk's name beside it, for the top of every
 * studio page. Solid, never stitched: it is far below the size stitching
 * survives at. The register picks the cream or the burgundy, as on the site.
 */
export function StudioMark({ href }: { href: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-3" aria-label="KAS THREADZ Studio">
      {(["cream", "burgundy"] as const).map((tone) => (
        <Image
          key={tone}
          src={`/img/brand/logo-${tone}.png`}
          alt=""
          width={919}
          height={1043}
          priority
          className={`${tone === "cream" ? "logo-cloth" : "logo-paper"} h-[34px] w-auto`}
        />
      ))}
      <span className="label" style={{ color: "var(--accent)" }}>
        Studio
      </span>
    </Link>
  );
}
