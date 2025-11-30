import React, { useState } from 'react';
import { ScheduleSummary } from '../services/storageService';
import { Trash2, Calendar, CheckCircle2, Circle, Users, Edit2, X, CheckSquare, AlertTriangle } from 'lucide-react';

interface BoardListProps {
  summaries: ScheduleSummary[];
  onSelectEntry: (id: string) => void;
  onEditEntry: (id: string) => void;
  onDeleteEntry: (storageKey: string) => void;
  onDeleteEntries: (storageKeys: string[]) => void;
  onCreateNew: () => void;
  onManageMembers: () => void;
  onVerifyAdmin: (action: () => void) => void;
}

export const BoardList: React.FC<BoardListProps> = ({ summaries, onSelectEntry, onEditEntry, onDeleteEntry, onDeleteEntries, onCreateNew, onManageMembers, onVerifyAdmin }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  
  // Modal States
  const [deleteTarget, setDeleteTarget] = useState<ScheduleSummary | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const handleContentClick = (summary: ScheduleSummary) => {
    if (isSelectionMode) {
      toggleSelection(summary.storageKey);
      return;
    }
    onSelectEntry(summary.id);
  };

  const toggleSelection = (key: string) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedKeys(newSelected);
  };

  // toggleSelectionMode removed from UI but kept in logic if needed later (dead code for now)
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedKeys(new Set());
  };

  const handleSelectAll = () => {
    if (selectedKeys.size === summaries.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(summaries.map(s => s.storageKey)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedKeys.size === 0) return;
    onVerifyAdmin(() => setIsBulkDeleteConfirmOpen(true));
  };

  const confirmBulkDelete = () => {
    onDeleteEntries(Array.from(selectedKeys));
    setSelectedKeys(new Set());
    setIsBulkDeleteConfirmOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, summary: ScheduleSummary) => {
    e.stopPropagation(); 
    e.preventDefault();
    onVerifyAdmin(() => setDeleteTarget(summary));
  };

  const handleEditClick = (e: React.MouseEvent, summary: ScheduleSummary) => {
    e.stopPropagation();
    e.preventDefault();
    onVerifyAdmin(() => onEditEntry(summary.id));
  };

  const confirmSingleDelete = () => {
    if (deleteTarget) {
      onDeleteEntry(deleteTarget.storageKey);
      setDeleteTarget(null);
    }
  };

  // Helper to format YYYY-MM-DD to YYMMDD
  const formatDateToYYMMDD = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '').slice(2);
  };

  if (summaries.length === 0) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">체크 일지목록</h2>
                    <p className="text-slate-500 text-sm mt-1">목록 내용을 확인하고 체크하세요!!</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => onVerifyAdmin(onManageMembers)}
                        className="flex-1 md:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Users size={18} />
                        <span className="hidden sm:inline">팀원 관리</span>
                    </button>
                    <button 
                        onClick={onCreateNew}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Calendar size={18} />
                        <span>작성</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-12 text-center text-slate-500">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="text-slate-400" size={32} />
                    </div>
                    <p className="text-lg font-medium">저장된 기록이 없습니다.</p>
                    <p className="text-sm">새로운 체크 일지를 작성해 보세요.</p>
                </div>
            </div>
        </div>
      )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 md:mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">체크 일지목록</h2>
            <p className="text-slate-500 text-sm mt-1">목록 내용을 확인하고 체크하세요!!</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {/* Edited: "Edit" button removed as requested */}
            
            <button 
                onClick={() => onVerifyAdmin(onManageMembers)}
                className="flex-shrink-0 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
                <Users size={16} />
                <span>SM 관리</span>
            </button>
            <button 
                onClick={onCreateNew}
                className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
                <Calendar size={16} />
                <span>작성</span>
            </button>
        </div>
      </div>

      {isSelectionMode && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 sticky top-16 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedKeys.size === summaries.length && summaries.length > 0 ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                {selectedKeys.size === summaries.length && summaries.length > 0 && <CheckSquare size={14} className="text-white pointer-events-none" />}
              </div>
              전체 선택 ({selectedKeys.size}/{summaries.length})
            </button>
          </div>
        </div>
      )}

      {/* --- Mobile View: Card List (Visible on sm/md, Hidden on lg) --- */}
      <div className="block lg:hidden space-y-4">
        {summaries.map((summary) => (
            <div 
                key={summary.storageKey}
                onClick={() => handleContentClick(summary)}
                className={`
                    bg-white p-4 rounded-xl border shadow-sm relative transition-all active:scale-[0.99]
                    ${isSelectionMode && selectedKeys.has(summary.storageKey) ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'}
                `}
            >
                {/* Header Row: Date & Delete/Select */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        {isSelectionMode && (
                            <div 
                                className="p-2 -ml-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelection(summary.storageKey);
                                }}
                            >
                                <div className={`w-6 h-6 rounded border transition-colors flex items-center justify-center ${selectedKeys.has(summary.storageKey) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                                    {selectedKeys.has(summary.storageKey) && <CheckSquare size={16} className="text-white" />}
                                </div>
                            </div>
                        )}
                        <div>
                            <span className="text-xs font-bold text-indigo-600 block mb-0.5">{formatDateToYYMMDD(summary.date)}</span>
                            <h3 className={`font-bold text-lg leading-tight ${summary.title ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                {summary.title || '(제목 없음)'}
                            </h3>
                        </div>
                    </div>
                    
                    {!isSelectionMode && (
                      <div className="flex items-center -mr-2 relative z-10">
                        <button 
                            type="button"
                            onClick={(e) => handleEditClick(e, summary)}
                            className="p-2 text-slate-400 hover:text-blue-600 active:bg-blue-50 rounded-full transition-colors"
                        >
                            <Edit2 size={20} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => handleDeleteClick(e, summary)}
                            className="p-2 text-slate-400 hover:text-red-600 active:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                </div>

                {/* Progress Bar Row */}
                <div className="mb-3">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-semibold text-slate-500">진행 현황</span>
                        <div className={`text-xs font-bold flex items-center gap-1 ${summary.isAllCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                            {summary.isAllCompleted ? (
                                <><CheckCircle2 size={12} /> 완료됨</>
                            ) : (
                                <>{summary.completed}/{summary.total}</>
                            )}
                        </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${summary.isAllCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${(summary.completed / (summary.total || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Footer Row: Uncompleted Names */}
                {!summary.isAllCompleted && summary.uncompletedNames.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 flex items-start gap-2">
                         <span className="text-xs font-medium text-slate-400 shrink-0 mt-1">미완료:</span>
                         <div className="flex flex-wrap gap-1">
                            {summary.uncompletedNames.map((name, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                    {name}
                                </span>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* --- Desktop View: Table (Hidden on sm/md, Visible on lg) --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                  {isSelectionMode && <th className="px-4 py-4 w-[5%]"></th>}
                  <th className="px-6 py-4 font-semibold w-[15%]">날짜</th>
                  <th className="px-6 py-4 font-semibold w-[25%]">제목</th>
                  <th className="px-6 py-4 font-semibold w-[20%]">진행 현황</th>
                  <th className="px-6 py-4 font-semibold w-[25%]">미완료 인원</th>
                  {!isSelectionMode && <th className="px-6 py-4 font-semibold text-right w-[15%]">관리</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((summary) => (
                  <tr 
                    key={summary.storageKey} 
                    className={`transition-colors group relative ${isSelectionMode && selectedKeys.has(summary.storageKey) ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                  >
                    {isSelectionMode && (
                      <td 
                        className="px-4 py-4 align-top cursor-pointer"
                        onClick={() => toggleSelection(summary.storageKey)}
                      >
                        <div className={`mt-3 w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedKeys.has(summary.storageKey) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                           {selectedKeys.has(summary.storageKey) && <CheckSquare size={14} className="text-white pointer-events-none" />}
                        </div>
                      </td>
                    )}
                    
                    {/* Content Cells */}
                    <td 
                        className="px-6 py-4 align-top cursor-pointer"
                        onClick={() => handleContentClick(summary)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${summary.isAllCompleted ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                        <span className="font-semibold text-slate-700">{formatDateToYYMMDD(summary.date)}</span>
                      </div>
                    </td>
                    <td 
                        className="px-6 py-4 align-top cursor-pointer"
                        onClick={() => handleContentClick(summary)}
                    >
                        <span className={`font-medium ${summary.title ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                            {summary.title || '(제목 없음)'}
                        </span>
                    </td>
                    <td 
                        className="px-6 py-4 align-top cursor-pointer"
                        onClick={() => handleContentClick(summary)}
                    >
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            {summary.isAllCompleted ? (
                                <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={16}/> 완료됨</span>
                            ) : (
                                <span className="flex items-center gap-1 text-slate-500"><Circle size={16}/> {summary.completed}/{summary.total} 완료</span>
                            )}
                         </div>
                         <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${summary.isAllCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${(summary.completed / (summary.total || 1)) * 100}%` }}
                            ></div>
                         </div>
                      </div>
                    </td>
                    <td 
                        className="px-6 py-4 align-top cursor-pointer"
                        onClick={() => handleContentClick(summary)}
                    >
                        {summary.isAllCompleted ? (
                            <span className="text-slate-400 text-sm">-</span>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {summary.uncompletedNames.map((name, index) => (
                                    <span key={`${summary.storageKey}-uncompleted-${index}`} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100 whitespace-nowrap">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </td>

                    {/* Action Cell */}
                    {!isSelectionMode && (
                      <td 
                        className="px-6 py-4 align-top text-right"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div className="flex items-center justify-end gap-2 h-full relative z-20">
                          <button 
                              type="button"
                              onClick={(e) => handleEditClick(e, summary)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-100 cursor-pointer relative z-30"
                              title="수정"
                          >
                              <Edit2 size={20} className="pointer-events-none" />
                          </button>
                          <button 
                              type="button"
                              onClick={(e) => handleDeleteClick(e, summary)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 active:bg-red-100 cursor-pointer relative z-30"
                              title="삭제"
                              aria-label="삭제"
                          >
                              <Trash2 size={20} className="pointer-events-none" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {isSelectionMode && selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300 w-full max-w-sm px-4">
          <button
            onClick={handleBulkDeleteClick}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl hover:bg-red-700 transition-all font-bold"
          >
            <Trash2 size={20} />
            <span>선택한 항목 삭제 ({selectedKeys.size})</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal (Single) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteTarget(null)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold">기록 삭제</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">{deleteTarget.date} {deleteTarget.title ? `(${deleteTarget.title})` : ''}</span><br/>
              기록을 삭제하시겠습니까?
              <br/><span className="text-sm text-slate-400 mt-2 block">삭제된 데이터는 복구할 수 없습니다.</span>
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={confirmSingleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsBulkDeleteConfirmOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold">선택 항목 삭제</h3>
            </div>
            <p className="text-slate-600">
              선택한 <span className="font-bold text-slate-800">{selectedKeys.size}개</span>의 기록을 삭제하시겠습니까?
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={confirmBulkDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                모두 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};