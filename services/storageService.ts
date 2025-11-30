
import { TaskRecord, ScheduleEntry, Person } from '../types';
import { TEAM_MEMBERS as DEFAULT_TEAM_MEMBERS } from '../constants';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, query, orderBy, writeBatch } from "firebase/firestore";

const SCHEDULES_COLLECTION = 'schedules';
const SETTINGS_COLLECTION = 'settings';
const MEMBERS_DOC_ID = 'team_members';

// --- Member Management ---

export const getMembers = async (): Promise<Person[]> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, MEMBERS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().members as Person[];
    } else {
      // Initialize with defaults if not exists
      await setDoc(docRef, { members: DEFAULT_TEAM_MEMBERS });
      return DEFAULT_TEAM_MEMBERS;
    }
  } catch (error) {
    console.error("Failed to load members from DB:", error);
    return DEFAULT_TEAM_MEMBERS;
  }
};

export const saveMembers = async (members: Person[]): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, MEMBERS_DOC_ID);
    await setDoc(docRef, { members: members }, { merge: true });
  } catch (error) {
    console.error("Failed to save members to DB:", error);
  }
};

// --- Schedule Entry Management ---

export const saveScheduleEntry = async (entry: ScheduleEntry): Promise<void> => {
  try {
    // ID를 문서 ID로 사용하여 저장
    await setDoc(doc(db, SCHEDULES_COLLECTION, entry.id), entry);
  } catch (error) {
    console.error("Failed to save schedule to DB:", error);
    throw error;
  }
};

export const loadScheduleEntry = async (id: string): Promise<ScheduleEntry | null> => {
  try {
    const docRef = doc(db, SCHEDULES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ScheduleEntry;
    }
    return null;
  } catch (error) {
    console.error("Failed to load schedule from DB:", error);
    return null;
  }
};

export const deleteScheduleByKey = async (key: string): Promise<void> => {
    // Firestore에서는 key가 곧 Document ID입니다.
    try {
        await deleteDoc(doc(db, SCHEDULES_COLLECTION, key));
    } catch (error) {
        console.error("Failed to delete schedule from DB:", error);
    }
};

export const deleteAllSchedules = async (): Promise<void> => {
    try {
        const q = query(collection(db, SCHEDULES_COLLECTION));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error("Failed to delete all schedules from DB:", error);
    }
};

export const resetApplication = async (): Promise<void> => {
    try {
        await deleteAllSchedules();
        // Reset members to default
        const docRef = doc(db, SETTINGS_COLLECTION, MEMBERS_DOC_ID);
        await setDoc(docRef, { members: DEFAULT_TEAM_MEMBERS });
    } catch (error) {
        console.error("Failed to reset application DB:", error);
    }
};

export interface ScheduleSummary {
  storageKey: string;
  id: string;
  date: string;
  title: string;
  total: number;
  completed: number;
  isAllCompleted: boolean;
  uncompletedNames: string[];
}

export const getScheduleSummaries = async (): Promise<ScheduleSummary[]> => {
  try {
    // Load members first for name mapping
    const currentMembers = await getMembers();
    const memberMap = new Map<string, string>();
    currentMembers.forEach(m => memberMap.set(m.id, m.name));

    // Load all schedules
    // 중요: 복합 정렬(orderBy 2개 이상)을 제거하여 색인 오류 방지
    const q = query(collection(db, SCHEDULES_COLLECTION), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const summaries: ScheduleSummary[] = [];

    querySnapshot.forEach((doc) => {
        const entry = doc.data() as ScheduleEntry;
        const records = entry.records || {};
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

        summaries.push({
            storageKey: doc.id, // Firestore Doc ID
            id: entry.id,
            date: entry.date,
            title: entry.title,
            total,
            completed,
            isAllCompleted: total > 0 && total === completed,
            uncompletedNames
        });
    });
    
    // 메모리 내에서 2차 정렬 (날짜 같으면 최신순)
    summaries.sort((a, b) => {
        if (a.date !== b.date) return 0; // 이미 쿼리에서 정렬됨
        // ID에 타임스탬프가 포함되어 있으므로 ID 역순으로 정렬하면 최신순이 됨
        return b.id.localeCompare(a.id);
    });

    return summaries;

  } catch (error) {
    console.error("Error loading summaries from DB:", error);
    return [];
  }
};
