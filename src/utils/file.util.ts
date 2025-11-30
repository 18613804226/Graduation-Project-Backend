// src/utils/file.util.ts
import { readFile } from 'fs/promises';

export async function readFileToBase64(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString('base64');
}
