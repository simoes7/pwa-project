import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' }
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            i18n.language === lang.code
              ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm scale-105'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="text-sm">{lang.flag}</span>
          <span className={i18n.language === lang.code ? 'block' : 'hidden md:block'}>{lang.name}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
