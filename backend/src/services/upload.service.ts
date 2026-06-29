import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

export interface UploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const UploadService = {
  /** Uploads a buffer either to Cloudinary (if configured) or local disk, returning a public URL. */
  async upload(file: Express.Multer.File, folder = "vms"): Promise<UploadResult> {
    if (env.cloudinary.enabled) {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "auto" },
          (error, uploadResult) => {
            if (error || !uploadResult) return reject(error ?? new Error("Cloudinary upload failed"));
            resolve(uploadResult);
          }
        );
        stream.end(file.buffer);
      });
      return {
        url: result.secure_url,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    }

    // Local disk fallback — served statically from /uploads
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const destDir = path.join(LOCAL_UPLOAD_DIR, folder);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, safeName), file.buffer);

    return {
      url: `/uploads/${folder}/${safeName}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  },
};
