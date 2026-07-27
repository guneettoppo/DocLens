import * as fs from "fs/promises";
import * as path from "path";
import { generateSlug } from "./nanoid";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // directory exists
  }
}

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ filePath: string; slug: string; ext: string }> {
  await ensureUploadsDir();

  const ext = path.extname(originalName) || ".bin";
  const slug = generateSlug();
  const fileName = `${slug}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  await fs.writeFile(filePath, buffer);

  return { filePath, slug, ext };
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // file already gone
  }
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}
