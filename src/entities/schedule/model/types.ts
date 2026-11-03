import type { Priority, CategoryId } from '@/shared/config';

export interface TaskLink {
  label: string;
  url: string;
}

/** A one-off task pinned to a specific date. */
export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: number; // minutes from midnight
  allocatedMinutes: number; // planned duration
  hardLimit: number | null; // deadline time (minutes)
  hardLimitDate: string | null; // deadline date (null = same day as task)
  priority: Priority;
  type: CategoryId;
  links: TaskLink[];
  notes: string;
  done: boolean;
}

/** A template entry in the weekly routine (classes, commute, ...). */
export interface RecurringItem {
  id: string;
  title: string;
  weekday: number; // 0=Sun..6=Sat
  start: number;
  allocatedMinutes: number;
  hardLimit: number | null;
  hardLimitDate?: string | null;
  priority: Priority;
  type: CategoryId;
  links: TaskLink[];
  notes: string;
}

/** Fields that an override or editor save may write onto an occurrence. */
export type OccurrenceFields = Partial<
  Pick<
    Task,
    | 'title'
    | 'start'
    | 'allocatedMinutes'
    | 'hardLimit'
    | 'hardLimitDate'
    | 'priority'
    | 'type'
    | 'links'
    | 'notes'
    | 'done'
  >
>;

/** A per-date exception to a recurring item. */
export interface Override {
  status: 'modified' | 'cancelled';
  fields?: OccurrenceFields;
}

export interface Settings {
  location: { name: string; lat: number; lon: number };
  themeOverride: 'auto' | 'light' | 'dark';
  term: { start: string | null; end: string | null };
}

export interface ScheduleData {
  tasks: Task[];
  recurring: RecurringItem[];
  overrides: Record<string, Override>;
  settings: Settings;
  sampleBanner?: boolean;
}

/** A concrete occurrence on a given day — either a one-off task or a resolved recurring item. */
export interface Occurrence {
  id: string;
  kind: 'task' | 'recurring';
  recurringId?: string;
  date: string;
  title: string;
  start: number;
  allocatedMinutes: number;
  hardLimit: number | null;
  hardLimitDate: string | null;
  priority: Priority;
  type: CategoryId;
  links: TaskLink[];
  notes: string;
  done: boolean;
  modified?: boolean;
}
