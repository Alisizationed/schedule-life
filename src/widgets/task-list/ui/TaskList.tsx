import { useMemo, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { CATS, PRIOS, catOf, prioOf } from '@/shared/config';
import type { CategoryId, Priority } from '@/shared/config';
import { absMin, fmtDur, minToHHMM, shortDate, WDL } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';
import type { Occurrence, Task } from '@/entities/schedule';
import type { EditorInit } from '@/features/task-editor';

interface TaskListProps {
  now: Date;
  onEdit: (init: EditorInit) => void;
  setDate: (d: string) => void;
  setView: (v: 'day') => void;
}

type StatusFilter = 'all' | 'open' | 'done' | 'overdue';
type SortKey = 'date' | 'priority' | 'type' | 'title';

const PRIO_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2 };

export function TaskList({ now, onEdit, setDate, setView }: TaskListProps) {
  const tasks = useScheduleStore((s) => s.data.tasks);
  const toggleDone = useScheduleStore((s) => s.toggleDone);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [typeF, setTypeF] = useState<CategoryId | 'all'>('all');
  const [prioF, setPrioF] = useState<Priority | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('date');

  const nowAbs = absMin(
    now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'),
    now.getHours() * 60 + now.getMinutes(),
  );

  const isOverdue = (t: Task): boolean =>
    !t.done && t.hardLimit != null && absMin(t.hardLimitDate || t.date, t.hardLimit) < nowAbs;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = tasks.filter((t) => {
      if (typeF !== 'all' && t.type !== typeF) return false;
      if (prioF !== 'all' && t.priority !== prioF) return false;
      if (status === 'open' && t.done) return false;
      if (status === 'done' && !t.done) return false;
      if (status === 'overdue' && !isOverdue(t)) return false;
      if (needle) {
        const hay = (t.title + ' ' + t.notes + ' ' + t.links.map((l) => l.label).join(' ')).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    r = [...r].sort((a, b) => {
      if (sort === 'date') return a.date.localeCompare(b.date) || a.start - b.start;
      if (sort === 'priority') return PRIO_RANK[a.priority] - PRIO_RANK[b.priority] || a.date.localeCompare(b.date);
      if (sort === 'type') return a.type.localeCompare(b.type) || a.date.localeCompare(b.date);
      return a.title.localeCompare(b.title);
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, q, status, typeF, prioF, sort, nowAbs]);

  const asOcc = (t: Task): Occurrence => ({ ...t, kind: 'task', links: t.links || [] });

  return (
    <div className="list">
      <div className="filters">
        <div className="searchbox">
          <Icon name="search" size={15} />
          <input
            className="searchinput"
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="btn ico sm ghost" style={{ padding: 0 }} onClick={() => setQ('')}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <select className="btn sm" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">All status</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="btn sm" value={typeF} onChange={(e) => setTypeF(e.target.value as CategoryId | 'all')}>
          <option value="all">All types</option>
          {CATS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="btn sm" value={prioF} onChange={(e) => setPrioF(e.target.value as Priority | 'all')}>
          <option value="all">Any priority</option>
          {PRIOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="btn sm" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="date">Sort: date</option>
          <option value="priority">Sort: priority</option>
          <option value="type">Sort: type</option>
          <option value="title">Sort: title</option>
        </select>
        <div className="spacer" />
        <span className="dchip">
          <b>{rows.length}</b> shown
        </span>
      </div>

      <div className="listscroll">
        {rows.length === 0 && <div className="hint">No tasks match.</div>}
        {rows.map((t) => {
          const cat = catOf(t.type);
          const over = isOverdue(t);
          return (
            <div className={'lrow' + (t.done ? ' done' : '')} key={t.id}>
              <button
                className="chk"
                aria-pressed={t.done}
                onClick={() => toggleDone(asOcc(t))}
                aria-label="Toggle done"
              >
                {t.done && <Icon name="check" size={14} />}
              </button>
              <span className="cat" style={{ background: cat.color }} />
              <div
                className="mid"
                style={{ cursor: 'pointer' }}
                onClick={() => onEdit({ occ: asOcc(t) })}
              >
                <div className="t" title={t.title}>
                  {t.title}
                </div>
                <div className="s mono">
                  <span>
                    {WDL[new Date(t.date).getDay()].slice(0, 3)} {shortDate(t.date)}
                  </span>
                  <span>
                    {minToHHMM(t.start)} · {fmtDur(t.allocatedMinutes)}
                  </span>
                  {t.links.length > 0 && (
                    <span>
                      <Icon name="link" size={11} /> {t.links.length}
                    </span>
                  )}
                </div>
              </div>
              <span className="tag" style={{ background: prioOf(t.priority).color, color: '#121212' }}>
                {prioOf(t.priority).name}
              </span>
              <span className="tag">{cat.name}</span>
              {t.hardLimit != null && <span className={'tag' + (over ? ' ov' : '')}>⚑ {minToHHMM(t.hardLimit)}</span>}
              <button
                className="btn ico sm ghost"
                onClick={() => {
                  setDate(t.date);
                  setView('day');
                }}
                title="Open this day"
              >
                <Icon name="cal" size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
