import { useState } from 'react';
import { Modal } from '@/shared/ui/modal';
import { Icon } from '@/shared/ui/icon';
import { CATS, PRIOS } from '@/shared/config';
import type { CategoryId, Priority } from '@/shared/config';
import {
  DAY,
  absMin,
  clamp,
  fmtDur,
  fmtDurLong,
  hhmmToMin,
  minToHHMM,
  WDL,
  weekdayOf,
} from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';
import type { Occurrence, OccurrenceFields, TaskLink } from '@/entities/schedule';

export interface EditorInit {
  occ?: Occurrence;
  newAt?: { date: string; start: number; alloc?: number };
}

interface TaskEditorProps {
  init: EditorInit;
  onClose: () => void;
}

export function TaskEditor({ init, onClose }: TaskEditorProps) {
  const addTask = useScheduleStore((s) => s.addTask);
  const updateTask = useScheduleStore((s) => s.updateTask);
  const deleteTask = useScheduleStore((s) => s.deleteTask);
  const saveOccurrence = useScheduleStore((s) => s.saveOccurrence);
  const saveSeries = useScheduleStore((s) => s.saveSeries);
  const cancelOcc = useScheduleStore((s) => s.cancelOcc);
  const resetOcc = useScheduleStore((s) => s.resetOcc);

  const occ = init.occ;
  const isNew = !!init.newAt;
  const isRecurring = !!occ && occ.kind === 'recurring';
  const date = occ ? occ.date : init.newAt!.date;

  const [title, setTitle] = useState(occ ? occ.title : '');
  const [start, setStart] = useState(occ ? occ.start : init.newAt!.start);
  const [alloc, setAlloc] = useState(occ ? occ.allocatedMinutes : init.newAt!.alloc || 60);
  const [hasLimit, setHasLimit] = useState(occ ? occ.hardLimit != null : false);
  const [limit, setLimit] = useState(
    occ && occ.hardLimit != null
      ? occ.hardLimit
      : occ
        ? occ.start + occ.allocatedMinutes
        : init.newAt!.start + (init.newAt!.alloc || 60),
  );
  const [limDate, setLimDate] = useState(
    occ && occ.hardLimitDate ? occ.hardLimitDate : occ ? occ.date : init.newAt!.date,
  );
  const [type, setType] = useState<CategoryId>(occ ? occ.type : 'study');
  const [priority, setPriority] = useState<Priority>(occ ? occ.priority : 'med');
  const [notes, setNotes] = useState(occ ? occ.notes || '' : '');
  const [links, setLinks] = useState<TaskLink[]>(occ ? occ.links || [] : []);
  const [lLabel, setLLabel] = useState('');
  const [lUrl, setLUrl] = useState('');
  const [err, setErr] = useState('');

  const end = start + alloc;
  const limDateEff = isRecurring ? date : limDate;

  const fields = (): Omit<import('@/entities/schedule').Task, 'id' | 'date'> => ({
    title: title.trim(),
    start,
    allocatedMinutes: alloc,
    hardLimit: hasLimit ? limit : null,
    hardLimitDate: hasLimit ? (isRecurring ? null : limDate) : null,
    priority,
    type,
    links,
    notes: notes.trim(),
    done: occ ? occ.done : false,
  });

  const validate = (): boolean => {
    if (!title.trim()) {
      setErr('Give the task a title.');
      return false;
    }
    if (hasLimit && absMin(limDateEff, limit) <= absMin(date, start) + 4) {
      setErr('The hard limit must be after the start time.');
      return false;
    }
    return true;
  };

  const doSave = () => {
    if (!validate()) return;
    if (isNew) addTask(date, fields());
    else if (occ!.kind === 'task') updateTask(occ!.id, fields());
    else saveOccurrence(occ!, fields() as OccurrenceFields);
    onClose();
  };

  const doSaveSeries = () => {
    if (!validate()) return;
    saveSeries(occ!.recurringId!, date, {
      title: title.trim(),
      start,
      allocatedMinutes: alloc,
      hardLimit: hasLimit ? limit : null,
      priority,
      type,
      links,
      notes: notes.trim(),
    });
    onClose();
  };

  const addLink = () => {
    let u = lUrl.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    setLinks([...links, { label: lLabel.trim() || u.replace(/^https?:\/\//, ''), url: u }]);
    setLLabel('');
    setLUrl('');
  };

  const buf = absMin(limDateEff, limit) - absMin(date, end);

  const footer = (
    <>
      <button className="btn primary" onClick={doSave}>
        <Icon name="check" size={16} /> {isNew ? 'Add' : isRecurring ? 'Save this day' : 'Save'}
      </button>
      {isRecurring && (
        <button
          className="btn ico sm"
          onClick={doSaveSeries}
          title="Apply to the whole weekly routine (every week)"
        >
          <Icon name="repeat" size={16} />
        </button>
      )}
      {isRecurring && occ!.modified && (
        <button
          className="btn sm ghost"
          onClick={() => {
            resetOcc(occ!);
            onClose();
          }}
        >
          Reset
        </button>
      )}
      <div className="spacer" />
      {!isNew && (
        <button
          className="btn sm"
          style={{ color: 'var(--danger)' }}
          onClick={() => {
            if (isRecurring) cancelOcc(occ!);
            else deleteTask(occ!.id);
            onClose();
          }}
        >
          <Icon name="trash" size={15} /> {isRecurring ? 'Cancel day' : 'Delete'}
        </button>
      )}
    </>
  );

  return (
    <Modal
      title={isNew ? 'New task' : isRecurring ? 'Routine occurrence' : 'Edit task'}
      onClose={onClose}
      footer={footer}
    >
      {isRecurring && (
        <div className="reproom">
          <b>From your weekly routine</b> · {WDL[weekdayOf(date)]}s. Changes here apply to{' '}
          <b>this day only</b> unless you choose the routine icon.
        </div>
      )}
      <label className="field">
        Title
        <input
          className="input"
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Databases lecture"
        />
      </label>
      <div className="row2">
        <label className="field">
          Start
          <input
            className="input mono"
            type="time"
            value={minToHHMM(start)}
            onChange={(e) => {
              const v = hhmmToMin(e.target.value);
              setStart(v);
              if (hasLimit && limit < v + 5) setLimit(v + alloc);
            }}
          />
        </label>
        <label className="field">
          Allocated
          <div className="unitrow">
            <input
              className="input mono"
              type="number"
              min="5"
              step="5"
              value={alloc}
              onChange={(e) => setAlloc(clamp(+e.target.value || 5, 5, DAY))}
            />
            <span className="unit">min</span>
          </div>
        </label>
      </div>
      <div className="quick">
        {[15, 30, 45, 60, 90, 120].map((m) => (
          <button
            key={m}
            onClick={() => setAlloc(m)}
            aria-pressed={alloc === m}
            style={alloc === m ? { background: 'var(--fg)', color: 'var(--bg)' } : undefined}
          >
            {fmtDur(m)}
          </button>
        ))}
        <span className="hint" style={{ marginLeft: 'auto' }}>
          Ends {minToHHMM(end)}
        </span>
      </div>
      <label
        className="field"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, textTransform: 'none' }}
      >
        <input
          type="checkbox"
          checked={hasLimit}
          onChange={(e) => setHasLimit(e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        <span style={{ fontWeight: 700 }}>Hard limit (deadline)</span>
      </label>
      {hasLimit && (
        <div className="row2">
          <label className="field">
            Must finish by
            {isRecurring ? (
              <input
                className="input mono"
                type="time"
                value={minToHHMM(limit)}
                onChange={(e) => setLimit(hhmmToMin(e.target.value))}
              />
            ) : (
              <input
                className="input mono"
                type="datetime-local"
                value={limDate + 'T' + minToHHMM(limit)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) {
                    const [d, t] = v.split('T');
                    setLimDate(d);
                    setLimit(hhmmToMin(t));
                  }
                }}
              />
            )}
          </label>
          <div
            className="field"
            title="Gap between when your allocated time ends and the hard deadline"
          >
            Buffer to deadline
            <div
              className="input mono"
              style={{ display: 'flex', alignItems: 'center', borderStyle: 'dashed' }}
            >
              {buf >= 0 ? fmtDurLong(buf) + ' free' : '⚠ ' + fmtDurLong(-buf) + ' over'}
            </div>
          </div>
        </div>
      )}
      <label className="field">
        Type
        <div className="pickrow">
          {CATS.map((c) => (
            <button key={c.id} className="pick" aria-pressed={type === c.id} onClick={() => setType(c.id)}>
              <span className="sw" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>
      </label>
      <label className="field">
        Priority
        <div className="pickrow">
          {PRIOS.map((p) => (
            <button
              key={p.id}
              className="pick"
              aria-pressed={priority === p.id}
              onClick={() => setPriority(p.id)}
            >
              <span className="sw" style={{ background: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      </label>
      <label className="field">
        Links
        <div className="linklist">
          {links.map((l, i) => (
            <div className="linkitem" key={i}>
              <Icon name="link" size={14} />
              <a href={l.url} target="_blank" rel="noopener" style={{ flex: 1, minWidth: 0 }}>
                {l.label}
              </a>
              <button
                className="btn ico sm ghost"
                onClick={() => setLinks(links.filter((_, j) => j !== i))}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="linkrow" style={{ marginTop: 6 }}>
          <input
            className="input"
            placeholder="Label"
            value={lLabel}
            onChange={(e) => setLLabel(e.target.value)}
            style={{ flex: '0 0 34%' }}
          />
          <input
            className="input"
            placeholder="https://…"
            value={lUrl}
            onChange={(e) => setLUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <button className="btn sm" onClick={addLink}>
            <Icon name="plus" size={14} />
          </button>
        </div>
      </label>
      <label className="field">
        Notes
        <textarea
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember…"
        />
      </label>
      {err && <div className="err">{err}</div>}
    </Modal>
  );
}
