import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./errors";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(503, "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server, then restart it.");
  }
  if ([cloudName, apiKey, apiSecret].some((value) => /^(your[-_ ]|replace[-_ ]|<)/i.test(value))) {
    throw new ApiError(503, "Cloudinary credentials are still placeholders. Set valid credentials on the server, then restart it.");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudName;
}

/** Verify file type by magic bytes, not by the client-supplied MIME type. */
export function sniffMime(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export function uploadBuffer(buf: Buffer, folder = "helpdesk"): Promise<string> {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "auto" }, (err, res) => {
        if (err) return reject(err);
        if (!res?.secure_url) return reject(new Error("Cloudinary did not return a secure upload URL"));
        resolve(res.secure_url);
      })
      .end(buf);
  });
}

/** Attachments must be files we uploaded to *our* Cloudinary account. */
export function assertOwnAttachments(urls: string[]) {
  const cloudName = configureCloudinary();
  const prefix = `https://res.cloudinary.com/${cloudName}/`;
  if (urls.some((u) => !u.startsWith(prefix))) throw new ApiError(400, "Invalid attachment");
}
