import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";
import { requireApiUser, route } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { sniffMime, uploadBuffer } from "@/lib/cloudinary";
import { ALLOWED_MIME, MAX_FILE_BYTES } from "@/lib/constants";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const user = await requireApiUser();
  if (!rateLimit(`upload:${user.id}`, 20, 60_000)) throw new ApiError(429, "Too many uploads");
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new ApiError(400, "No file provided");
  if (file.size === 0 || file.size > MAX_FILE_BYTES) throw new ApiError(413, "Files must be under 4 MB");
  if (!ALLOWED_MIME.includes(file.type)) throw new ApiError(415, "Only PNG, JPG, WEBP, GIF or PDF files are allowed");
  const buf = Buffer.from(await file.arrayBuffer());
  const real = sniffMime(buf);
  if (!real || !ALLOWED_MIME.includes(real)) throw new ApiError(415, "File content doesn't match an allowed type");
  let url: string;
  try {
    url = await uploadBuffer(buf);
  } catch (error) {
    const status = typeof error === "object" && error !== null && "http_code" in error &&
      typeof error.http_code === "number" ? error.http_code : undefined;
    console.error("[upload] Cloudinary upload failed", { status: status ?? "unknown", mimeType: real, size: buf.length });
    if (status === 401 || status === 403) {
      throw new ApiError(502, "Cloudinary authentication or permissions failed. Verify the cloud name, API key, and API secret belong to the same account, and that uploads are allowed.");
    }
    if (status === 400) {
      throw new ApiError(422, "Cloudinary rejected this file. Check that the file format is supported by your Cloudinary account.");
    }
    if (status !== undefined && status >= 500) {
      throw new ApiError(503, "Cloudinary is temporarily unavailable. Please try again later.");
    }
    throw new ApiError(502, "Could not complete the Cloudinary upload. Check your server credentials and network connection.");
  }
  return NextResponse.json({ url, name: file.name.slice(0, 100) });
});
