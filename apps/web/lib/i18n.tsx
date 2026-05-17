'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar' | 'fr' | 'es' | 'pt';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.overview': 'Overview',
    'nav.dashboard': 'Dashboard',
    'nav.operations': 'Operations',
    'nav.screening': 'Screening',
    'nav.clients': 'Clients',
    'nav.cases': 'Cases',
    'nav.alerts': 'Alerts',
    'nav.intelligence': 'Intelligence',
    'nav.adverseMedia': 'Adverse Media',
    'nav.riskAnalytics': 'Risk Analytics',
    'nav.management': 'Management',
    'nav.reports': 'Reports',
    'nav.monitoring': 'Monitoring',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign out',
    'nav.systemOperational': 'System Operational',
    'settings.title': 'Settings',
    'settings.subtitle': 'Platform configuration and administration',
    'settings.org': 'Organization',
    'settings.apiKeys': 'API Keys',
    'settings.risk': 'Risk Scoring',
    'settings.notif': 'Notifications',
    'settings.team': 'Team Members',
    'settings.data': 'Data Sources',
    'settings.integ': 'Integrations',
    'settings.language': 'Platform Language',
  },
  ar: {
    'nav.overview': 'نظرة عامة',
    'nav.dashboard': 'لوحة القيادة',
    'nav.operations': 'العمليات',
    'nav.screening': 'الفحص',
    'nav.clients': 'العملاء',
    'nav.cases': 'الحالات',
    'nav.alerts': 'التنبيهات',
    'nav.intelligence': 'الاستخبارات',
    'nav.adverseMedia': 'الأخبار السلبية',
    'nav.riskAnalytics': 'تحليلات المخاطر',
    'nav.management': 'الإدارة',
    'nav.reports': 'التقارير',
    'nav.monitoring': 'المراقبة',
    'nav.settings': 'الإعدادات',
    'nav.signOut': 'تسجيل الخروج',
    'nav.systemOperational': 'النظام يعمل',
    'settings.title': 'الإعدادات',
    'settings.subtitle': 'تكوين المنصة والإدارة',
    'settings.org': 'المؤسسة',
    'settings.apiKeys': 'مفاتيح API',
    'settings.risk': 'تسجيل المخاطر',
    'settings.notif': 'التنبيهات',
    'settings.team': 'أعضاء الفريق',
    'settings.data': 'مصادر البيانات',
    'settings.integ': 'عمليات الدمج',
    'settings.language': 'لغة المنصة',
  },
  fr: {
    'nav.overview': 'Aperçu',
    'nav.dashboard': 'Tableau de bord',
    'nav.operations': 'Opérations',
    'nav.screening': 'Dépistage',
    'nav.clients': 'Clients',
    'nav.cases': 'Dossiers',
    'nav.alerts': 'Alertes',
    'nav.intelligence': 'Renseignement',
    'nav.adverseMedia': 'Médias défavorables',
    'nav.riskAnalytics': 'Analyse des risques',
    'nav.management': 'Gestion',
    'nav.reports': 'Rapports',
    'nav.monitoring': 'Surveillance',
    'nav.settings': 'Paramètres',
    'nav.signOut': 'Se déconnecter',
    'nav.systemOperational': 'Système opérationnel',
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Configuration et administration de la plateforme',
    'settings.org': 'Organisation',
    'settings.apiKeys': 'Clés API',
    'settings.risk': 'Évaluation des risques',
    'settings.notif': 'Notifications',
    'settings.team': 'Membres de l\'équipe',
    'settings.data': 'Sources de données',
    'settings.integ': 'Intégrations',
    'settings.language': 'Langue de la plateforme',
  },
  es: {
    'nav.overview': 'Resumen',
    'nav.dashboard': 'Panel de control',
    'nav.operations': 'Operaciones',
    'nav.screening': 'Filtrado',
    'nav.clients': 'Clientes',
    'nav.cases': 'Casos',
    'nav.alerts': 'Alertas',
    'nav.intelligence': 'Inteligencia',
    'nav.adverseMedia': 'Medios adversos',
    'nav.riskAnalytics': 'Análisis de riesgos',
    'nav.management': 'Gestión',
    'nav.reports': 'Informes',
    'nav.monitoring': 'Monitoreo',
    'nav.settings': 'Configuración',
    'nav.signOut': 'Cerrar sesión',
    'nav.systemOperational': 'Sistema operativo',
    'settings.title': 'Configuración',
    'settings.subtitle': 'Configuración y administración de la plataforma',
    'settings.org': 'Organización',
    'settings.apiKeys': 'Claves API',
    'settings.risk': 'Evaluación de riesgos',
    'settings.notif': 'Notificaciones',
    'settings.team': 'Miembros del equipo',
    'settings.data': 'Fuentes de datos',
    'settings.integ': 'Integraciones',
    'settings.language': 'Idioma de la plataforma',
  },
  pt: {
    'nav.overview': 'Visão Geral',
    'nav.dashboard': 'Painel de Controle',
    'nav.operations': 'Operações',
    'nav.screening': 'Triagem',
    'nav.clients': 'Clientes',
    'nav.cases': 'Casos',
    'nav.alerts': 'Alertas',
    'nav.intelligence': 'Inteligência',
    'nav.adverseMedia': 'Mídia Adversa',
    'nav.riskAnalytics': 'Análise de Risco',
    'nav.management': 'Gestão',
    'nav.reports': 'Relatórios',
    'nav.monitoring': 'Monitoramento',
    'nav.settings': 'Configurações',
    'nav.signOut': 'Sair',
    'nav.systemOperational': 'Sistema Operacional',
    'settings.title': 'Configurações',
    'settings.subtitle': 'Configuração e administração da plataforma',
    'settings.org': 'Organização',
    'settings.apiKeys': 'Chaves API',
    'settings.risk': 'Avaliação de Risco',
    'settings.notif': 'Notificações',
    'settings.team': 'Membros da Equipe',
    'settings.data': 'Fontes de Dados',
    'settings.integ': 'Integrações',
    'settings.language': 'Idioma da Plataforma',
  }
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem('complyarc_lang') as Language;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('complyarc_lang', lang);
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  };

  // Sync RTL on mount and when language changes
  useEffect(() => {
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', language);
    }
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const isRtl = language === 'ar';

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRtl }}>
      <div className={isRtl ? 'rtl-layout' : 'ltr-layout'} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
