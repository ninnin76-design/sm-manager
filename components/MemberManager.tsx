import React, { useState, useEffect } from 'react';
import { Person } from '../types';
import { TEAMS } from '../types';
import { ArrowLeft, UserPlus, Trash2, Users, Save, RotateCcw, AlertTriangle, Database, Edit2, X, Check } from 'lucide-react';

interface MemberManagerProps {
  members: Person[];
  onUpdateMembers: (newMembers: Person[]) => void;
  onClearAllData: (type: 'schedules' | 'all') => void;
  onBack: () => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({ members: initialMembers, onUpdateMembers, onClearAllData, onBack }) => {
  const [localMembers, setLocalMembers] = useState<Person[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  // Explicitly type as string to avoid inference as literal union type
  const [newGroup, setNewGroup] = useState<string>(TEAMS.HWASEONG);
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync local state with props when initialMembers changes (e.g. after save or on mount)
  useEffect(() => {
    setLocalMembers(initialMembers);
    setHasChanges(false);
  }, [initialMembers]);

  const resetForm = () => {
    setNewName('');
    // Keep group or reset? Keeping group is usually more convenient for bulk entry
    setEditingId(null);
    setIsCustomGroup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGroup.trim()) return;

    if (editingId) {
        // Update existing member
        setLocalMembers(prev => prev.map(m => 
            m.id === editingId 
                ? { ...m, name: newName.trim(), group: newGroup.trim() } 
                : m
        ));
        setEditingId(null);
    } else {
        // Add new member
        const newPerson: Person = {
            id: `user_${Date.now()}`,
            name: newName.trim(),
            group: newGroup.trim()
        };
        setLocalMembers(prev => [...prev, newPerson]);
    }

    setHasChanges(true);
    setNewName(''); // Clear name only to allow rapid entry of same group
  };

  const handleEditClick = (member: Person) => {
    setEditingId(member.id);
    setNewName(member.name);
    setNewGroup(member.group);
    
    // Check if group is custom
    const defaultGroups = [TEAMS.HWASEONG, TEAMS.OSAN] as string[];
    if (!defaultGroups.includes(member.group)) {
        setIsCustomGroup(true); // Assuming logic for custom group detection relies on being outside defaults or UI state
    } else {
        setIsCustomGroup(false);
    }
  };

  const handleCancelEdit = () => {
      resetForm();
  };

  const handleDeleteMember = (id: string) => {
    if (editingId === id) {
        resetForm();
    }
    setLocalMembers(prev => prev.filter(m => m.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateMembers(localMembers);
    // Navigate back to list view after saving
    onBack();
  };

  const handleReset = () => {
    if (window.confirm('변경사항을 모두 취소하고 초기화하시겠습니까?')) {
      setLocalMembers(initialMembers);
      setHasChanges(false);
      resetForm();
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      if (!window.confirm('저장하지 않은 변경사항이 있습니다. 저장하지 않고 나가시겠습니까?')) {
        return;
      }
    }
    onBack();
  };

  const handleClearSchedules = () => {
      if (window.confirm('경고: 저장된 모든 업무 일지 기록이 삭제됩니다.\n팀원 목록은 유지됩니다.\n계속하시겠습니까?')) {
          if (window.confirm('정말로 모든 기록을 영구적으로 삭제하시겠습니까?')) {
              onClearAllData('schedules');
              onBack();
          }
      }
  };

  const handleFactoryReset = () => {
      if (window.confirm('경고: 앱의 모든 데이터가 삭제됩니다.\n팀원 목록과 모든 업무 기록이 초기화됩니다.\n계속하시겠습니까?')) {
          const verify = prompt('초기화하려면 "초기화"라고 입력해주세요.');
          if (verify === '초기화') {
              onClearAllData('all');
              onBack();
          }
      }
  };

  // Get unique groups from current local members + defaults
  const existingGroups = Array.from(new Set([
    TEAMS.HWASEONG,
    TEAMS.OSAN,
    ...localMembers.map(m => m.group)
  ]));

  return (
    <div className="relative min-h-screen pb-24 space-y-6 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={handleGoBack}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">설정 및 팀원 관리</h2>
          <p className="text-sm text-slate-500">
            팀원을 등록, 수정, 삭제할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Add/Edit Member Form */}
      <div className={`p-5 rounded-xl border shadow-sm transition-all duration-300 ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${editingId ? 'text-indigo-700' : 'text-slate-900'}`}>
            {editingId ? <Edit2 size={18} /> : <UserPlus size={18} className="text-blue-600" />}
            {editingId ? '팀원 정보 수정' : '새 팀원 등록'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 ml-1">이름</label>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="이름 입력"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 ml-1">소속</label>
                {!isCustomGroup ? (
                    <div className="relative">
                        <select
                            value={newGroup}
                            onChange={(e) => {
                                if (e.target.value === 'custom') {
                                    setIsCustomGroup(true);
                                    setNewGroup('');
                                } else {
                                    setNewGroup(e.target.value);
                                }
                            }}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {existingGroups.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                            <option value="custom">+ 직접 입력</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                            placeholder="소속명 입력"
                            autoFocus
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                         <button
                            type="button"
                            onClick={() => { setIsCustomGroup(false); setNewGroup(TEAMS.HWASEONG); }}
                            className="px-3 py-2 text-xs bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600"
                        >
                            취소
                        </button>
                    </div>
                )}
            </div>
            <div className="flex items-end gap-2">
                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors h-[42px]"
                    >
                        취소
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!newName.trim() || !newGroup.trim()}
                    className={`
                        w-full md:w-auto px-6 py-2 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[42px] flex items-center justify-center gap-2
                        ${editingId 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'}
                    `}
                >
                    {editingId ? <><Check size={18}/>수정 완료</> : '추가'}
                </button>
            </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 ml-1 flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            등록된 팀원 ({localMembers.length}명)
        </h3>
        
        {existingGroups.map(group => {
            const groupMembers = localMembers.filter(m => m.group === group);
            if (groupMembers.length === 0) return null;

            return (
                <div key={group} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex justify-between">
                        <span>{group}</span>
                        <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{groupMembers.length}명</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {groupMembers.map(member => (
                            <div key={member.id} className={`px-4 py-3 flex items-center justify-between transition-colors ${editingId === member.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                <span className={`font-medium ${editingId === member.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                                    {member.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEditClick(member)}
                                        className={`p-1.5 rounded-md transition-all ${editingId === member.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                        title="정보 수정"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                        title="목록에서 제거"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}

        {localMembers.length === 0 && (
            <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                팀원이 없습니다. 위에서 팀원을 추가해주세요.
            </div>
        )}
      </div>

      {/* Data Management Section */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            데이터 관리 (Danger Zone)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={handleClearSchedules}
                className="flex items-center justify-between px-5 py-4 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 rounded-xl transition-colors text-left"
            >
                <div>
                    <div className="font-bold text-sm">모든 업무 기록 삭제</div>
                    <div className="text-xs text-red-500/80 mt-1">팀원 목록은 유지되고 일지 기록만 삭제됩니다.</div>
                </div>
                <Trash2 size={20} />
            </button>

            <button
                onClick={handleFactoryReset}
                className="flex items-center justify-between px-5 py-4 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-left"
            >
                <div>
                    <div className="font-bold text-sm">앱 전체 초기화</div>
                    <div className="text-xs text-slate-500 mt-1">모든 데이터가 삭제되고 초기 상태로 돌아갑니다.</div>
                </div>
                <Database size={20} />
            </button>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-12"></div>

      {/* Floating Action Bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-40 transition-all duration-300 ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <button
            onClick={handleReset}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium text-sm"
        >
            <RotateCcw size={16} />
            초기화
        </button>
        <div className="w-px h-4 bg-slate-300"></div>
        <button
            onClick={handleSave}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm"
        >
            <Save size={18} />
            변경사항 저장 (DB반영)
        </button>
      </div>
    </div>
  );
};