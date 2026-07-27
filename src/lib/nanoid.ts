import { customAlphabet } from "nanoid";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

export const nanoid = customAlphabet(alphabet, 10);

export function generateSlug(): string {
  return nanoid();
}
