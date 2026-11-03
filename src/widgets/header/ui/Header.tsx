import { Icon } from '@/shared/ui/icon';
import type { ThemeInfo } from '@/features/theme';

export type View = 'day' | 'week' | 'list';

interface HeaderProps {
  view: View;
  setView: (v: View) => void;
  theme: ThemeInfo;
  onAdd: () => void;
  onRoutine: () => void;
  onSettings: () => void;
  onBackup: () => void;
}

export function Header({ view, setView, theme, onAdd, onRoutine, onSettings, onBackup }: HeaderProps) {
  return (
    <header className="bar">
      <div className="brand">
        <div className="logo">
          <Icon name="cal" size={18} />
        </div>
        <div>
          <h1>Schedule-Life</h1>
          <small>Day · Week · Tasks</small>
        </div>
      </div>

      <div className="seg" role="tablist" aria-label="View">
        {(['day', 'week', 'list'] as const).map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {v === 'list' ? 'Tasks' : v}
          </button>
        ))}
      </div>

      <div className="spacer" />

      <button className="btn ico sm" onClick={onRoutine} title="Weekly routine" aria-label="Weekly routine">
        <Icon name="repeat" size={16} />
      </button>
      <button
        className="btn ico sm"
        onClick={theme.toggle}
        title="Theme follows sunset — tap to override"
        aria-label="Toggle theme"
      >
        <Icon name={theme.effTheme === 'dark' ? 'moon' : 'sun'} size={16} />
      </button>
      <button className="btn ico sm" onClick={onBackup} title="Backup & restore" aria-label="Backup">
        <Icon name="io" size={16} />
      </button>
      <button className="btn ico sm" onClick={onSettings} title="Settings" aria-label="Settings">
        <Icon name="gear" size={16} />
      </button>
      <button className="btn primary sm" onClick={onAdd}>
        <Icon name="plus" size={16} /> Add
      </button>
    </header>
  );
}
