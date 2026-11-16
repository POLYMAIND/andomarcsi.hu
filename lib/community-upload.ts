'use client';

import { createBrowserSupabase } from '@/lib/supabase/client';

// Feltöltés a privát „community” tárhelyre: a kép a böngészőben kicsinyítve (JPEG), a videó változatlanul.
const BUCKET = 'community';
export const MAX_VIDEO_MB = 100; // a tárhely (community bucket) korlátja is ennyi
const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };

export const randomName = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

export async function prepareImage(file: File, maxSide = 1600): Promise<{ blob: Blob; ext: string; type: string }> {
  if (file.type === 'image/gif') return { blob: file, ext: 'gif', type: file.type };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('kép'))), 'image/jpeg', 0.85));
  return { blob, ext: 'jpg', type: 'image/jpeg' };
}

export type Uploaded = { path: string; preview: string; video?: boolean };

// Egy fájl feltöltése; hibánál magyar üzenettel dob.
export async function uploadCommunityFile(file: File, userId: string, { allowVideo = true, prefix = '' } = {}): Promise<Uploaded> {
  const supabase = createBrowserSupabase();
  const videoExt = VIDEO_TYPES[file.type] ?? (/\.(mp4|mov|webm)$/i.exec(file.name)?.[1]?.toLowerCase() ?? null);
  if (videoExt) {
    if (!allowVideo) throw new Error('Ide csak képet tölthetsz fel.');
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`A videó túl nagy (max. ${MAX_VIDEO_MB} MB). Vágd rövidebbre, vagy mentsd kisebb felbontásban.`);
    const path = `${userId}/${prefix}${randomName()}.${videoExt}`;
    const type = file.type || (videoExt === 'mov' ? 'video/quicktime' : `video/${videoExt}`);
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: type, upsert: false });
    if (error) throw new Error('A videó feltöltése nem sikerült, próbáld újra.');
    return { path, preview: URL.createObjectURL(file), video: true };
  }
  if (!file.type.startsWith('image/')) throw new Error(allowVideo ? 'Csak képet vagy videót (MP4, MOV, WebM) tölthetsz fel.' : 'Csak képet tölthetsz fel.');
  const { blob, ext, type } = await prepareImage(file, prefix ? 400 : 1600);
  if (blob.size > 5 * 1024 * 1024) throw new Error('A kép túl nagy (max. 5 MB).');
  const path = `${userId}/${prefix}${randomName()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw new Error('A feltöltés nem sikerült, próbáld újra.');
  return { path, preview: URL.createObjectURL(blob) };
}

export function removeCommunityFile(path: string) {
  void createBrowserSupabase().storage.from(BUCKET).remove([path]);
}
