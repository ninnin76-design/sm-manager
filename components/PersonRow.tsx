
import React from 'react';
import { Person, TaskRecord } from '../types';
import { Check, AlertCircle, Lock } from 'lucide-react';

interface PersonRowProps {
  person: Person;
  record: TaskRecord;
  onChange: (id: string, field: keyof TaskRecord, value: any) => void;
  disabled?: boolean;
}

export const PersonRow: React.FC<PersonRowProps> = ({ person, record, onChange, disabled = false }) => {
  return (
    <div className={`
      flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200 relative
      ${record.completed ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200'}
      ${disabled ? 'opacity-70 grayscale-[0.3]' : 'hover:border-blue-300'}
    `}>
      {/* Name and Checkbox Area */}
      <label className={`flex items-center gap-4 select-none py-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={record.completed}
          onChange={(e) => !disabled && onChange(person.id, 'completed', e.target.checked)}
          disabled={disabled}
        />
        <div className={`
          flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-lg sm:rounded border-2 transition-colors flex items-center justify-center
          ${record.completed ? 'bg-green-500 border-green-500 shadow-sm' : 'border-slate-300 bg-white'}
          ${!disabled && !record.completed && 'peer-hover:border-blue-400'}
        `}>
          {record.completed && <Check size={20} className="text-white sm:w-4 sm:h-4" />}
        </div>
        <div className="flex flex-col">
            <span className={`font-semibold text-lg sm:text-base ${record.completed ? 'text-green-800' : 'text-slate-800'}`}>
            {person.name}
            </span>
            {person.zoneNumber && <span className="text-[10px] text-slate-400 font-mono leading-none">ID: {person.zoneNumber}</span>}
        </div>
      </label>

      {/* Remarks Input Area */}
      <div className="flex-1 w-full relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {disabled ? (
            <Lock size={14} className="text-slate-300" />
          ) : record.remarks ? (
            <AlertCircle size={16} className="text-amber-500" />
          ) : (
            <span className="text-slate-300 text-sm group-focus-within:text-blue-400 transition-colors">Memo</span>
          )}
        </div>
        <input
          type="text"
          value={record.remarks}
          onChange={(e) => onChange(person.id, 'remarks', e.target.value)}
          disabled={disabled}
          placeholder=""
          className={`
            w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border text-sm outline-none transition-all
            ${record.completed 
              ? 'bg-white/50 border-green-200 focus:border-green-400 placeholder-green-700/30' 
              : 'bg-slate-50 border-slate-200'}
            ${disabled 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent' 
                : 'focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}
          `}
        />
      </div>
    </div>
  );
};
