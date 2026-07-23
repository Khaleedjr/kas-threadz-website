import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MARK_GROUPS, MARK_VIEWBOX } from "@/lib/mark-stitches";
import { SITE } from "@/lib/site";

export const alt = "KAS THREADZ, bespoke embroidery in Abuja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card people see when the link is pasted into WhatsApp or Instagram.
 *
 * In this market that share is the distribution, so it carries the sewn mark
 * rather than a screenshot: the same 1,042 stitches the site draws, flattened
 * into paths.
 */
export default async function OpengraphImage() {
  const jost = await readFile(
    join(process.cwd(), "node_modules/@fontsource/jost/files/jost-latin-400-normal.woff"),
  ).catch(() => null);

  const paths = MARK_GROUPS.map((group) => {
    let d = "";
    for (let i = 0; i < group.order.length; i++) {
      const c = i * 4;
      d += `M${group.coords[c]} ${group.coords[c + 1]}L${group.coords[c + 2]} ${group.coords[c + 3]}`;
    }
    return { d, w: group.w, o: group.o };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #171c24 0%, #12161d 58%, #0b0e13 100%)",
        }}
      >
        <svg width="560" height="392" viewBox={MARK_VIEWBOX}>
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              stroke="#f4efe3"
              strokeWidth={p.w}
              strokeLinecap="round"
              opacity={p.o}
              fill="none"
            />
          ))}
        </svg>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 26,
            letterSpacing: 16,
            color: "#cbc2ad",
            paddingLeft: 16,
          }}
        >
          THREADZ
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 20,
            letterSpacing: 6,
            color: "#8d95a3",
          }}
        >
          BESPOKE EMBROIDERY · {SITE.city.toUpperCase()}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: jost
        ? [{ name: "Jost", data: jost, weight: 400 as const, style: "normal" as const }]
        : undefined,
    },
  );
}
