import type { MetadataRoute } from "next";
import { appCreditLongStatement, appCredits } from "@/lib/config/credits";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appCredits.project} - ${appCredits.team}`,
    short_name: appCredits.project,
    description: appCreditLongStatement,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e9",
    theme_color: "#0f766e",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/images/logos/logo_cn_downscale.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

