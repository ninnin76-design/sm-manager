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
      flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border transition-all duration-200
      ${record.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-blue-300'}
    `}>
      {/* Name and Checkbox Area */}
      <div className="flex items-center gap-4 min-w-[150px]">
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={record.completed}
            onChange={(e) => onChange(person.id, 'completed', e.target.checked)}
          />
          <div className={`
            w-6 h-6 rounded border-2 transition-colors flex items-center justify-center
            ${record.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white peer-hover:border-blue-400'}
          `}>
            {record.completed && <Check size={16} className="text-white" />}
          </div>
        </label>
        <span className={`font-medium text-lg ${record.completed ? 'text-green-800' : 'text-slate-700'}`}>
          {person.name}
        </span>
      </div>

      {/* Remarks Input Area */}
      <div className="flex-1 w-full sm:w-auto relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {record.remarks ? (
            <AlertCircle size={16} className="text-amber-500" />
          ) : (
            <span className="text-slate-400 text-sm">Memo</span>
          )}
        </div>
        <input
          type="text"
          value={record.remarks}
          onChange={(e) => onChange(person.id, 'remarks', e.target.value)}
          placeholder="특이사항이나 사유를 입력하세요..."
          className={`
            w-full pl-10 pr-4 py-2 rounded-md border text-sm outline-none transition-all
            ${record.completed 
              ? 'bg-green-50/50 border-green-200 focus:border-green-400 placeholder-green-700/30' 
              : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}
          `}
        />
      </div>
    </div>
  );
};