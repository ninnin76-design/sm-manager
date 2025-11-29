import { TaskRecord, ScheduleEntry, Person } from '../types';
import { TEAM_MEMBERS as DEFAULT_TEAM_MEMBERS } from '../constants';

const LEGACY_KEY_PREFIX = 'schedule_manager_data_';
const ENTRY_KEY_PREFIX = 'schedule_manager_entry_';
const MEMBERS_KEY = 'schedule_manager_members';

// --- Member Management ---

export const getMembers = (): Person[] => {
  try {
    const data = localStorage.getItem(MEMBERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_TEAM_MEMBERS;
  } catch (error) {
    console.error("Failed to load members:", error);
    return DEFAULT_TEAM_MEMBERS;
  }
};

export const saveMembers = (members: Person[]): void => {
  try {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  } catch (error) {
    console.error("Failed to save members:", error);
  }
};

// --- Schedule Entry Management ---

export const saveScheduleEntry = (entry: ScheduleEntry): void => {
  try {
    // Always save with the new prefix structure
    const key = `${ENTRY_KEY_PREFIX}${entry.id}`;
    localStorage.setItem(key, JSON.stringify(entry));

    // If this entry was migrated from a legacy date-key (where id === date),
    // we should remove the old legacy key to avoid duplication.
    if (/^\d{4}-\d{2}-\d{2}$/.test(entry.id)) {
        const legacyKey = `${LEGACY_KEY_PREFIX}${entry.id}`;
        if (localStorage.getItem(legacyKey)) {
            localStorage.removeItem(legacyKey);
        }
    }
  } catch (error) {
    console.error("Failed to save schedule:", error);
  }
};

export const loadScheduleEntry = (id: string): ScheduleEntry | null => {
  try {
    // 1. Try standard format
    const newKey = `${ENTRY_KEY_PREFIX}${id}`;
    const newData = localStorage.getItem(newKey);
    if (newData) {
      return JSON.parse(newData);
    }

    // 2. Try legacy format (where id is the date string)
    const legacyKey = `${LEGACY_KEY_PREFIX}${id}`;
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
      const records = JSON.parse(legacyData);
      return {
        id: id,
        date: id,
        title: '',
        records: records,
        createdAt: 0
      };
    }
    
    // 3. Fallback: Scan values if ID logic fails (rare case)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ENTRY_KEY_PREFIX)) {
             try {
                const val = localStorage.getItem(key);
                if (val) {
                    const entry = JSON.parse(val);
                    if (entry.id === id) return entry;
                }
             } catch(e) {}
        }
    }

    return null;
  } catch (error) {
    console.error("Failed to load schedule:", error);
    return null;
  }
};

export const deleteScheduleByKey = (key: string): void => {
    try {
        console.log(`[Storage] Deleting schedule by key: ${key}`);
        if (localStorage.getItem(key)) {
             localStorage.removeItem(key);
             console.log(`[Storage] Successfully removed key: ${key}`);
        } else {
            console.warn(`[Storage] Key not found to delete: ${key}`);
        }
    } catch (error) {
        console.error("[Storage] Failed to delete schedule by key:", error);
    }
};

export const deleteScheduleEntry = (id: string): void => {
  // Backward compatibility wrapper
  // Try to guess the key or find it
  try {
    const key = `${ENTRY_KEY_PREFIX}${id}`;
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        return;
    }
    const legacyKey = `${LEGACY_KEY_PREFIX}${id}`;
    if (localStorage.getItem(legacyKey)) {
        localStorage.removeItem(legacyKey);
        return;
    }
    
    // Scan as last resort
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(ENTRY_KEY_PREFIX)) {
             const val = localStorage.getItem(k);
             if (val && JSON.parse(val).id === id) {
                 localStorage.removeItem(k);
                 return;
             }
        }
    }
  } catch (error) {
    console.error("Failed to delete schedule by id:", error);
  }
};

export const deleteAllSchedules = (): void => {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(ENTRY_KEY_PREFIX) || key.startsWith(LEGACY_KEY_PREFIX))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error("Failed to delete all schedules:", error);
    }
};

export const resetApplication = (): void => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error("Failed to reset application:", error);
    }
};

export interface ScheduleSummary {
  storageKey: string; // The actual key in localStorage, used for reliable deletion
  id: string;
  date: string;
  title: string;
  total: number;
  completed: number;
  isAllCompleted: boolean;
  uncompletedNames: string[];
}

export const getScheduleSummaries = (): ScheduleSummary[] => {
  const summaries: ScheduleSummary[] = [];
  
  const currentMembers = getMembers();
  const memberMap = new Map<string, string>();
  currentMembers.forEach(m => memberMap.set(m.id, m.name));

  const createSummary = (storageKey: string, id: string, date: string, title: string, records: Record<string, TaskRecord>): ScheduleSummary => {
      const entries = Object.entries(records);
      const total = entries.length;
      let completed = 0;
      const uncompletedNames: string[] = [];

      entries.forEach(([memberId, record]) => {
        if (record.completed) {
          completed++;
        } else {
          const name = memberMap.get(memberId) || memberId;
          uncompletedNames.push(name);
        }
      });

      uncompletedNames.sort((a, b) => {
        const indexA = currentMembers.findIndex(m => m.name === a);
        const indexB = currentMembers.findIndex(m => m.name === b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      return {
        storageKey,
        id,
        date,
        title,
        total,
        completed,
        isAllCompleted: total > 0 && total === completed,
        uncompletedNames
      };
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith(ENTRY_KEY_PREFIX)) {
        try {
            const entry: ScheduleEntry = JSON.parse(localStorage.getItem(key) || '{}');
            summaries.push(createSummary(key, entry.id, entry.date, entry.title, entry.records));
        } catch (e) {
            console.error("Error parsing entry", key, e);
        }
    } else if (key.startsWith(LEGACY_KEY_PREFIX)) {
        try {
            const date = key.replace(LEGACY_KEY_PREFIX, '');
            const records = JSON.parse(localStorage.getItem(key) || '{}');
            summaries.push(createSummary(key, date, date, '', records));
        } catch (e) {
            console.error("Error parsing legacy entry", key, e);
        }
    }
  }

  // Sort by Date (desc), then Title or ID
  return summaries.sort((a, b) => {
      if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
      }
      return b.id.localeCompare(a.id);
  });
};