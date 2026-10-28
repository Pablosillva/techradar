import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide Open Graph card, generated once at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070b12",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "rgba(59,141,255,0.28)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              background: "linear-gradient(135deg, #4da3ff 0%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#04101f",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            {"</>"}
          </div>
          <div
            style={{
              // Satori requires an explicit display on any div with >1 child.
              display: "flex",
              fontSize: 34,
              fontWeight: 800,
              color: "#e8eef9",
            }}
          >
            Tech<span style={{ color: "#3b8dff" }}>Lab</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 66, fontWeight: 800, color: "#e8eef9", lineHeight: 1.1 }}>
            Tudo sobre tecnologia, IA e programação
          </div>
          <div style={{ fontSize: 30, color: "#93a4bf" }}>
            {`Artigos, tutoriais e ${tools.length} ferramentas online gratuitas`}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
