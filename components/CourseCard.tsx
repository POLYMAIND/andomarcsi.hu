import Link from 'next/link';
import { formatHuf, priceLabel, toolColor } from '@/lib/format';
import { ACADEMY, packageKind } from '@/lib/polyakademia';
import { saleInfo, soonLabel, type Course } from '@/lib/types';

export function CourseCard({
  course,
  lessonCount,
  newCount = 0,
  progress,
  hasAccess,
  owned,
}: {
  course: Course;
  lessonCount: number;
  newCount?: number;
  progress?: number; // 0..1
  hasAccess?: boolean;
  owned?: boolean;
}) {
  return (
    <Link href={`/kurzusok/${course.slug}`} className="course-card">
      <div className="head" style={{ background: toolColor(course.tool) }}>
        <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
          <span className="tool">{course.tool}</span>
          <span className="tag">{course.level}</span>
          {course.academy_level && <span className="ps-badge">{ACADEMY.badge}</span>}
        </div>
        <span className="stack" style={{ '--gap': '6px', alignItems: 'flex-end' } as React.CSSProperties}>
          {course.coming_soon ? <span className="pill new">{soonLabel(course)}</span> : newCount > 0 && <span className="pill new">+{newCount} új</span>}
          {saleInfo(course) && !course.price_note?.trim() && !hasAccess && (
            <span className="pill" style={{ background: 'var(--rose)', color: '#fff', fontWeight: 700 }}>−{saleInfo(course)!.pct}%</span>
          )}
        </span>
      </div>
      <div className="body">
        <h3 className="h3">{course.title}</h3>
        {course.subtitle && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)' }}>{course.subtitle}</p>}
        {progress !== undefined && (
          <div className="stack" style={{ '--gap': '6px', marginTop: 4 } as React.CSSProperties}>
            <div className="progress" aria-label={`Haladás: ${Math.round(progress * 100)}%`}>
              <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <span className="muted" style={{ fontSize: 13 }}>
              {Math.round(progress * 100)}% kész
            </span>
          </div>
        )}
        <div className="foot">
          <span className="muted" style={{ fontSize: 14 }}>
            {course.pocket_for ? `${packageKind(course)} · letölthető` : course.bundle_course_ids?.length ? `Csomag · ${course.bundle_course_ids.length} modul` : `${lessonCount} lecke`}
          </span>
          <span className="price">
            {owned ? 'Megvetted' : hasAccess ? 'Hozzáférsz' : priceLabel(course)}
            {!owned && !hasAccess && saleInfo(course) && !course.price_note?.trim() && (
              <s className="muted" style={{ fontSize: 13, fontWeight: 500, marginLeft: 6 }}>{formatHuf(saleInfo(course)!.listPrice)}</s>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
