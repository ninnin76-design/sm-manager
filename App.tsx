import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Save, List, Sparkles, RotateCcw, ArrowLeft, Users, RefreshCw, LogOut, Eye, EyeOff } from 'lucide-react';
import { INITIAL_RECORD } from './constants';
import { TaskRecord, ScheduleEntry, Person } from './types';
import { PersonRow } from './components/PersonRow';
import { SummaryModal } from './components/SummaryModal';
import { BoardList } from './components/BoardList';
import { MemberManager } from './components/MemberManager';
import { LoginScreen } from './components/LoginScreen'; 
import { saveScheduleEntry, loadScheduleEntry, deleteScheduleByKey, getScheduleSummaries, ScheduleSummary, getMembers, saveMembers, deleteAllSchedules, resetApplication } from './services/storageService';
import { generateDailyReport } from './services/geminiService';

type ViewMode = 'list' | 'editor' | 'members';

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<Person | 'admin' | null>(null);

  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings State
  const [members, setMembers] = useState<Person[]>([]);

  // Editor Data States
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [records, setRecords] = useState<Record<string, TaskRecord>>({});
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public'); // Default to public
  
  // Metadata Lock State
  const [isMetadataLocked, setIsMetadataLocked] = useState(true);
  
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
      const initData = async () => {
          setIsLoading(true);
          const loadedMembers = await getMembers();
          setMembers(loadedMembers);
          setIsLoading(false);
      };
      initData();
  }, []);

  // Load summaries for the list view
  const loadSummaries = useCallback(async () => {
      if (viewMode === 'list' && currentUser) {
          setIsLoading(true);
          const data = await getScheduleSummaries();
          setSummaries(data);
          setIsLoading(false);
      }
  }, [viewMode, currentUser]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  // --- Handlers ---

  const handleLogin = (user: Person | 'admin') => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      // 즉시 로그아웃 처리 (팝업 제거로 작동 보장)
      setCurrentUser(null);
      setViewMode('list');
      
      // 에디터 상태 초기화 (선택 사항)
      setCurrentId(null);
      setTitle('');
      setRecords({});
  };

  // Helper to check if current user is admin
  const isAdmin = currentUser === 'admin';

  const handleVerifyAdmin = (action: () => void) => {
    // Replaced standard verify logic since we now have persistent login state
    if (isAdmin) {
      action();
    } else {
      alert('관리자 권한이 필요합니다.');
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

  // New: Handle Privacy Mode Change
  const handlePrivacyChange = (mode: 'public' | 'private') => {
      setPrivacyMode(mode);
      setIsSaved(false); // Mark as unsaved so the save button becomes active
  };

  const handleSave = async () => {
    setIsLoading(true);
    // ID Format: Date + Underscore + Timestamp Sequence
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
        createdAt: currentId ? 0 : Date.now(),
        privacyMode: privacyMode 
    };

    await saveScheduleEntry(entry);
    
    setCurrentId(idToSave);
    setIsSaved(true);
    setIsLoading(false);
    setViewMode('list');
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

  // 일반 열람 (수정 불가)
  const handleSelectEntryFromList = async (id: string) => {
      setIsLoading(true);
      const entry = await loadScheduleEntry(id);
      setIsLoading(false);
      
      if (entry) {
          setCurrentId(entry.id);
          setCurrentDate(entry.date);
          setTitle(entry.title || '');
          setRecords(entry.records);
          setPrivacyMode(entry.privacyMode || 'public'); // Load privacy setting
          setIsSaved(true);
          setIsMetadataLocked(true); // 잠금 모드 활성화
          setViewMode('editor');
      }
  };

  // 관리자 수정 (수정 가능)
  const handleEditEntryFromList = async (id: string) => {
    setIsLoading(true);
    const entry = await loadScheduleEntry(id);
    setIsLoading(false);
    
    if (entry) {
        setCurrentId(entry.id);
        setCurrentDate(entry.date);
        setTitle(entry.title || '');
        setRecords(entry.records);
        setPrivacyMode(entry.privacyMode || 'public'); // Load privacy setting
        setIsSaved(true);
        setIsMetadataLocked(false); // 잠금 모드 해제
        setViewMode('editor');
    }
  };

  const handleDeleteEntryFromList = async (storageKey: string) => {
      setIsLoading(true);
      await deleteScheduleByKey(storageKey);
      await loadSummaries(); 
      setIsLoading(false);
  };

  const handleDeleteEntriesFromList = async (storageKeys: string[]) => {
      setIsLoading(true);
      await Promise.all(storageKeys.map(key => deleteScheduleByKey(key)));
      await loadSummaries();
      setIsLoading(false);
  };

  const handleCreateNew = () => {
      setCurrentId(null);
      setCurrentDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setPrivacyMode('public'); // Default to public for new entries
      
      const initialRecords: Record<string, TaskRecord> = {};
      members.forEach(member => {
        initialRecords[member.id] = { ...INITIAL_RECORD };
      });
      setRecords(initialRecords);
      
      setIsSaved(false);
      setIsMetadataLocked(false); // 새 작성은 항상 수정 가능
      setViewMode('editor');
  };

  const renderGroups = () => {
    const groups: string[] = Array.from(new Set(members.map(m => m.group)));
    
    groups.sort((a, b) => {
        // Priority 1: Current User's Group (if logged in as a specific person)
        if (currentUser && typeof currentUser !== 'string') {
            if (a === currentUser.group) return -1;
            if (b === currentUser.group) return 1;
        }

        // Priority 2: Default Ordering
        if (a === '화성병점') return -1;
        if (b === '화성병점') return 1;
        if (a === '오산중앙') return -1;
        if (b === '오산중앙') return 1;
        return a.localeCompare(b);
    });

    return groups.map(groupName => {
        // Filter members based on privacy settings and user role
        let groupMembers = members.filter(m => m.group === groupName);

        // Apply privacy filter:
        if (!isAdmin && privacyMode === 'private') {
             // TS18047 fix: use optional chaining for currentUser?.id
             groupMembers = groupMembers.filter(m => typeof currentUser !== 'string' && m.id === currentUser?.id);
        }

        // If no members in this group to show, skip rendering the group
        if (groupMembers.length === 0) return null;

        // ** Priority Sort: Current User first in their group **
        if (currentUser && typeof currentUser !== 'string' && groupName === currentUser.group) {
            groupMembers.sort((a, b) => {
                if (a.id === currentUser.id) return -1;
                if (b.id === currentUser.id) return 1;
                return 0; // Maintain original order for others
            });
        }

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
              {groupMembers.map(member => {
                const isMyRow = currentUser !== 'admin' && currentUser?.id === member.id;
                const isDisabled = !isAdmin && !isMyRow;

                return (
                    <PersonRow
                        key={member.id}
                        person={member}
                        record={records[member.id] || { ...INITIAL_RECORD }}
                        onChange={handleRecordChange}
                        disabled={isDisabled}
                    />
                );
              })}
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

  // --- Render Login Screen if not authenticated ---
  if (!currentUser) {
    if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div></div>;
    return <LoginScreen members={members} onLogin={handleLogin} />;
  }

  // --- Main App Render ---
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                className="flex items-center gap-3 cursor-pointer" 
                onClick={() => setViewMode('list')}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${isAdmin ? 'bg-slate-800' : 'bg-blue-600'}`}>
                    {isAdmin ? 'A' : 'S'}
                </div>
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">SM관리 매니저</h1>
                {!isAdmin && typeof currentUser !== 'string' && (
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">
                        {currentUser?.name}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                {viewMode === 'list' && (
                    <button
                        type="button"
                        onClick={() => loadSummaries()}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                        title="새로고침"
                    >
                        <RefreshCw size={20} />
                    </button>
                )}

                {viewMode === 'editor' && (
                     <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                     >
                        <List size={20} />
                        <span className="hidden sm:inline font-medium">목록으로</span>
                     </button>
                )}

                <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="로그아웃"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        
        {viewMode === 'list' && (
            <BoardList 
                summaries={summaries}
                isAdmin={isAdmin}
                onSelectEntry={handleSelectEntryFromList}
                onEditEntry={handleEditEntryFromList}
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
                    <div className="flex items-center gap-2 mb-2 justify-between">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setViewMode('list')}
                                className="p-1 -ml-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="text-lg font-bold text-slate-800">체크 일지작성</h2>
                        </div>
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
                                    disabled={!!currentId && isMetadataLocked}
                                    className={`w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none transition-colors ${!!currentId && isMetadataLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500'}`}
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
                                disabled={!!currentId && isMetadataLocked}
                                className={`w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none placeholder-slate-400 transition-colors ${!!currentId && isMetadataLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500'}`}
                            />
                        </div>
                    </div>

                    {/* Privacy Mode Toggle (Only visible if Admin or creating new entry) */}
                    {(!isMetadataLocked || isAdmin) && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                {privacyMode === 'public' ? <Eye size={18} className="text-blue-500"/> : <EyeOff size={18} className="text-slate-500"/>}
                                <span className="text-sm font-semibold text-slate-700">조회 권한 설정</span>
                            </div>
                            <div className="flex p-1 bg-white border border-slate-200 rounded-lg">
                                <button
                                    onClick={() => handlePrivacyChange('public')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${privacyMode === 'public' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    모두 보기 (기본)
                                </button>
                                <button
                                    onClick={() => handlePrivacyChange('private')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${privacyMode === 'private' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    본인만 보기
                                </button>
                            </div>
                        </div>
                    )}

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
                            <p className="text-slate-600 font-medium">등록된 SM이 없습니다.</p>
                            {isAdmin && (
                                <button 
                                    onClick={() => setViewMode('members')}
                                    className="mt-2 text-blue-600 text-sm hover:underline"
                                >
                                    SM 관리에서 추가하기
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-24"></div>

                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 z-40 animate-in slide-in-from-bottom-8 duration-500 w-max max-w-[90%] overflow-x-auto hide-scrollbar">
                    {isAdmin && (
                        <>
                        <button
                            onClick={handleReset}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all flex-shrink-0"
                            title="초기화"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <div className="w-px h-6 bg-slate-300 mx-2 flex-shrink-0"></div>
                        </>
                    )}

                    <button
                        onClick={handleGenerateReport}
                        disabled={members.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        <Sparkles size={16} />
                        <span className="hidden sm:inline">AI 브리핑</span>
                        <span className="sm:hidden">AI</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaved || members.length === 0}
                        className={`
                            flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow-sm transition-all text-sm whitespace-nowrap
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
    </div>
  );
};

export default App;