'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { MentionTextarea } from '@/components/community/MentionTextarea';
import { removeCommunityFile, uploadCommunityFile, type Uploaded } from '@/lib/community-upload';

const MAX_MEDIA = 4;
const TITLE_MAX = 80;
const TAGS = [
  ['success', '🏆 Siker'],
  ['first_try', '🌱 Első próbálkozás'],
  ['feedback', '🙏 Visszajelzést kérek'],
] as const;
const PLATFORMS = [
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
] as const;

type Course = { id: string; title: string; slug: string };

function Submit({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={disabled || pending} aria-busy={pending}>
      {pending ? 'Közzététel…' : label}
    </button>
  );
}

// Poszt-szerkesztő: cím, szöveg (@említés, félkövér), kép/videó, link + platform, címke, tanfolyam.
// A Kérdezz! térben beküldés előtt az AI-segítő ad egy privát első választ („Ez segít, vagy kiteszed a közösségnek?”).
export function Composer({
  action,
  userId,
  space,
  courses,
  fixedCourse = null,
  back,
  placeholder,
}: {
  action: (formData: FormData) => void | Promise<void>;
  userId: string;
  space: { slug: string; kind: string; name: string };
  courses: Course[];
  fixedCourse?: Course | null;
  back: string;
  placeholder?: string;
}) {
  const isQa = space.kind === 'qa';
  const withTag = space.kind === 'feed' || space.kind === 'course';
  const [title, setTitle] = useState('');
  const [media, setMedia] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [ai, setAi] = useState<{ state: 'idle' | 'loading' | 'done'; text: string }>({ state: 'idle', text: '' });
  const [helped, setHelped] = useState(false);
  const aiPassed = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const list = Array.from(files).slice(0, MAX_MEDIA - media.length);
    if (files.length > list.length) setError(`Legfeljebb ${MAX_MEDIA} képet vagy videót tölthetsz fel.`);
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const up = await uploadCommunityFile(file, userId);
          setMedia((prev) => [...prev, up]);
        } catch (e) {
          setError((e as Error).message || 'A feltöltés nem sikerült.');
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (fileRef.current) fileRef.current.value = '';
  }

  // Kérdezz!: az AI előbb privát választ ad; ha ez nem segít, a kérdés kimegy a közösségnek.
  async function askAi(form: HTMLFormElement) {
    const fd = new FormData(form);
    const courseId = String(fd.get('course_id') ?? '');
    const courseSlug = (fixedCourse ?? courses.find((c) => c.id === courseId))?.slug;
    const content = `${fd.get('title')}\n\n${String(fd.get('body') ?? '').replace(/@\[([^\]]+)\]\([0-9a-f-]{36}\)/gi, '@$1')}`;
    setAi({ state: 'loading', text: '' });
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content }], courseSlug }),
      });
      if (!res.ok || !res.body) throw new Error('nincs ai');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setAi({ state: 'loading', text });
      }
      setAi({ state: 'done', text });
    } catch {
      // ha az AI most nem elérhető, a kérdés egyből kimegy
      setAi({ state: 'idle', text: '' });
      publish();
    }
  }

  function publish() {
    aiPassed.current = true;
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  if (helped) {
    return (
      <div className="notice ok" role="status">
        Örülök, hogy segített! 🙌 Ha mégis elakadsz, kérdezz bátran – itt leszünk.{' '}
        <button type="button" className="link-btn" onClick={() => { setHelped(false); setAi({ state: 'idle', text: '' }); aiPassed.current = false; }}>
          Új kérdés
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="stack kz-composer"
      style={{ '--gap': '12px' } as React.CSSProperties}
      onSubmit={(e) => {
        if (isQa && !aiPassed.current) {
          e.preventDefault();
          if (ai.state === 'idle') void askAi(e.currentTarget);
        }
      }}
    >
      <input type="hidden" name="space" value={space.slug} />
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="images" value={JSON.stringify(media.map((m) => m.path))} />
      {fixedCourse && <input type="hidden" name="course_id" value={fixedCourse.id} />}

      <label className="field">
        <span className="row between"><span>Cím</span><span className="muted mono" style={{ fontSize: 12 }}>{title.length}/{TITLE_MAX}</span></span>
        <input
          className="input"
          name="title"
          required
          minLength={3}
          maxLength={TITLE_MAX}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isQa ? 'Pl. Hogyan teszek saját betűtípust a Canvába?' : space.kind === 'announcement' ? 'Pl. Új anyag: …' : 'Pl. Elkészült az első karusszelem!'}
        />
      </label>
      <label className="field">
        {isQa ? 'Miben akadtál el?' : 'Szöveg'}
        <MentionTextarea
          name="body"
          required={isQa}
          placeholder={placeholder ?? (isQa ? 'Írd le, mit szerettél volna, mit próbáltál, és mi történt helyette. Egy képernyőkép sokat segít.' : 'Mivel készült, mi volt a legnehezebb, mire vagy büszke?')}
        />
      </label>

      {withTag && (
        <fieldset className="kz-chips" aria-label="Típus">
          {TAGS.map(([v, l]) => (
            <label key={v} className="kz-chip">
              <input type="radio" name="tag" value={v} defaultChecked={v === 'success'} />
              <span>{l}</span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="row" style={{ '--gap': '10px', alignItems: 'flex-end' } as React.CSSProperties}>
        {!fixedCourse && courses.length > 0 && (
          <label className="field" style={{ flex: '1 1 240px' }}>
            Melyik tanfolyamhoz kapcsolódik?
            <select className="select" name="course_id" defaultValue="">
              <option value="">Egyikhez sem / általános</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
        )}
        <label className="btn light" style={{ cursor: media.length >= MAX_MEDIA ? 'default' : 'pointer', opacity: media.length >= MAX_MEDIA ? 0.5 : 1 }}>
          📷 Kép vagy videó
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            multiple
            hidden
            disabled={media.length >= MAX_MEDIA}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
        {!showLink && (
          <button type="button" className="btn light" onClick={() => setShowLink(true)}>🔗 Link</button>
        )}
      </div>

      {showLink && (
        <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
          <label className="field">
            Link (Instagram, TikTok, YouTube, Facebook vagy bármi más)
            <input className="input" name="link_url" type="url" inputMode="url" placeholder="https://www.instagram.com/p/…" maxLength={500} />
          </label>
          <fieldset className="kz-chips" aria-label="Hol jelent meg? (nem kötelező)">
            <span className="muted" style={{ fontSize: 13 }}>Hol jelent meg?</span>
            {PLATFORMS.map(([v, l]) => (
              <label key={v} className="kz-chip">
                <input type="checkbox" name="platforms" value={v} />
                <span>{l}</span>
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {(media.length > 0 || uploading > 0) && (
        <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
          {media.map((m) => (
            <div key={m.path} style={{ position: 'relative' }}>
              {m.video ? (
                <span style={{ position: 'relative', display: 'block' }}>
                  <video src={m.preview} muted playsInline preload="metadata" className="kz-thumb" />
                  <span aria-hidden="true" className="kz-thumb-play">▶</span>
                </span>
              ) : (
                <img src={m.preview} alt="" className="kz-thumb" />
              )}
              <button
                type="button"
                className="kz-thumb-x"
                onClick={() => {
                  setMedia((prev) => prev.filter((i) => i.path !== m.path));
                  removeCommunityFile(m.path);
                }}
                aria-label="Eltávolítás"
              >
                ×
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <div key={`u${i}`} className="kz-thumb muted" style={{ display: 'grid', placeItems: 'center', fontSize: 12, background: 'var(--paper)' }}>Feltöltés…</div>
          ))}
        </div>
      )}
      {error && <div className="notice err" role="alert">{error}</div>}

      {isQa && ai.state !== 'idle' && (
        <div className="kz-ai" role="status" aria-live="polite">
          <span className="eyebrow">Gyors első válasz – csak te látod</span>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.6 }}>{ai.text || 'Gondolkodom…'}</div>
          {ai.state === 'done' && (
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <strong style={{ fontSize: 15 }}>Ez segít, vagy kiteszed a közösségnek?</strong>
              <button type="button" className="btn sm light" onClick={() => setHelped(true)}>Ez segített, köszi</button>
              <button type="button" className="btn sm" onClick={publish}>Kiteszem a közösségnek →</button>
            </div>
          )}
        </div>
      )}

      <div className="row between" style={{ '--gap': '10px' } as React.CSSProperties}>
        <span className="muted" style={{ fontSize: 13 }}>Csak a közösség tagjai látják.</span>
        {!(isQa && ai.state !== 'idle') && <Submit disabled={uploading > 0} label={isQa ? 'Kérdezem' : 'Közzéteszem'} />}
      </div>
    </form>
  );
}
