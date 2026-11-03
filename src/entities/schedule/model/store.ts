import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uid } from '@/shared/lib';
import { seed } from './seed';
import type { Occurrence, OccurrenceFields, RecurringItem, ScheduleData, Settings, Task } from './types';

const KEY = 'schedule-life/v1';

const keyOf = (occ: Occurrence): string => occ.recurringId + '|' + occ.date;

interface ScheduleState {
  data: ScheduleData;
  addTask: (date: string, fields: Omit<Task, 'id' | 'date'>) => void;
  updateTask: (id: string, fields: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  /** Merge a partial change onto an occurrence (task → task; recurring → per-day override). */
  commitOcc: (occ: Occurrence, fields: OccurrenceFields) => void;
  toggleDone: (occ: Occurrence) => void;
  /** Editor save for a recurring occurrence, "this day only" (full field set). */
  saveOccurrence: (occ: Occurrence, fields: OccurrenceFields) => void;
  cancelOcc: (occ: Occurrence) => void;
  resetOcc: (occ: Occurrence) => void;
  saveSeries: (recurringId: string, date: string, fields: Partial<RecurringItem>) => void;
  addRecurring: (weekday: number) => void;
  updateRecurring: (id: string, fields: Partial<RecurringItem>) => void;
  deleteRecurring: (id: string) => void;
  updateSettings: (apply: (s: Settings) => void) => void;
  importData: (data: ScheduleData) => void;
  dismissBanner: () => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => {
      const mutate = (fn: (d: ScheduleData) => void) =>
        set((state) => {
          const d = structuredClone(state.data);
          fn(d);
          return { data: d };
        });

      return {
        data: seed(),

        addTask: (date, fields) =>
          mutate((d) => {
            d.tasks.push({ id: uid(), date, ...fields });
          }),

        updateTask: (id, fields) =>
          mutate((d) => {
            const t = d.tasks.find((x) => x.id === id);
            if (t) Object.assign(t, fields);
          }),

        deleteTask: (id) =>
          mutate((d) => {
            d.tasks = d.tasks.filter((x) => x.id !== id);
          }),

        commitOcc: (occ, fields) =>
          mutate((d) => {
            if (occ.kind === 'task') {
              const t = d.tasks.find((x) => x.id === occ.id);
              if (t) Object.assign(t, fields);
            } else {
              const key = keyOf(occ);
              const prev =
                d.overrides[key] && d.overrides[key].status === 'modified'
                  ? d.overrides[key].fields
                  : {};
              d.overrides[key] = { status: 'modified', fields: { ...prev, ...fields } };
            }
          }),

        toggleDone: (occ) =>
          mutate((d) => {
            if (occ.kind === 'task') {
              const t = d.tasks.find((x) => x.id === occ.id);
              if (t) t.done = !occ.done;
            } else {
              const key = keyOf(occ);
              const prev =
                d.overrides[key] && d.overrides[key].status === 'modified'
                  ? d.overrides[key].fields
                  : {};
              d.overrides[key] = { status: 'modified', fields: { ...prev, done: !occ.done } };
            }
          }),

        saveOccurrence: (occ, fields) =>
          mutate((d) => {
            d.overrides[keyOf(occ)] = { status: 'modified', fields: { ...fields } };
          }),

        cancelOcc: (occ) =>
          mutate((d) => {
            d.overrides[keyOf(occ)] = { status: 'cancelled' };
          }),

        resetOcc: (occ) =>
          mutate((d) => {
            delete d.overrides[keyOf(occ)];
          }),

        saveSeries: (recurringId, date, fields) =>
          mutate((d) => {
            const r = d.recurring.find((x) => x.id === recurringId);
            if (r) Object.assign(r, fields);
            delete d.overrides[recurringId + '|' + date];
          }),

        addRecurring: (weekday) =>
          mutate((d) => {
            d.recurring.push({
              id: uid(),
              title: 'New routine item',
              weekday,
              start: 540,
              allocatedMinutes: 60,
              hardLimit: null,
              hardLimitDate: null,
              priority: 'med',
              type: 'class',
              links: [],
              notes: '',
            });
          }),

        updateRecurring: (id, fields) =>
          mutate((d) => {
            const r = d.recurring.find((x) => x.id === id);
            if (r) Object.assign(r, fields);
          }),

        deleteRecurring: (id) =>
          mutate((d) => {
            d.recurring = d.recurring.filter((r) => r.id !== id);
            Object.keys(d.overrides).forEach((k) => {
              if (k.startsWith(id + '|')) delete d.overrides[k];
            });
          }),

        updateSettings: (apply) =>
          mutate((d) => {
            apply(d.settings);
          }),

        importData: (data) =>
          set(() => ({
            data: {
              tasks: data.tasks || [],
              recurring: data.recurring || [],
              overrides: data.overrides || {},
              settings: data.settings || seed().settings,
              sampleBanner: false,
            },
          })),

        dismissBanner: () =>
          mutate((d) => {
            d.sampleBanner = false;
          }),
      };
    },
    {
      name: KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ data: state.data }),
    },
  ),
);
