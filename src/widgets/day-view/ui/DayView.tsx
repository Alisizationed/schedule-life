import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { catOf, prioOf, DAY_PX_PER_MIN } from '@/shared/config';
import {
  DAY,
  absMin,
  addDays,
  clamp,
  fmtDur,
  fmtDurLong,
  minToHHMM,
  shortDate,
  snap,
  textOn,
  todayStr,
  WDL,
} from '@/shared/lib';
import { limitInfo, layoutDay, occForDate, useScheduleStore } from '@/entities/schedule';
import type { Occurrence } from '@/entities/schedule';
import type { ThemeInfo } from '@/features/theme';
import type { ScopeInfo } from '@/features/routine-scope';
import type { EditorInit } from '@/features/task-editor';

interface DayViewProps {
  date: string;
  setDate: (d: string) => void;
  now: Date;
  theme: ThemeInfo;
  onEdit: (init: EditorInit) => void;
  onRoutineDrag: (info: ScopeInfo) => void;
}

interface DragState {
  id: string;
  start: number;
  alloc: number;
  mode: 'move' | 'resize';
}

export function DayView({ date, setDate, now, theme, onEdit, onRoutineDrag }: DayViewProps) {
  const data = useScheduleStore((s) => s.data);
  const commitOcc = useScheduleStore((s) => s.commitOcc);
  const toggleDone = useScheduleStore((s) => s.toggleDone);

  const occs = useMemo(() => occForDate(data, date), [data, date]);
  const laid = useMemo(() => layoutDay(occs), [occs]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghost, setGhost] = useState<{ start: number; alloc: number } | null>(null);

  const isToday = date === todayStr();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = isToday ? nowMin : 480;
    el.scrollTop = clamp((target - 30) * DAY_PX_PER_MIN, 0, DAY * DAY_PX_PER_MIN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const begin = (e: React.PointerEvent, occ: Occurrence, mode: 'move' | 'resize') => {
    e.stopPropagation();
    const startY = e.clientY;
    const origStart = occ.start;
    const origAlloc = occ.allocatedMinutes;
    const st: DragState = { id: occ.id, start: origStart, alloc: origAlloc, mode };
    let moved = false;
    setDrag({ ...st });

    const move = (ev: PointerEvent) => {
      const d = snap((ev.clientY - startY) / DAY_PX_PER_MIN);
      if (Math.abs(ev.clientY - startY) > 3) moved = true;
      if (mode === 'move') st.start = clamp(origStart + d, 0, DAY - origAlloc);
      else st.alloc = clamp(origAlloc + d, 15, DAY - origStart);
      setDrag({ ...st });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDrag(null);
      if (!moved) {
        onEdit({ occ });
        return;
      }
      const patch = mode === 'move' ? { start: st.start } : { allocatedMinutes: st.alloc };
      if (occ.kind === 'recurring') onRoutineDrag({ occ, patch });
      else commitOcc(occ, patch);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const bgDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const rect = laneRef.current!.getBoundingClientRect();
    const s0 = clamp(snap((e.clientY - rect.top) / DAY_PX_PER_MIN), 0, DAY - 15);
    let moved = false;
    let alloc = 60;
    setGhost({ start: s0, alloc });
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientY - e.clientY) > 3) moved = true;
      alloc = clamp(snap((ev.clientY - rect.top) / DAY_PX_PER_MIN) - s0, 15, DAY - s0);
      setGhost({ start: s0, alloc });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setGhost(null);
      onEdit({ newAt: { date, start: s0, alloc: moved ? alloc : 60 } });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // up-next / stats
  const sorted = [...occs].sort((a, b) => a.start - b.start);
  const current = sorted.find((o) => nowMin >= o.start && nowMin < o.start + o.allocatedMinutes);
  const next = sorted.find((o) => o.start > nowMin);
  const totalAlloc = occs.reduce((s, o) => s + o.allocatedMinutes, 0);
  const doneAlloc = occs.filter((o) => o.done).reduce((s, o) => s + o.allocatedMinutes, 0);
  const doneCount = occs.filter((o) => o.done).length;
  const progress = totalAlloc ? Math.round((doneAlloc / totalAlloc) * 100) : 0;

  const sunLabel = theme.sun
    ? (theme.isDay ? '↓ ' : '↑ ') +
      minToHHMM(
        theme.isDay
          ? theme.sun.sunset.getHours() * 60 + theme.sun.sunset.getMinutes()
          : theme.sun.sunrise.getHours() * 60 + theme.sun.sunrise.getMinutes(),
      )
    : '';

  const wd = new Date(date).getDay();

  return (
    <div className="main dayview">
      <div className="datebar">
        <button className="btn ico sm" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <Icon name="left" size={16} />
        </button>
        <button className="btn ico sm" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
          <Icon name="right" size={16} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="daytitle">{WDL[wd]}</div>
          <div className="dsub">{shortDate(date)}</div>
        </div>
        {isToday ? (
          <span className="today-pill">Today</span>
        ) : (
          <button className="btn sm" onClick={() => setDate(todayStr())}>
            Today
          </button>
        )}
        {sunLabel && (
          <span className="sun">
            <Icon name={theme.isDay ? 'sun' : 'moon'} size={14} /> {sunLabel}
          </span>
        )}
        <div className="spacer" />
        <div className="daystats">
          <span className="dchip">
            <b>{fmtDur(totalAlloc)}</b> alloc
          </span>
          <span className="dchip">
            <b>{doneCount}</b>/{occs.length} done
          </span>
          <span className="dchip">
            <span className="miniP">
              <i style={{ width: progress + '%' }} />
            </span>
            {progress}%
          </span>
        </div>
      </div>

      {isToday && (current || next) && (
        <div className="upnext">
          {current && (
            <div className="un-card live">
              <span className="un-dot" style={{ background: catOf(current.type).color }} />
              <div style={{ minWidth: 0 }}>
                <div className="k">Now</div>
                <div className="t" title={current.title}>
                  {current.title}
                </div>
                <div className="time">
                  until {minToHHMM(current.start + current.allocatedMinutes)}
                </div>
              </div>
            </div>
          )}
          {next && (
            <div className="un-card">
              <span className="un-dot" style={{ background: catOf(next.type).color }} />
              <div style={{ minWidth: 0 }}>
                <div className="k">Up next</div>
                <div className="t" title={next.title}>
                  {next.title}
                </div>
                <div className="time">
                  {minToHHMM(next.start)} · in {fmtDurLong(next.start - nowMin)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="scroll" ref={scrollRef}>
        <div className="tl" style={{ height: DAY * DAY_PX_PER_MIN }}>
          <div className="hours">
            {Array.from({ length: 24 }, (_, h) => (
              <div className="hourrow" key={h} style={{ height: 60 * DAY_PX_PER_MIN }}>
                <span className="hl mono">{String(h).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
          <div className="lane" ref={laneRef} onPointerDown={bgDown}>
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="halfline"
                style={{ top: (h * 60 + 30) * DAY_PX_PER_MIN }}
              />
            ))}

            {ghost && (
              <div
                className="createghost"
                style={{ top: ghost.start * DAY_PX_PER_MIN, height: ghost.alloc * DAY_PX_PER_MIN }}
              />
            )}

            {laid.map((it) => {
              const o = it.o;
              const d = drag && drag.id === o.id ? drag : null;
              const start = d ? d.start : o.start;
              const alloc = d ? d.alloc : o.allocatedMinutes;
              const cat = catOf(o.type);
              const ink = textOn(cat.color);
              const li = limitInfo(o);
              const over = li ? absMin(date, start + alloc) > li.limAbs : false;
              return (
                <div
                  key={o.id}
                  className={
                    'block' +
                    (o.done ? ' done' : '') +
                    (over ? ' warn' : '') +
                    (o.kind === 'recurring' ? ' rep' : '') +
                    (alloc < 30 ? ' tiny' : alloc < 50 ? ' short' : '')
                  }
                  style={{
                    top: start * DAY_PX_PER_MIN,
                    height: Math.max(alloc * DAY_PX_PER_MIN, 26),
                    left: `calc(${(it.col / it.cols) * 100}% + 3px)`,
                    width: `calc(${100 / it.cols}% - 6px)`,
                    background: cat.color,
                    color: ink,
                    zIndex: d ? 20 : 2,
                  }}
                  onPointerDown={(e) => begin(e, o, 'move')}
                  title={o.title}
                >
                  <button
                    className="bdone"
                    aria-pressed={o.done}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDone(o);
                    }}
                  >
                    {o.done && <Icon name="check" size={11} />}
                  </button>
                  <span className="prio" style={{ background: prioOf(o.priority).color }} />
                  <div className="bt">{o.title}</div>
                  <div className="bm">
                    <span className="mono">
                      {minToHHMM(start)}–{minToHHMM(start + alloc)}
                    </span>
                    {o.links.length > 0 && <Icon name="link" size={11} />}
                    {li && (
                      <span className={'lim' + (over ? ' over' : '')}>
                        <Icon name="flag" size={10} />
                        {minToHHMM(li.lim)}
                        {!li.sameDay && '+'}
                      </span>
                    )}
                  </div>
                  {o.modified && <span className="modbadge">edited</span>}
                  <div className="reseg" onPointerDown={(e) => begin(e, o, 'resize')} />
                </div>
              );
            })}

            {isToday && (
              <div className="nowline" style={{ top: nowMin * DAY_PX_PER_MIN }}>
                <span className="nowdot" />
                <span className="nb mono">{minToHHMM(nowMin)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
