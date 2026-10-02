import Anthropic from '@anthropic-ai/sdk';
import { NextResponse, type NextRequest } from 'next/server';
import { AI_CHAT, HELPDESK_SYSTEM } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import type { Course, Lesson } from '@/lib/types';

export const maxDuration = 60;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return fail(503, 'Az AI segítő még nincs bekapcsolva.');

  const { supabase, user } = await getCurrentUser();
  if (!user) return fail(401, 'A kérdezéshez lépj be.');

  let body: { messages?: ChatTurn[]; courseSlug?: string; lessonId?: string };
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Hibás kérés.');
  }

  // Csak user/assistant szöveges üzenetek, utolsó N, user-rel kezdve és végződve.
  const turns = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-AI_CHAT.maxHistory)
    .map((m) => ({ role: m.role, content: m.content.slice(0, AI_CHAT.maxChars) }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') return fail(400, 'Üres kérdés.');

  // Napi keret (atomikus számláló az adatbázisban)
  const { data: used, error: limitErr } = await createAdminClient().rpc('bump_ai_chat', { uid: user.id, max_per_day: AI_CHAT.maxPerDay });
  if (limitErr) return fail(500, 'Most nem érem el a segítőt, próbáld újra.');
  if (used === -1) return fail(429, `Mára elérted a ${AI_CHAT.maxPerDay} kérdéses keretet – holnap folytathatjuk! Sürgős esetben írj: hello@andormarcsi.hu`);

  // Kurzus-kontextus: amit a felhasználó jogosultsága szerint is lát (RLS).
  let context = '';
  if (body.courseSlug) {
    const { data: course } = await supabase
      .from('courses')
      .select('id, title, subtitle, description, tool, level')
      .eq('slug', body.courseSlug)
      .maybeSingle<Pick<Course, 'id' | 'title' | 'subtitle' | 'description' | 'tool' | 'level'>>();
    if (course) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, description, sort_order')
        .eq('course_id', course.id)
        .order('sort_order')
        .returns<Pick<Lesson, 'id' | 'title' | 'description' | 'sort_order'>[]>();
      const current = lessons?.find((l) => l.id === body.lessonId);
      context = [
        `A felhasználó most ezt a kurzust nézi: „${course.title}” (${course.tool}, ${course.level}).`,
        course.subtitle && `Alcím: ${course.subtitle}`,
        course.description && `Leírás: ${course.description}`,
        lessons?.length ? `Leckék: ${lessons.map((l, i) => `${i + 1}. ${l.title}`).join('; ')}` : '',
        current ? `Éppen ezt a leckét nézi: „${current.title}”${current.description ? ` – ${current.description}` : ''}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
  }

  // Az állandó rendszerprompt cache-elve; a változó kurzus-kontextus utána jön.
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: 'text', text: HELPDESK_SYSTEM, cache_control: { type: 'ephemeral' } },
    ...(context ? [{ type: 'text' as const, text: context }] : []),
  ];

  const stream = anthropic().beta.messages.stream({
    model: AI_CHAT.model,
    max_tokens: 4000,
    output_config: { effort: 'low' }, // csevegés: gyors, rövid válaszok
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // ha a modell egy kérést elutasítana, a szerver automatikusan másik modellel válaszol
    system,
    messages: turns,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode('\n\nErre most nem tudok válaszolni. Kérdezz másképp, vagy írj Marcsinak: hello@andormarcsi.hu'));
        } else if (final.stop_reason === 'max_tokens') {
          controller.enqueue(encoder.encode('\n\n(A válasz hosszú lett, itt elvágtam – kérdezz rá a folytatásra.)'));
        }
      } catch (err) {
        const msg =
          err instanceof Anthropic.RateLimitError
            ? 'Most sokan kérdeznek egyszerre, próbáld újra pár másodperc múlva.'
            : err instanceof Anthropic.APIError
              ? 'Az AI segítő most nem érhető el, próbáld újra később.'
              : 'Megszakadt a kapcsolat, próbáld újra.';
        console.error('AI chat hiba', err);
        controller.enqueue(encoder.encode(`\n\n${msg}`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
