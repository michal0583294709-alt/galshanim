import { readImage } from "@/lib/uploads";

/** הגשת תמונות מוצר שהועלו (Netlify Blobs או דיסק מקומי) */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|svg)$/.test(key)) return new Response("Not found", { status: 404 });
  const img = await readImage(key);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(img.data, {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(img.contentType === "image/svg+xml" && { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" }),
    },
  });
}
