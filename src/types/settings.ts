/**
 * Tipos para la página de configuración
 */

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface SettingItem {
  id: string;
  type: 'toggle' | 'select' | 'number' | 'text';
  label: string;
  description?: string;
  key: keyof SettingsData;
  options?: { value: string | number | boolean; label: string }[];
  min?: number;
  max?: number;
}

export interface SettingsData {
  // Tema
  theme: 'light' | 'dark' | 'system';

  // Notificaciones
  enableNotifications: boolean;
  autoRefresh: boolean;
  autoRefreshInterval: number;

  // Visualización
  defaultView: 'tablas' | 'tarjetas';
  itemsPerPage: number;

  // Datos
  includeRecordatorios: boolean;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Configuración general de la aplicación',
    icon: '⚙️',
  },
  {
    id: 'appearance',
    title: 'Apariencia',
    description: 'Personaliza el aspecto visual',
    icon: '🎨',
  },
  {
    id: 'data',
    title: 'Datos',
    description: 'Configuración de fuentes de datos',
    icon: '📊',
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Preferencias de alertas y actualizaciones',
    icon: '🔔',
  },
];
