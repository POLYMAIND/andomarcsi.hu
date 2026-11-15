'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createBrowserSupabase } from '@/lib/supabase/client';

const BUCKET = 'community';
const MAX_IMAGES = 4;
const MAX_SIDE = 1600;

type Kind = 'question' | 'showcase';
type Img = { path: string; preview: string };

// Kép kicsinyítése a böngészőben (max. 1600 px, JPEG), hogy gyors legyen és kevés helyet foglaljon.
// Az animált GIF-et változatlanul hagyjuk.
async function prepareImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  if (file.type === 'image/gif') return { blob: file, ext: 'gif', type: file.type };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
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

const randomName = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={disabled || pending} aria-busy={pending}>
      {pending ? 'Közzététel…' : 'Közzéteszem'}
    </button>
  );
}

export function CommunityComposer({
  action,
  userId,
  courses,
  defaultKind = 'question',
  defaultCourse = '',
}: {
  action: (formData: FormData) => void | Promise<void>;
  userId: string;
  courses: { id: string; title: string }[];
  defaultKind?: Kind;
  defaultCourse?: string;
}) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [images, setImages] = useState<Img[]>([]);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const list = Array.from(files).slice(0, MAX_IMAGES - images.length);
    if (files.length > list.length) setError(`Legfeljebb ${MAX_IMAGES} képet tölthetsz fel.`);
    const supabase = createBrowserSupabase();
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          if (!file.type.startsWith('image/')) throw new Error('Csak képet tölthetsz fel.');
          const { blob, ext, type } = await prepareImage(file);
          if (blob.size > 5 * 1024 * 1024) throw new Error('A kép túl nagy (max. 5 MB).');
          const path = `${userId}/${randomName()}.${ext}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
          if (upErr) throw new Error('A feltöltés nem sikerült, próbáld újra.');
          setImages((prev) => [...prev, { path, preview: URL.createObjectURL(blob) }]);
        } catch (e) {
          setError((e as Error).message || 'A feltöltés nem sikerült.');
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(path: string) {
    setImages((prev) => prev.filter((i) => i.path !== path));
    void createBrowserSupabase().storage.from(BUCKET).remove([path]);
  }

  return (
    <form action={action} className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="images" value={JSON.stringify(images.map((i) => i.path))} />
      <div className="row" style={{ '--gap': '8px' } as React.CSSProperties} role="group" aria-label="Bejegyzés típusa">
        {(
          [
            ['question', '❓ Kérdezek'],
            ['showcase', '✨ Megmutatom, mit csináltam'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className="btn sm"
            style={{ background: kind === k ? 'var(--ink)' : '#fff', color: kind === k ? '#fff' : 'var(--ink)', borderColor: 'var(--ink)' }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="field">
        Cím
        <input
          className="input"
          name="title"
          required
          minLength={3}
          maxLength={140}
          placeholder={kind === 'question' ? 'Pl. Hogyan teszek saját betűtípust a Canvába?' : 'Pl. Elkészült az első karusszelem!'}
        />
      </label>
      <label className="field">
        {kind === 'question' ? 'Miben akadtál el?' : 'Mesélj róla (nem kötelező)'}
        <textarea
          className="input textarea"
          name="body"
          maxLength={5000}
          rows={5}
          required={kind === 'question'}
          placeholder={kind === 'question' ? 'Írd le, mit szerettél volna, mit próbáltál, és mi történt helyette. Képernyőképet is csatolhatsz.' : 'Mivel készült, mi volt a nehéz, mire vagy büszke?'}
        />
      </label>
      <div className="row" style={{ '--gap': '10px', alignItems: 'flex-end' } as React.CSSProperties}>
        <label className="field" style={{ flex: '1 1 260px' }}>
          Téma (kurzus)
          <select className="select" name="course_id" defaultValue={defaultCourse}>
            <option value="">Általános</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        <label className="btn light" style={{ cursor: images.length >= MAX_IMAGES ? 'default' : 'pointer', opacity: images.length >= MAX_IMAGES ? 0.5 : 1 }}>
          📷 {kind === 'showcase' ? 'Képek a munkádról' : 'Képernyőkép csatolása'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            disabled={images.length >= MAX_IMAGES}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      </div>
      {(images.length > 0 || uploading > 0) && (
        <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
          {images.map((img) => (
            <div key={img.path} style={{ position: 'relative' }}>
              <img src={img.preview} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
              <button
                type="button"
                onClick={() => removeImage(img.path)}
                aria-label="Kép eltávolítása"
                style={{ position: 'absolute', top: -8, right: -8, width: 26, height: 26, borderRadius: 999, border: 0, background: 'var(--ink)', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <div key={`u${i}`} className="muted" style={{ width: 96, height: 96, borderRadius: 14, background: 'var(--paper)', display: 'grid', placeItems: 'center', fontSize: 12 }}>
              Feltöltés…
            </div>
          ))}
        </div>
      )}
      {error && <div className="notice err" role="alert">{error}</div>}
      <div className="row between" style={{ '--gap': '10px' } as React.CSSProperties}>
        <span className="muted" style={{ fontSize: 13 }}>A bejegyzésedet csak a közösség tagjai látják.</span>
        <Submit disabled={uploading > 0} />
      </div>
    </form>
  );
}
