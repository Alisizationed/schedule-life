import { useState } from 'react';
import { todayStr, useNow } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';
import { useSunTheme } from '@/features/theme';
import { TaskEditor } from '@/features/task-editor';
import type { EditorInit } from '@/features/task-editor';
import { RoutineScope } from '@/features/routine-scope';
import type { ScopeInfo } from '@/features/routine-scope';
import { RoutineEditor } from '@/features/routine-editor';
import { Settings } from '@/features/settings';
import { Backup } from '@/features/backup';
import { Header } from '@/widgets/header';
import type { View } from '@/widgets/header';
import { DayView } from '@/widgets/day-view';
import { WeekView } from '@/widgets/week-view';
import { TaskList } from '@/widgets/task-list';
import { Icon } from '@/shared/ui/icon';

type Dialog = 'routine' | 'settings' | 'backup' | null;

export function SchedulePage() {
  const now = useNow();
  const theme = useSunTheme(now);

  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState<string>(todayStr());

  const [editor, setEditor] = useState<EditorInit | null>(null);
  const [scope, setScope] = useState<ScopeInfo | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const sampleBanner = useScheduleStore((s) => s.data.sampleBanner);
  const dismissBanner = useScheduleStore((s) => s.dismissBanner);

  const openAdd = () =>
    setEditor({ newAt: { date, start: Math.max(0, now.getHours() * 60), alloc: 60 } });

  return (
    <div className="app">
      <Header
        view={view}
        setView={setView}
        theme={theme}
        onAdd={openAdd}
        onRoutine={() => setDialog('routine')}
        onSettings={() => setDialog('settings')}
        onBackup={() => setDialog('backup')}
      />

      {sampleBanner && (
        <div className="banner">
          <Icon name="cal" size={16} />
          Sample data loaded — classes, commute and a few tasks. Edit or clear them, it’s all yours.
          <button className="x" onClick={dismissBanner} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {view === 'day' && (
        <DayView
          date={date}
          setDate={setDate}
          now={now}
          theme={theme}
          onEdit={setEditor}
          onRoutineDrag={setScope}
        />
      )}
      {view === 'week' && (
        <WeekView
          date={date}
          setDate={setDate}
          setView={setView}
          now={now}
          onEdit={setEditor}
          onRoutineDrag={setScope}
        />
      )}
      {view === 'list' && (
        <TaskList now={now} onEdit={setEditor} setDate={setDate} setView={setView} />
      )}

      {editor && <TaskEditor init={editor} onClose={() => setEditor(null)} />}
      {scope && <RoutineScope info={scope} onClose={() => setScope(null)} />}
      {dialog === 'routine' && (
        <RoutineEditor onClose={() => setDialog(null)} onEditItem={(occ) => setEditor({ occ })} />
      )}
      {dialog === 'settings' && <Settings onClose={() => setDialog(null)} />}
      {dialog === 'backup' && <Backup onClose={() => setDialog(null)} />}
    </div>
  );
}
