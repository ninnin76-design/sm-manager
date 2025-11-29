import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, ArrowRight } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '7788') {
      onSuccess();
    } else {
      setError(true);
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Lock size={18} className="text-slate-500" />
            관리자 인증
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-slate-500">관리자 비밀번호를 입력하세요.</p>
          </div>
          
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="비밀번호 4자리"
              className={`w-full px-4 py-3 text-center text-lg tracking-widest border rounded-lg outline-none transition-all ${error ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              maxLength={4}
            />
            {error && <p className="text-xs text-red-500 text-center font-medium">비밀번호가 일치하지 않습니다.</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            <span>확인</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};