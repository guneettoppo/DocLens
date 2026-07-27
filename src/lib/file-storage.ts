import { put, del } from "@vercel/blob";
import { generateSlug } from "./nanoid";
import * as path from "path";

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ filePath: string; slug: string; ext: string }> {
  const ext = path.extname(originalName) || ".bin";
  const slug = generateSlug();
  const fileName = `${slug}${ext}`;

  const blob = await put(fileName, buffer, {
    access: "public",
    addRandomSuffix: false,
  });

  return { filePath: blob.url, slug, ext };
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch {
    return null;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await del(filePath);
  } catch {
    // already gone
  }
}
