import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon: the TechLab monogram, generated at build time. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4da3ff 0%, #22d3ee 100%)",
          borderRadius: 7,
          color: "#04101f",
          fontSize: 21,
          fontWeight: 800,
        }}
      >
        {"</>"}
      </div>
    ),
    { ...size },
  );
}
