/** Canonical task categories and priorities (configuration, shared across the app). */
export type Priority = 'high' | 'med' | 'low';
export type CategoryId =
  | 'class'
  | 'commute'
  | 'study'
  | 'reading'
  | 'recreational'
  | 'work'
  | 'errand'
  | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
}
export interface PriorityDef {
  id: Priority;
  name: string;
  color: string;
}

export const CATS: Category[] = [
  { id: 'class', name: 'Class', color: '#FFE500' },
  { id: 'commute', name: 'Commute', color: '#B9BEC7' },
  { id: 'study', name: 'Study', color: '#2D6BFF' },
  { id: 'reading', name: 'Reading', color: '#B14DFF' },
  { id: 'recreational', name: 'Recreational', color: '#16C06A' },
  { id: 'work', name: 'Work', color: '#FF7A00' },
  { id: 'errand', name: 'Errand', color: '#00C2D1' },
  { id: 'other', name: 'Other', color: '#FF3EA5' },
];

export const PRIOS: PriorityDef[] = [
  { id: 'high', name: 'High', color: '#FF3B30' },
  { id: 'med', name: 'Med', color: '#FF9500' },
  { id: 'low', name: 'Low', color: '#2D6BFF' },
];

export const catOf = (id: string): Category =>
  CATS.find((c) => c.id === id) ?? CATS[CATS.length - 1];

export const prioOf = (id: string): PriorityDef => PRIOS.find((p) => p.id === id) ?? PRIOS[1];

export interface City {
  name: string;
  lat: number;
  lon: number;
}
export const CITIES: City[] = [
  { name: 'Chișinău', lat: 47.0105, lon: 28.8638 },
  { name: 'Bucharest', lat: 44.4268, lon: 26.1025 },
  { name: 'London', lat: 51.5072, lon: -0.1276 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
];
