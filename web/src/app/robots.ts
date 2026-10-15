import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://fuzedrive.tech";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/preview/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
