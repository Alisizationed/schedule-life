import { Modal } from '@/shared/ui/modal';
import { Icon } from '@/shared/ui/icon';
import { CITIES } from '@/shared/config';
import { minToHHMM, sunTimes } from '@/shared/lib';
import { useScheduleStore } from '@/entities/schedule';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const loc = useScheduleStore((s) => s.data.settings.location);
  const themeOverride = useScheduleStore((s) => s.data.settings.themeOverride);
  const updateSettings = useScheduleStore((s) => s.updateSettings);

  const preset = CITIES.find((c) => c.name === loc.name) ? loc.name : '__custom';
  const sun = sunTimes(new Date(), loc.lat, loc.lon);

  return (
    <Modal
      title="Settings"
      onClose={onClose}
      footer={
        <button className="btn primary" onClick={onClose}>
          <Icon name="check" size={16} /> Done
        </button>
      }
    >
      <div className="hint">
        The theme follows your local <b>sunrise → sunset</b>: white by day, black after dusk. Device
        GPS isn’t available here, so set your location — it’s used only to compute the sun times
        on-device.
      </div>
      <label className="field">
        City
        <select
          className="input"
          value={preset}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__custom') return;
            const c = CITIES.find((x) => x.name === v)!;
            updateSettings((s) => (s.location = { name: c.name, lat: c.lat, lon: c.lon }));
          }}
        >
          {CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
          <option value="__custom">Custom…</option>
        </select>
      </label>
      <div className="row2">
        <label className="field">
          Latitude
          <input
            className="input mono"
            type="number"
            step="0.0001"
            value={loc.lat}
            onChange={(e) =>
              updateSettings((s) => (s.location = { name: 'Custom', lat: +e.target.value, lon: s.location.lon }))
            }
          />
        </label>
        <label className="field">
          Longitude
          <input
            className="input mono"
            type="number"
            step="0.0001"
            value={loc.lon}
            onChange={(e) =>
              updateSettings((s) => (s.location = { name: 'Custom', lat: s.location.lat, lon: +e.target.value }))
            }
          />
        </label>
      </div>
      <div className="hint mono">
        {sun
          ? 'Today: ↑ ' +
            minToHHMM(sun.sunrise.getHours() * 60 + sun.sunrise.getMinutes()) +
            '   ↓ ' +
            minToHHMM(sun.sunset.getHours() * 60 + sun.sunset.getMinutes())
          : 'Sun always up/down at this latitude today — using 07:00–19:00.'}
      </div>
      <label className="field">
        Theme
        <div className="pickrow">
          {(
            [
              ['auto', 'Auto (sunset)'],
              ['light', 'Always light'],
              ['dark', 'Always dark'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              className="pick"
              aria-pressed={themeOverride === v}
              onClick={() => updateSettings((s) => (s.themeOverride = v))}
            >
              {l}
            </button>
          ))}
        </div>
      </label>
    </Modal>
  );
}
