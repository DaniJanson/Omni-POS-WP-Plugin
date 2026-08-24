import React, { useState, useRef, useEffect } from 'react';
import { usePosStore } from '../store/usePosStore';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { currentLanguage, languages, setLanguage } = usePosStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = languages.find(l => l.code === currentLanguage) || {
    code: currentLanguage || 'auto',
    label: currentLanguage === 'ka_GE' ? 'ქართული' : currentLanguage === 'en_US' ? 'English' : 'Language',
    flag: currentLanguage === 'ka_GE' ? '🇬🇪' : currentLanguage === 'en_US' ? '🇺🇸' : '🌐',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95"
        title="Change Language"
      >
        <span className="text-sm leading-none">{activeLang.flag}</span>
        {!compact && <span className="truncate max-w-[90px]">{activeLang.label}</span>}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-fadeIn text-xs">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            <span>Select POS Language</span>
          </div>

          <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                  currentLanguage === lang.code
                    ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-500/10'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
