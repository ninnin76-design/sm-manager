
import React, { useState } from 'react';
import { ScheduleSummary } from '../services/storageService';
import { Trash2, Calendar, CheckCircle2, Circle, Users, Edit2, X, CheckSquare, AlertTriangle } from 'lucide-react';

interface BoardListProps {
  summaries: ScheduleSummary[];
  onSelectEntry: (id: string) => void;
  onDeleteEntry: (storageKey: string) => void;
  onDeleteEntries: (storageKeys: string[]) => void;
  onCreateNew: () => void;
  onManageMembers: () => void;
  onVerifyAdmin: (action: () => void) => void;
}

export const BoardList: React.FC<BoardListProps> = ({ summaries, onSelectEntry, onDeleteEntry, onDeleteEntries, onCreateNew, onManageMembers, onVerifyAdmin }) => {
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
    // User requested to stay in selection mode (List Edit Page) after deletion
    // setIsSelectionMode(false); 
    setSelectedKeys(new Set());
    setIsBulkDeleteConfirmOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, summary: ScheduleSummary) => {
    // Stop propagation to prevent row click
    e.stopPropagation(); 
    onVerifyAdmin(() => setDeleteTarget(summary));
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
    // Removes hyphens and takes the last 6 characters (YYMMDD) assuming YYYY-MM-DD input
    return dateStr.replace(/-/g, '').slice(2);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">체크 일지목록</h2>
            <p className="text-slate-500 text-sm mt-1">목록 내용을 확인하고 체크하세요!!</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            {isSelectionMode ? (
               <button 
                  onClick={toggleSelectionMode}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                  <X size={18} />
                  <span>취소</span>
              </button>
            ) : (
              <button 
                  onClick={() => onVerifyAdmin(toggleSelectionMode)}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center justify-center gap-2"
              >
                  <Edit2 size={16} />
                  <span>목록 편집</span>
              </button>
            )}
            
            {!isSelectionMode && (
              <>
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
              </>
            )}
        </div>
      </div>

      {isSelectionMode && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
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

      {/* List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {summaries.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="text-slate-400" size={32} />
            </div>
            <p className="text-lg font-medium">저장된 기록이 없습니다.</p>
            <p className="text-sm">새로운 체크 일지를 작성해 보세요.</p>
          </div>
        ) : (
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
                        <div className="flex items-center justify-end gap-3 h-full relative z-20">
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
        )}
      </div>

      {isSelectionMode && selectedKeys.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
          <button
            onClick={handleBulkDeleteClick}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-red-700 transition-all font-bold"
          >
            <Trash2 size={20} />
            <span>선택한 항목 삭제 ({selectedKeys.size})</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal (Single) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteTarget(null)}>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsBulkDeleteConfirmOpen(false)}>
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
