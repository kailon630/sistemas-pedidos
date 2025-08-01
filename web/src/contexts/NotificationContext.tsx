//src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { useSSE } from '../hooks/useSSE';
import type { Notification, NotificationSettings, NotificationStats, NotificationType } from '../types/notifications';

interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  stats: NotificationStats;
  isLoading: boolean;
  error: string | null;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_NOTIFICATIONS'; payload: Notification[] };

const defaultSettings: NotificationSettings = {
  enabled: true,
  types: {
    'new-product-request': { enabled: true, email: true, push: true, sound: true },
    'product-request-processed': { enabled: true, email: true, push: false, sound: true },
    'request-approved': { enabled: true, email: true, push: true, sound: true },
    'request-rejected': { enabled: true, email: true, push: true, sound: true },
    'request-completed': { enabled: true, email: false, push: true, sound: false },
    'budget-received': { enabled: true, email: false, push: true, sound: true },
    'item-received': { enabled: true, email: false, push: true, sound: false },
    'system': { enabled: true, email: false, push: true, sound: false },
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

const calculateStats = (notifications: Notification[]): NotificationStats => {
  const unread = notifications.filter(n => !n.read).length;
  const byType = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<NotificationType, number>);

  return {
    total: notifications.length,
    unread,
    byType,
  };
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications].slice(0, 100); // limita a 100
      return {
        ...state,
        notifications: newNotifications,
        stats: calculateStats(newNotifications),
      };
    }
    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        stats: calculateStats(updatedNotifications),
      };
    }
    case 'MARK_ALL_AS_READ': {
      const updatedNotifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications: updatedNotifications,
        stats: calculateStats(updatedNotifications),
      };
    }
    case 'REMOVE_NOTIFICATION': {
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filteredNotifications,
        stats: calculateStats(filteredNotifications),
      };
    }
    case 'CLEAR_ALL_NOTIFICATIONS': {
      return {
        ...state,
        notifications: [],
        stats: calculateStats([]),
      };
    }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_NOTIFICATIONS': {
      return {
        ...state,
        notifications: action.payload,
        stats: calculateStats(action.payload),
      };
    }
    default:
      return state;
  }
};

interface NotificationContextType extends NotificationState {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: NotificationSettings) => void;
  playSound: (type: NotificationType) => void;
  isSSEConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Parser de mensagens SSE
const parseSSEMessage = (message: string): Omit<Notification, 'id' | 'timestamp' | 'read'> | null => {
  try {
    const [type, ...parts] = message.split(':');
    
    switch (type) {
      case 'new-product-request':
        return {
          type: 'new-product-request',
          title: 'Nova Solicitação de Produto',
          message: `Nova solicitação de produto #${parts[0]} foi criada`,
          data: { requestId: parts[0] },
        };
      
      case 'product-request-processed':
        const status = parts[1] === 'approved' ? 'aprovada' : 'rejeitada';
        return {
          type: 'product-request-processed',
          title: `Solicitação ${status}`,
          message: `Sua solicitação de produto #${parts[0]} foi ${status}`,
          data: { requestId: parts[0], status: parts[1] },
        };
      
      case 'request-approved':
        return {
          type: 'request-approved',
          title: 'Requisição Aprovada',
          message: `Sua requisição #${parts[0]} foi aprovada`,
          data: { requestId: parts[0] },
        };
      
      case 'request-rejected':
        return {
          type: 'request-rejected',
          title: 'Requisição Rejeitada',
          message: `Sua requisição #${parts[0]} foi rejeitada`,
          data: { requestId: parts[0] },
        };
      
      default:
        return {
          type: 'system',
          title: 'Notificação do Sistema',
          message: message,
          data: { raw: message },
        };
    }
  } catch {
    return null;
  }
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    settings: defaultSettings,
    stats: { total: 0, unread: 0, byType: {} as Record<NotificationType, number> },
    isLoading: false,
    error: null,
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'SET_SETTINGS', payload: { ...defaultSettings, ...settings } });
      } catch {
        // Se der erro, usar configurações padrão
      }
    }

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const notifications = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: notifications });
      } catch {
        // Se der erro, começar sem notificações
      }
    }
  }, []);

  // Salvar notificações no localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(state.notifications));
  }, [state.notifications]);

  // SSE Connection
  const { isConnected: isSSEConnected } = useSSE(
    `${import.meta.env.VITE_API_URL || '/api/v1'}/notifications`,
    {
      onMessage: (message) => {
        if (!state.settings.enabled) return;
        
        const notification = parseSSEMessage(message);
        if (notification && state.settings.types[notification.type]?.enabled) {
          
          addNotification(notification);
          
          // Play sound se habilitado
          if (state.settings.types[notification.type]?.sound) {
            playSound(notification.type);
          }
        }
      },
      onError: () => {
        dispatch({ type: 'SET_ERROR', payload: 'Erro na conexão de notificações' });
      },
      autoReconnect: true,
    }
  );

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const fullNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  };

  const updateSettings = (settings: NotificationSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  };

  const playSound = (type: NotificationType) => {
    try {
      // Som diferente para cada tipo
      const soundMap: Record<NotificationType, string> = {
        'new-product-request': '/sounds/new-request.mp3',
        'product-request-processed': '/sounds/processed.mp3',
        'request-approved': '/sounds/approved.mp3',
        'request-rejected': '/sounds/rejected.mp3',
        'request-completed': '/sounds/completed.mp3',
        'budget-received': '/sounds/budget.mp3',
        'item-received': '/sounds/received.mp3',
        'system': '/sounds/system.mp3',
      };

      const audio = new Audio(soundMap[type] || '/sounds/default.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Falha silenciosa se não conseguir reproduzir
      });
    } catch {
      // Falha silenciosa
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        updateSettings,
        playSound,
        isSSEConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

