export interface Person {
  id: string;
  name: string;
  group: string;
  zoneNumber: string; // New: Unique Zone Number for login
}

export interface TaskRecord {
  completed: boolean;
  remarks: string;
}

export interface DailySchedule {
  date: string;
  records: Record<string, TaskRecord>; // Key is Person ID
}

export interface ScheduleEntry {
  id: string;
  date: string;
  title: string;
  records: Record<string, TaskRecord>;
  createdAt: number;
  privacyMode: 'public' | 'private'; // New: Per-entry privacy setting
}

export const TEAMS = {
  HWASEONG: '화성병점',
  OSAN: '오산중앙'
} as const;