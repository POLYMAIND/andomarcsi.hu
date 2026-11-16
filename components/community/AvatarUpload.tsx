'use client';

import { useState } from 'react';
import { Avatar } from '@/components/community/Avatar';
import { uploadCommunityFile } from '@/lib/community-upload';

// Profilkép feltöltése (a böngészőben 400 px-re kicsinyítve); a mentés a profil-űrlappal együtt megy.
export function AvatarUpload({ userId, name, current }: { userId: string; name: string; current: string | null }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [path, setPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="row" style={{ '--gap': '14px' } as React.CSSProperties}>
      <Avatar name={name} src={preview} size={72} />
      <input type="hidden" name="avatar_path" value={path} />
      <label className="btn light sm" style={{ cursor: 'pointer' }}>
        {busy ? 'Feltöltés…' : preview ? 'Új profilkép' : 'Profilkép feltöltése'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setError('');
            try {
              const up = await uploadCommunityFile(f, userId, { allowVideo: false, prefix: 'avatar-' });
              setPath(up.path);
              setPreview(up.preview);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && <span className="notice err" style={{ padding: '6px 10px' }}>{error}</span>}
    </div>
  );
}
