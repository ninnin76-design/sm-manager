
import React from 'react';
import { Person, TaskRecord } from '../types';
import { Check, AlertCircle } from 'lucide-react';

interface PersonRowProps {
  person: Person;
  record: TaskRecord;
  onChange: (id: string, field: keyof TaskRecord, value: any) => void;
}

export const PersonRow: React.FC<PersonRowProps> = ({ person, record, onChange }) => {
  return (
    <div className={`
      flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-200
      ${record.completed ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200 hover:border-blue-300'}
    `}>
      {/* Name and Checkbox Area */}
      <label className="flex items-center gap-4 cursor-pointer select-none py-1">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={record.completed}
          onChange={(e) => onChange(person.id, 'completed', e.target.checked)}
        />
        <div className={`
          flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-lg sm:rounded border-2 transition-colors flex items-center justify-center
          ${record.completed ? 'bg-green-500 border-green-500 shadow-sm' : 'border-slate-300 bg-white peer-hover:border-blue-400'}
        `}>
          {record.completed && <Check size={20} className="text-white sm:w-4 sm:h-4" />}
        </div>
        <span className={`font-semibold text-lg sm:text-base ${record.completed ? 'text-green-800' : 'text-slate-800'}`}>
          {person.name}
        </span>
      </label>

      {/* Remarks Input Area */}
      <div className="flex-1 w-full relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {record.remarks ? (
            <AlertCircle size={16} className="text-amber-500" />
          ) : (
            <span className="text-slate-300 text-sm group-focus-within:text-blue-400 transition-colors">Memo</span>
          )}
        </div>
        <input
          type="text"
          value={record.remarks}
          onChange={(e) => onChange(person.id, 'remarks', e.target.value)}
          placeholder=""
          className={`
            w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border text-sm outline-none transition-all
            ${record.completed 
              ? 'bg-white/50 border-green-200 focus:border-green-400 placeholder-green-700/30' 
              : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}
          `}
        />
      </div>
    </div>
  );
};
