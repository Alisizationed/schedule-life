import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { catOf, prioOf, WEEK_PX_PER_MIN, WEEK_ROW_H } from '@/shared/config';
import {
  DAY,
  absMin,
  addDays,
  clamp,
  minToHHMM,
  shortDate,
  snap,
  startOfWeekMon,
  textOn,
  todayStr,
  WD,
} from '@/shared/lib';
import { limitInfo, layoutDay, occForDate, useScheduleStore } from '@/entities/schedule';
import type { Occurrence } from '@/entities/schedule';
import type { ScopeInfo } from '@/features/routine-scope';
import type { EditorInit } from '@/features/task-editor';

interface WeekViewProps {
  date: string;
  setDate: (d: string) => void;
  setView: (v: 'day') => void;
  now: Date;
  onEdit: (init: EditorInit) => void;
  onRoutineDrag: (info: ScopeInfo) => void;
}

interface WDragState {
  id: string;
  day: string;
  start: number;
  alloc: number;
  mode: 'move' | 'resize';
}

export function WeekView({ date, setDate, setView, now, onEdit, onRoutineDrag }: WeekViewProps) {
  const data = useScheduleStore((s) => s.data);
  const commitOcc = useScheduleStore((s) => s.commitOcc);
  const updateTask = useScheduleStore((s) => s.updateTask);
  const toggleDone = useScheduleStore((s) => s.toggleDone);

  const weekStart = startOfWeekMon(date);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const perDay = useMemo(
    () => days.map((d) => ({ date: d, laid: layoutDay(occForDate(data, d)) })),
    [days, data],
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const [wdrag, setWDrag] = useState<WDragState | null>(null);

  const today = todayStr();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    const el = gridRef.current;
    if (el) el.scrollTop = clamp(480 * WEEK_PX_PER_MIN - 30, 0, DAY * WEEK_PX_PER_MIN);
  }, []);

  const beginW = (e: React.PointerEvent, occ: Occurrence, dayDate: string, mode: 'move' | 'resize') => {
    e.stopPropagation();
    const startY = e.clientY;
    const startX = e.clientX;
    const origStart = occ.start;
    const origAlloc = occ.allocatedMinutes;
    const st: WDragState = { id: occ.id, day: dayDate, start: origStart, alloc: origAlloc, mode };
    let moved = false;
    setWDrag({ ...st });
    const gridRect = gridRef.current!.getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      const dy = snap((ev.clientY - startY) / WEEK_PX_PER_MIN);
      if (Math.abs(ev.clientY - startY) > 3 || Math.abs(ev.clientX - startX) > 3) moved = true;
      if (mode === 'move') {
        st.start = clamp(origStart + dy, 0, DAY - origAlloc);
        if (occ.kind === 'task') {
          const colW = (gridRect.width - 44) / 7;
          const idx = clamp(Math.floor((ev.clientX - gridRect.left - 44) / colW), 0, 6);
          st.day = days[idx];
        }
      } else {
        st.alloc = clamp(origAlloc + dy, 15, DAY - origStart);
      }
      setWDrag({ ...st });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setWDrag(null);
      if (!moved) {
        onEdit({ occ });
        return;
      }
      if (mode === 'move') {
        if (occ.kind === 'task') updateTask(occ.id, { start: st.start, date: st.day });
        else onRoutineDrag({ occ, patch: { start: st.start } });
      } else {
        if (occ.kind === 'task') commitOcc(occ, { allocatedMinutes: st.alloc });
        else onRoutineDrag({ occ, patch: { allocatedMinutes: st.alloc } });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const renderBlock = (occ: Occurrence, dayDate: string, col: number, cols: number) => {
    const d = wdrag && wdrag.id === occ.id ? wdrag : null;
    const start = d ? d.start : occ.start;
    const alloc = d ? d.alloc : occ.allocatedMinutes;
    const cat = catOf(occ.type);
    const ink = textOn(cat.color);
    const li = limitInfo(occ);
    const over = li ? absMin(dayDate, start + alloc) > li.limAbs : false;
    return (
      <div
        key={occ.id}
        className={
          'wblock' +
          (occ.done ? ' done' : '') +
          (over ? ' warn' : '') +
          (occ.kind === 'recurring' ? ' rep' : '') +
          (alloc < 75 ? ' short' : '') +
          (d ? ' dragging' : '')
        }
        style={{
          top: start * WEEK_PX_PER_MIN,
          height: Math.max(alloc * WEEK_PX_PER_MIN, 18),
          left: `calc(${(col / cols) * 100}% + 1px)`,
          width: `calc(${100 / cols}% - 2px)`,
          background: cat.color,
          color: ink,
          zIndex: d ? 20 : 2,
        }}
        onPointerDown={(e) => beginW(e, occ, dayDate, 'move')}
        title={occ.title}
      >
        <button
          className="wdone"
          aria-pressed={occ.done}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleDone(occ);
          }}
        >
          {occ.done && <Icon name="check" size={9} />}
        </button>
        <span className="wprio" style={{ background: prioOf(occ.priority).color }} />
        <div className="wbt">{occ.title}</div>
        <div className="wbm mono">{minToHHMM(start)}</div>
        <div className="wreseg" onPointerDown={(e) => beginW(e, occ, dayDate, 'resize')} />
      </div>
    );
  };

  return (
    <div className="week">
      <div className="datebar">
        <button className="btn ico sm" onClick={() => setDate(addDays(weekStart, -7))} aria-label="Previous week">
          <Icon name="left" size={16} />
        </button>
        <button className="btn ico sm" onClick={() => setDate(addDays(weekStart, 7))} aria-label="Next week">
          <Icon name="right" size={16} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="daytitle">Week</div>
          <div className="dsub">
            {shortDate(weekStart)} – {shortDate(addDays(weekStart, 6))}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn sm" onClick={() => setDate(today)}>
          This week
        </button>
      </div>

      <div className="weekhead">
        <div />
        {days.map((d) => (
          <div
            key={d}
            className={'wd' + (d === today ? ' today' : '')}
            onClick={() => {
              setDate(d);
              setView('day');
            }}
          >
            {WD[new Date(d).getDay()]}
            <span className="num">{new Date(d).getDate()}</span>
          </div>
        ))}
      </div>

      <div className="weekgrid" ref={gridRef}>
        <div className="whours">
          {Array.from({ length: 24 }, (_, h) => (
            <div className="wrow" key={h} style={{ height: WEEK_ROW_H }}>
              <span className="wl mono">{String(h).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
        {perDay.map(({ date: dDate, laid }) => (
          <div className="wcol" key={dDate} style={{ height: DAY * WEEK_PX_PER_MIN }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div className="wrow" key={h} style={{ height: WEEK_ROW_H }} />
            ))}
            {laid
              .filter((it) => !(wdrag && wdrag.id === it.o.id))
              .map((it) => renderBlock(it.o, dDate, it.col, it.cols))}
            {wdrag && wdrag.day === dDate && (() => {
              const src = perDay.flatMap((p) => p.laid).find((it) => it.o.id === wdrag.id);
              return src ? renderBlock(src.o, dDate, 0, 1) : null;
            })()}
            {dDate === today && (
              <div className="wnow" style={{ top: nowMin * WEEK_PX_PER_MIN }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
