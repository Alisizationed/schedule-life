import { useRef, useState } from 'react';
import { Modal } from '@/shared/ui/modal';
import { Icon } from '@/shared/ui/icon';
import { todayStr } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';
import type { ScheduleData } from '@/entities/schedule';

interface BackupProps {
  onClose: () => void;
}

export function Backup({ onClose }: BackupProps) {
  const data = useScheduleStore((s) => s.data);
  const importData = useScheduleStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const json = JSON.stringify(
    { tasks: data.tasks, recurring: data.recurring, overrides: data.overrides, settings: data.settings },
    null,
    2,
  );

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule-life-' + todayStr() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg('Backup downloaded.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setMsg('Copied to clipboard.');
    } catch {
      setErr('Clipboard blocked — use Download instead.');
    }
  };

  const applyImport = (text: string) => {
    setErr('');
    setMsg('');
    try {
      const parsed = JSON.parse(text) as ScheduleData;
      if (!parsed || !Array.isArray(parsed.tasks)) throw new Error('bad');
      importData(parsed);
      setMsg('Data imported.');
      setPaste('');
    } catch {
      setErr('That doesn’t look like a valid backup file.');
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => applyImport(String(r.result || ''));
    r.readAsText(f);
    e.target.value = '';
  };

  return (
    <Modal
      title="Backup & restore"
      onClose={onClose}
      footer={
        <button className="btn primary" onClick={onClose}>
          <Icon name="check" size={16} /> Done
        </button>
      }
    >
      <div className="hint">
        Everything is stored locally in this browser. Export a JSON backup to keep it safe or move it
        to another device, then import it here.
      </div>
      <div className="grouphdr">Export</div>
      <div className="quick">
        <button className="btn sm" onClick={download}>
          <Icon name="io" size={15} /> Download JSON
        </button>
        <button className="btn sm ghost" onClick={copy}>
          Copy to clipboard
        </button>
      </div>
      <textarea className="ta-export" readOnly value={json} onFocus={(e) => e.target.select()} />
      <div className="grouphdr">Import</div>
      <div className="quick">
        <button className="btn sm" onClick={() => fileRef.current?.click()}>
          <Icon name="io" size={15} /> Choose file…
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </div>
      <textarea
        className="ta-export"
        placeholder="…or paste backup JSON here"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
      />
      <div className="quick">
        <button className="btn sm" disabled={!paste.trim()} onClick={() => applyImport(paste)}>
          Import pasted JSON
        </button>
      </div>
      {msg && <div className="hint" style={{ color: 'var(--ok)', fontWeight: 700 }}>{msg}</div>}
      {err && <div className="err">{err}</div>}
    </Modal>
  );
}
