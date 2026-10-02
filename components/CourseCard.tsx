import Link from 'next/link';
import { formatHuf, toolColor } from '@/lib/format';
import { soonLabel, type Course } from '@/lib/types';

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
        </div>
        {course.coming_soon ? <span className="pill new">{soonLabel(course)}</span> : newCount > 0 && <span className="pill new">+{newCount} új</span>}
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
            {lessonCount} lecke
          </span>
          <span className="price">{owned ? 'Megvetted' : hasAccess ? 'Hozzáférsz' : formatHuf(course.price_huf)}</span>
        </div>
      </div>
    </Link>
  );
}
