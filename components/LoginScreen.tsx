
import React, { useState } from 'react';
import { ArrowRight, Lock, MapPin } from 'lucide-react';
import { Person } from '../types';

interface LoginScreenProps {
  members: Person[];
  onLogin: (user: Person | 'admin') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ members, onLogin }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();

    // 1. Check Admin Code
    if (value === '7788') {
      onLogin('admin');
      return;
    }

    // 2. Check Zone Number
    const foundMember = members.find(m => m.zoneNumber === value);
    if (foundMember) {
      onLogin(foundMember);
    } else {
      setError('올바르지 않은 구역번호 또는 비밀번호입니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold text-white">SM</span>
            </div>
            <h1 className="text-2xl font-bold text-white">SM관리 매니저</h1>
            <p className="text-blue-100 text-sm mt-2">구역번호를 입력하여 접속하세요.</p>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 ml-1">구역번호 또는 관리자 암호</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError('');
                            }}
                            placeholder="입력하세요"
                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all font-mono text-lg tracking-wide ${error ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                            autoFocus
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {inputValue.length === 4 && inputValue === '7788' ? <Lock size={18}/> : <MapPin size={18}/>}
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-500 ml-1 font-medium animate-pulse">{error}</p>}
                </div>

                <button 
                    type="submit"
                    className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                    <span>접속하기</span>
                    <ArrowRight size={18} />
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                    관리자 문의: 구역번호 분실 시 관리자에게 문의하세요.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
