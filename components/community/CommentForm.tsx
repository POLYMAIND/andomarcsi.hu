'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { MentionTextarea } from '@/components/community/MentionTextarea';
import { removeCommunityFile, uploadCommunityFile, type Uploaded } from '@/lib/community-upload';

function Submit({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn sm" disabled={disabled || pending} aria-busy={pending}>
      {pending ? 'Küldés…' : label}
    </button>
  );
}

// Hozzászólás vagy válasz: szöveg @említéssel, max. 2 kép.
export function CommentForm({
  action,
  postId,
  parentId,
  userId,
  placeholder,
  label = 'Elküldöm',
  autoFocus = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  postId: string;
  parentId?: string;
  userId: string;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
}) {
  const [images, setImages] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const up = await uploadCommunityFile(file, userId, { allowVideo: false });
      setImages((prev) => [...prev, up].slice(0, 2));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <form action={action} className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <input type="hidden" name="images" value={JSON.stringify(images.map((i) => i.path))} />
      <MentionTextarea name="body" rows={parentId ? 2 : 3} maxLength={3000} placeholder={placeholder} autoFocus={autoFocus} />
      {images.length > 0 && (
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          {images.map((m) => (
            <div key={m.path} style={{ position: 'relative' }}>
              <img src={m.preview} alt="" className="kz-thumb" style={{ width: 72, height: 72 }} />
              <button type="button" className="kz-thumb-x" aria-label="Kép eltávolítása" onClick={() => { setImages((p) => p.filter((x) => x.path !== m.path)); removeCommunityFile(m.path); }}>×</button>
            </div>
          ))}
        </div>
      )}
      {error && <div className="notice err" role="alert">{error}</div>}
      <div className="row between" style={{ '--gap': '8px' } as React.CSSProperties}>
        <label className="kz-react" style={{ cursor: images.length >= 2 ? 'default' : 'pointer', opacity: images.length >= 2 ? 0.5 : 1 }}>
          📷 {uploading ? 'Feltöltés…' : 'Kép'}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={images.length >= 2} onChange={(e) => onFile(e.target.files)} />
        </label>
        <Submit disabled={uploading} label={label} />
      </div>
    </form>
  );
}
