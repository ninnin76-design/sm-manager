
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Save, List, Sparkles, RotateCcw, ArrowLeft, Trash2, Users, Settings, RefreshCw } from 'lucide-react';
import { INITIAL_RECORD } from './constants';
import { TaskRecord, ScheduleEntry, Person } from './types';
import { PersonRow } from './components/PersonRow';
import { SummaryModal } from './components/SummaryModal';
import { BoardList } from './components/BoardList';
import { MemberManager } from './components/MemberManager';
import { AdminLoginModal } from './components/AdminLoginModal';
// Fix: Removed incorrect import 'deleteScheduleEntry'
import { saveScheduleEntry, loadScheduleEntry, deleteScheduleByKey, getScheduleSummaries, ScheduleSummary, getMembers, saveMembers, deleteAllSchedules, resetApplication } from './services/storageService';
import { generateDailyReport } from './services/geminiService';

type ViewMode = 'list' | 'editor' | 'members';

const App: React.FC = () => {
  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false); // New Loading State
  
  // Settings State
  const [members, setMembers] = useState<Person[]>([]);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  // Editor Data States
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [records, setRecords] = useState<Record<string, TaskRecord>>({});
  
  // UI States
  const [isSaved, setIsSaved] = useState(false);
  const [summaries, setSummaries] = useState<ScheduleSummary[]>([]);
  
  // AI States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');

  // --- Effects ---

  // Initial Load (Members)
  useEffect(() => {
      const initMembers = async () => {
          const loadedMembers = await getMembers();
          setMembers(loadedMembers);
      };
      initMembers();
  }, []);

  // Load summaries for the list view
  const loadSummaries = useCallback(async () => {
      if (viewMode === 'list') {
          setIsLoading(true);
          const data = await getScheduleSummaries();
          setSummaries(data);
          setIsLoading(false);
      }
  }, [viewMode]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  // --- Handlers ---

  // Admin Auth Logic
  const handleVerifyAdmin = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      setPendingAdminAction(() => action);
      setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    if (pendingAdminAction) {
      pendingAdminAction();
      setPendingAdminAction(null);
    }
  };

  const handleMembersUpdate = async (newMembers: Person[]) => {
      setIsLoading(true);
      setMembers(newMembers);
      await saveMembers(newMembers);
      setIsLoading(false);
  };

  const handleClearAllData = async (type: 'schedules' | 'all') => {
      setIsLoading(true);
      if (type === 'schedules') {
          await deleteAllSchedules();
          setSummaries([]);
      } else if (type === 'all') {
          await resetApplication();
          setMembers(await getMembers()); 
          setSummaries([]);
      }
      setIsLoading(false);
  };

  const handleRecordChange = useCallback((id: string, field: keyof TaskRecord, value: any) => {
    setRecords(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
    setIsSaved(false);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      setIsSaved(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    // ID Format: Date + Underscore + Timestamp Sequence (e.g., 2024-05-20_1716182922123)
    const idToSave = currentId || `${currentDate}_${Date.now()}`;
    
    // Clean up records: only save records for current members
    const cleanRecords: Record<string, TaskRecord> = {};
    members.forEach(m => {
        cleanRecords[m.id] = records[m.id] || { ...INITIAL_RECORD };
    });

    const entry: ScheduleEntry = {
        id: idToSave,
        date: currentDate,
        title: title,
        records: cleanRecords,
        createdAt: currentId ? 0 : Date.now() 
    };

    await saveScheduleEntry(entry);
    
    setCurrentId(idToSave);
    setIsSaved(true);
    setIsLoading(false);
    setViewMode('list');
  };

  const handleDeleteCurrent = async () => {
      if (!currentId) return;
      if (window.confirm('정말 이 기록을 삭제하시겠습니까?')) {
          setIsLoading(true);
          await deleteScheduleByKey(currentId);
          setIsLoading(false);
          setViewMode('list');
      }
  };

  const handleGenerateReport = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    setAiContent('');
    
    const reportTitle = title ? `${currentDate} (${title})` : currentDate;
    const report = await generateDailyReport(reportTitle, members, records);
    
    setAiContent(report);
    setAiLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('현재 화면의 기록을 초기화하시겠습니까?')) {
        const resetData: Record<string, TaskRecord> = {};
        members.forEach(member => {
            resetData[member.id] = { ...INITIAL_RECORD };
        });
        setRecords(resetData);
        setIsSaved(false);
    }
  }

  const handleSelectEntryFromList = async (id: string) => {
      setIsLoading(true);
      const entry = await loadScheduleEntry(id);
      setIsLoading(false);
      
      if (entry) {
          setCurrentId(entry.id);
          setCurrentDate(entry.date);
          setTitle(entry.title || '');
          setRecords(entry.records);
          setIsSaved(true);
          setViewMode('editor');
      }
  };

  const handleDeleteEntryFromList = async (storageKey: string) => {
      setIsLoading(true);
      await deleteScheduleByKey(storageKey);
      await loadSummaries(); // Refresh list
      setIsLoading(false);
  };

  const handleDeleteEntriesFromList = async (storageKeys: string[]) => {
      setIsLoading(true);
      // Execute all deletes
      await Promise.all(storageKeys.map(key => deleteScheduleByKey(key)));
      await loadSummaries(); // Refresh list
      setIsLoading(false);
  };

  const handleCreateNew = () => {
      setCurrentId(null);
      setCurrentDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      
      const initialRecords: Record<string, TaskRecord> = {};
      members.forEach(member => {
        initialRecords[member.id] = { ...INITIAL_RECORD };
      });
      setRecords(initialRecords);
      
      setIsSaved(false);
      setViewMode('editor');
  };

  // --- Render Helpers ---

  const renderGroups = () => {
    const groups: string[] = Array.from(new Set(members.map(m => m.group)));
    
    groups.sort((a, b) => {
        if (a === '화성병점') return -1;
        if (b === '화성병점') return 1;
        if (a === '오산중앙') return -1;
        if (b === '오산중앙') return 1;
        return a.localeCompare(b);
    });

    return groups.map(groupName => {
        const groupMembers = members.filter(m => m.group === groupName);
        const allCompleted = groupMembers.every(m => {
            const record = records[m.id] as TaskRecord | undefined;
            return record?.completed;
        });

        return (
          <div key={groupName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className={`
              px-6 py-4 border-b flex justify-between items-center transition-colors duration-300
              ${allCompleted ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-slate-800'}
            `}>
              <h2 className="text-white font-bold text-lg tracking-wide">{groupName}</h2>
              <div className="text-white/80 text-sm font-medium">
                {groupMembers.filter(m => {
                    const record = records[m.id] as TaskRecord | undefined;
                    return record?.completed;
                }).length} / {groupMembers.length} 완료
              </div>
            </div>
            <div className="p-4 space-y-3">
              {groupMembers.map(member => (
                <PersonRow
                  key={member.id}
                  person={member}
                  record={records[member.id] || { ...INITIAL_RECORD }}
                  onChange={handleRecordChange}
                />
              ))}
            </div>
          </div>
        );
    });
  };

  const totalTasks = members.length;
  const completedTasks = members.reduce((acc, member) => {
      if (records[member.id]?.completed) return acc + 1;
      return acc;
  }, 0);
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-500 font-medium">데이터 동기화 중...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                className="flex items-center gap-3 cursor-pointer" 
                onClick={() => setViewMode('list')}
            >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                    S
                </div>
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">SM관리 매니저</h1>
            </div>
            
            <div className="flex items-center gap-3">
                {viewMode === 'list' && (
                    <>
                        <button
                            onClick={() => loadSummaries()}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                            title="새로고침"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={() => handleVerifyAdmin(() => setViewMode('members'))}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="설정 및 팀원 관리"
                        >
                            <Settings size={20} />
                            <span className="hidden sm:inline font-medium">설정</span>
                        </button>
                    </>
                )}

                {viewMode === 'editor' ? (
                     <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                     >
                        <List size={20} />
                        <span className="hidden sm:inline font-medium">목록으로</span>
                     </button>
                ) : viewMode === 'list' ? (
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors font-medium"
                    >
                        <Sparkles size={18} />
                        <span className="hidden sm:inline">오늘 기록하기</span>
                    </button>
                ) : null}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {viewMode === 'list' && (
            <BoardList 
                summaries={summaries}
                onSelectEntry={handleSelectEntryFromList}
                onDeleteEntry={handleDeleteEntryFromList}
                onDeleteEntries={handleDeleteEntriesFromList}
                onCreateNew={handleCreateNew}
                onManageMembers={() => setViewMode('members')}
                onVerifyAdmin={handleVerifyAdmin}
            />
        )}
        
        {viewMode === 'members' && (
            <MemberManager 
                members={members}
                onUpdateMembers={handleMembersUpdate}
                onClearAllData={handleClearAllData}
                onBack={() => setViewMode('list')}
            />
        )}

        {viewMode === 'editor' && (
            <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <button 
                            onClick={() => setViewMode('list')}
                            className="p-1 -ml-1 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800">체크 일지작성</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase">날짜</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <input
                                    type="date"
                                    value={currentDate}
                                    onChange={handleDateChange}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase">제목 (선택)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={handleTitleChange}
                                placeholder="예:체크사항,기록사항 등"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <span className="text-slate-500 text-sm font-medium">전체 진행률</span>
                        <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <span className="font-bold text-blue-600">{progress}%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {renderGroups()}
                    {members.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                <Users className="text-slate-400" size={24} />
                            </div>
                            <p className="text-slate-600 font-medium">등록된 팀원이 없습니다.</p>
                            <button 
                                onClick={() => setViewMode('members')}
                                className="mt-2 text-blue-600 text-sm hover:underline"
                            >
                                팀원 관리에서 추가하기
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-24"></div>

                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 z-40 animate-in slide-in-from-bottom-8 duration-500">
                    <button
                        onClick={handleReset}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                        title="초기화"
                    >
                        <RotateCcw size={18} />
                    </button>

                    {currentId && (
                         <button
                            onClick={handleDeleteCurrent}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="삭제"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    
                    <div className="w-px h-6 bg-slate-300 mx-2"></div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={members.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={16} />
                        <span className="hidden sm:inline">AI 브리핑</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaved || members.length === 0}
                        className={`
                            flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow-sm transition-all text-sm
                            ${isSaved 
                                ? 'bg-green-500 text-white cursor-default' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:scale-100 disabled:cursor-not-allowed'}
                        `}
                    >
                        <Save size={16} />
                        <span>{isSaved ? '저장됨' : '저장하기'}</span>
                    </button>
                </div>
            </>
        )}
      </main>

      <SummaryModal 
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        loading={aiLoading}
        content={aiContent}
      />
      
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
};

export default App;
