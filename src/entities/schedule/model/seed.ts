import { todayStr, uid } from '@/shared/lib';
import type { RecurringItem, ScheduleData } from './types';

/** Initial data on first run: realistic sample tasks + a starter weekly routine. */
export function seed(): ScheduleData {
  const t = todayStr();
  const tasks: ScheduleData['tasks'] = [
    {
      id: uid(),
      title: 'Finish OOP lab 3 — class diagram + report',
      date: t,
      start: 600,
      allocatedMinutes: 90,
      hardLimit: 810,
      hardLimitDate: null,
      priority: 'high',
      type: 'study',
      links: [
        { label: 'Lab 3 brief (Moodle)', url: 'https://else.fcim.utm.md' },
        { label: 'UML cheat-sheet', url: 'https://plantuml.com' },
      ],
      notes: 'Submit before the 13:30 cutoff. Export diagram as PNG for the report.',
      done: false,
    },
    {
      id: uid(),
      title: 'Read 2 chapters — "Clean Architecture" (Uncle Bob)',
      date: t,
      start: 915,
      allocatedMinutes: 45,
      hardLimit: 1320,
      hardLimitDate: null,
      priority: 'med',
      type: 'reading',
      links: [{ label: 'Ch. 4–5 PDF', url: 'https://example.com/clean-arch' }],
      notes: 'For Software Engineering seminar on Friday.',
      done: false,
    },
    {
      id: uid(),
      title: 'PBL team sync — scheduling app sprint',
      date: t,
      start: 990,
      allocatedMinutes: 30,
      hardLimit: null,
      hardLimitDate: null,
      priority: 'med',
      type: 'work',
      links: [{ label: 'Jira board', url: 'https://www.atlassian.com/software/jira' }],
      notes: 'Divide tasks for the demo. Bring the figma link.',
      done: false,
    },
    {
      id: uid(),
      title: '5-a-side football with the group',
      date: t,
      start: 1140,
      allocatedMinutes: 90,
      hardLimit: null,
      hardLimitDate: null,
      priority: 'low',
      type: 'recreational',
      links: [],
      notes: 'Block 4 sports hall.',
      done: false,
    },
  ];

  const recurring: RecurringItem[] = [];
  const base = { links: [] as RecurringItem['links'], notes: '', hardLimitDate: null };
  const day = (weekday: number, items: Omit<RecurringItem, 'id' | 'weekday' | 'links' | 'notes'>[]) =>
    items.forEach((it) => recurring.push({ id: uid(), weekday, ...base, ...it }));

  const toUni = {
    title: 'Bus 102 → UTM campus',
    start: 450,
    allocatedMinutes: 45,
    hardLimit: 510,
    priority: 'med' as const,
    type: 'commute' as const,
  };
  const toHome = {
    title: 'Trolleybus → home',
    start: 750,
    allocatedMinutes: 45,
    hardLimit: null,
    priority: 'low' as const,
    type: 'commute' as const,
  };

  day(1, [
    toUni,
    { title: 'Data Structures & Algorithms — lecture', start: 510, allocatedMinutes: 90, hardLimit: null, priority: 'med', type: 'class' },
    { title: 'DSA — lab (C++)', start: 630, allocatedMinutes: 90, hardLimit: null, priority: 'med', type: 'class' },
    toHome,
  ]);
  day(3, [
    toUni,
    { title: 'Databases — lecture (SQL & normalization)', start: 510, allocatedMinutes: 90, hardLimit: null, priority: 'med', type: 'class' },
    { title: 'Databases — seminar', start: 630, allocatedMinutes: 90, hardLimit: null, priority: 'med', type: 'class' },
    toHome,
  ]);
  day(5, [
    toUni,
    { title: 'Computer Networks — lecture', start: 510, allocatedMinutes: 90, hardLimit: null, priority: 'med', type: 'class' },
    { title: 'English for IT', start: 630, allocatedMinutes: 90, hardLimit: null, priority: 'low', type: 'class' },
    toHome,
  ]);

  return {
    tasks,
    recurring,
    overrides: {},
    settings: {
      location: { name: 'Chișinău', lat: 47.0105, lon: 28.8638 },
      themeOverride: 'auto',
      term: { start: null, end: null },
    },
    sampleBanner: true,
  };
}
