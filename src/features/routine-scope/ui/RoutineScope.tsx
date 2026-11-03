import { Modal } from '@/shared/ui/modal';
import { Icon } from '@/shared/ui/icon';
import { fmtDur, minToHHMM, WDL, weekdayOf } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';
import type { Occurrence } from '@/entities/schedule';

export interface DragPatch {
  start?: number;
  allocatedMinutes?: number;
  hardLimit?: number | null;
}
export interface ScopeInfo {
  occ: Occurrence;
  patch: DragPatch;
}

interface RoutineScopeProps {
  info: ScopeInfo;
  onClose: () => void;
}

/** Asked after dragging a routine occurrence: change this day only, or the whole routine. */
export function RoutineScope({ info, onClose }: RoutineScopeProps) {
  const commitOcc = useScheduleStore((s) => s.commitOcc);
  const updateRecurring = useScheduleStore((s) => s.updateRecurring);
  const resetOcc = useScheduleStore((s) => s.resetOcc);

  const { occ, patch } = info;
  const rows: [string, string][] = [];
  if (patch.start != null) rows.push(['New start', minToHHMM(patch.start)]);
  if (patch.allocatedMinutes != null) rows.push(['New duration', fmtDur(patch.allocatedMinutes)]);
  if (patch.hardLimit != null) rows.push(['New hard limit', minToHHMM(patch.hardLimit)]);

  const thisDay = () => {
    commitOcc(occ, patch);
    onClose();
  };
  const whole = () => {
    updateRecurring(occ.recurringId!, patch);
    resetOcc(occ);
    onClose();
  };

  const footer = (
    <>
      <button className="btn primary" onClick={thisDay}>
        <Icon name="cal" size={15} /> This day only
      </button>
      <button className="btn" onClick={whole}>
        <Icon name="repeat" size={15} /> Whole routine
      </button>
      <div className="spacer" />
      <button className="btn sm ghost" onClick={onClose}>
        Cancel
      </button>
    </>
  );

  return (
    <Modal title="Change routine item" onClose={onClose} footer={footer} maxWidth={400}>
      <div className="hint">
        <b>“{occ.title}”</b> comes from your weekly routine ({WDL[weekdayOf(occ.date)]}s). Do you
        want to change the whole routine, or just this day?
      </div>
      <div className="reproom" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>{k}</span>
            <b className="mono">{v}</b>
          </div>
        ))}
      </div>
    </Modal>
  );
}
