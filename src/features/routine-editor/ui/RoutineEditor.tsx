import { useMemo } from 'react';
import { Modal } from '@/shared/ui/modal';
import { Icon } from '@/shared/ui/icon';
import { catOf } from '@/shared/config';
import { addDays, fmtDur, minToHHMM, todayStr, WDL, weekdayOf } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';
import type { Occurrence, RecurringItem } from '@/entities/schedule';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

function nextDateForWeekday(wd: number): string {
  let s = todayStr();
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(s) === wd) return s;
    s = addDays(s, 1);
  }
  return todayStr();
}

function toOccurrence(r: RecurringItem): Occurrence {
  return {
    id: r.id,
    recurringId: r.id,
    date: nextDateForWeekday(r.weekday),
    kind: 'recurring',
    title: r.title,
    start: r.start,
    allocatedMinutes: r.allocatedMinutes,
    hardLimit: r.hardLimit,
    hardLimitDate: r.hardLimitDate ?? null,
    priority: r.priority,
    type: r.type,
    links: r.links || [],
    notes: r.notes || '',
    done: false,
    modified: false,
  };
}

interface RoutineEditorProps {
  onClose: () => void;
  onEditItem: (occ: Occurrence) => void;
}

export function RoutineEditor({ onClose, onEditItem }: RoutineEditorProps) {
  const recurring = useScheduleStore((s) => s.data.recurring);
  const term = useScheduleStore((s) => s.data.settings.term) ?? { start: null, end: null };
  const addRecurring = useScheduleStore((s) => s.addRecurring);
  const deleteRecurring = useScheduleStore((s) => s.deleteRecurring);
  const updateSettings = useScheduleStore((s) => s.updateSettings);

  const byDay = useMemo(() => {
    const m: Record<number, RecurringItem[]> = {};
    for (let i = 0; i < 7; i++) m[i] = [];
    recurring.forEach((r) => m[r.weekday].push(r));
    Object.values(m).forEach((a) => a.sort((x, y) => x.start - y.start));
    return m;
  }, [recurring]);

  return (
    <Modal
      title="Weekly routine"
      onClose={onClose}
      maxWidth={520}
      footer={
        <button className="btn primary" onClick={onClose}>
          <Icon name="check" size={16} /> Done
        </button>
      }
    >
      <div className="hint">
        Your fixed week — classes, labs, travel to/from uni. These auto-fill every week. On any given
        day you can move, edit or cancel one occurrence without changing this template (open a day
        and tap the block).
      </div>
      <div className="reproom">
        <b>Runs from … until</b> — set a term/semester range so the routine only fills in dates
        inside it. Leave empty to repeat forever.
        <div className="row2" style={{ marginTop: 8 }}>
          <label className="field" style={{ textTransform: 'none', color: 'var(--fg)' }}>
            Start
            <input
              className="input"
              type="date"
              value={term.start || ''}
              onChange={(e) => updateSettings((s) => (s.term = { ...s.term, start: e.target.value || null }))}
            />
          </label>
          <label className="field" style={{ textTransform: 'none', color: 'var(--fg)' }}>
            End
            <input
              className="input"
              type="date"
              value={term.end || ''}
              onChange={(e) => updateSettings((s) => (s.term = { ...s.term, end: e.target.value || null }))}
            />
          </label>
        </div>
      </div>

      {ORDER.map((wd) => (
        <div key={wd}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="grouphdr" style={{ paddingTop: 0 }}>
              {WDL[wd]}
            </div>
            <button className="btn sm ghost" onClick={() => addRecurring(wd)}>
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
          {byDay[wd].length === 0 && (
            <div className="hint" style={{ marginBottom: 6 }}>
              — nothing routine —
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {byDay[wd].map((r) => {
              const cat = catOf(r.type);
              return (
                <div
                  className="lrow"
                  key={r.id}
                  style={{ boxShadow: '2px 2px 0 0 var(--shadow)', padding: '6px 9px' }}
                >
                  <span className="cat" style={{ background: cat.color, height: 26 }} />
                  <div className="mid" style={{ cursor: 'pointer' }} onClick={() => onEditItem(toOccurrence(r))}>
                    <div className="t" title={r.title}>
                      {r.title}
                    </div>
                    <div className="s mono">
                      <span>
                        {minToHHMM(r.start)}–{minToHHMM(r.start + r.allocatedMinutes)}
                      </span>
                      <span>{fmtDur(r.allocatedMinutes)}</span>
                      {r.hardLimit != null && <span>⚑ {minToHHMM(r.hardLimit)}</span>}
                    </div>
                  </div>
                  <button
                    className="btn ico sm ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => deleteRecurring(r.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Modal>
  );
}
