// src/contexts/NotificationContext.tsx - Versão Melhorada
import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { useSSE } from '../hooks/useSSE';
import type { Notification, NotificationSettings, NotificationStats, NotificationType } from '../types/notifications';

interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  stats: NotificationStats;
  isLoading: boolean;
  error: string | null;
  connectionStats: {
    messagesReceived: number;
    lastMessageTime: Date | null;
    connectionDuration: number;
  };
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
  | { type: 'LOAD_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'UPDATE_CONNECTION_STATS'; payload: Partial<NotificationState['connectionStats']> };

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

const isQuietHours = (settings: NotificationSettings): boolean => {
  if (!settings.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  const { start, end } = settings.quietHours;
  
  if (start <= end) {
    return currentTime >= start && currentTime <= end;
  } else {
    // Atravessa meia-noite
    return currentTime >= start || currentTime <= end;
  }
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications].slice(0, 100);
      return { 
        ...state, 
        notifications: newNotifications, 
        stats: calculateStats(newNotifications) 
      };
    }
    case 'MARK_AS_READ': {
      const updated = state.notifications.map(n => 
        n.id === action.payload ? { ...n, read: true } : n
      );
      return { 
        ...state, 
        notifications: updated, 
        stats: calculateStats(updated) 
      };
    }
    case 'MARK_ALL_AS_READ': {
      const updated = state.notifications.map(n => ({ ...n, read: true }));
      return { 
        ...state, 
        notifications: updated, 
        stats: calculateStats(updated) 
      };
    }
    case 'REMOVE_NOTIFICATION': {
      const filtered = state.notifications.filter(n => n.id !== action.payload);
      return { 
        ...state, 
        notifications: filtered, 
        stats: calculateStats(filtered) 
      };
    }
    case 'CLEAR_ALL_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: [], 
        stats: calculateStats([]) 
      };
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
        stats: calculateStats(action.payload) 
      };
    }
    case 'UPDATE_CONNECTION_STATS':
      return {
        ...state,
        connectionStats: { ...state.connectionStats, ...action.payload }
      };
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
  isSSEReconnecting: boolean;
  sseStats: any;
  reconnectSSE: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Parser SSE melhorado e robusto
const parseSSEMessage = (message: string): Omit<Notification, 'id' | 'timestamp' | 'read'> | null => {
  try {
    console.log('🔍 Parseando mensagem SSE:', message);
    
    // Tentar parsear como JSON primeiro (formato estruturado)
    if (message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message);
        return {
          type: parsed.type || 'system',
          title: parsed.title || 'Notificação',
          message: parsed.message || message,
          data: parsed.data || {},
        };
      } catch {
        // Fallback para parsing manual
      }
    }

    // Parsing manual para formato string
    if (message.startsWith('test:')) {
      return {
        type: 'system',
        title: 'Teste de Notificação',
        message: message.replace('test:', ''),
        data: { test: true },
      };
    }

    const parts = message.split(':');
    const type = parts[0];
    
    switch (type) {
      case 'new-request':
        return {
          type: 'system',
          title: 'Nova Requisição',
          message: `Nova requisição #${parts[1]} foi criada`,
          data: { requestId: parts[1] },
        };
        
      case 'complete-request':
        return {
          type: 'request-completed',
          title: 'Requisição Concluída',
          message: `Requisição #${parts[1]} foi concluída`,
          data: { requestId: parts[1] },
        };
        
      case 'review-request': {
        const status = parts[2] === 'approved' ? 'aprovada' : 
                      parts[2] === 'rejected' ? 'rejeitada' : 'processada';
        return {
          type: parts[2] === 'approved' ? 'request-approved' : 'request-rejected',
          title: `Requisição ${status}`,
          message: `Sua requisição #${parts[1]} foi ${status}`,
          data: { requestId: parts[1], status: parts[2] },
        };
      }
      
      case 'new-product-request':
        return {
          type: 'new-product-request',
          title: 'Nova Solicitação de Produto',
          message: `Nova solicitação de produto #${parts[1]} foi criada`,
          data: { requestId: parts[1] },
        };
        
      case 'product-request-processed': {
        const productStatus = parts[2] === 'approved' ? 'aprovada' : 'rejeitada';
        return {
          type: 'product-request-processed',
          title: `Solicitação ${productStatus}`,
          message: `Sua solicitação de produto #${parts[1]} foi ${productStatus}`,
          data: { requestId: parts[1], status: parts[2] },
        };
      }
      
      default:
        console.warn('⚠️ Tipo de notificação desconhecido:', type);
        return {
          type: 'system',
          title: 'Notificação do Sistema',
          message: parts.slice(1).join(':') || message,
          data: { raw: message },
        };
    }
  } catch (error) {
    console.error('❌ Erro ao parsear mensagem SSE:', error);
    return {
      type: 'system',
      title: 'Erro de Notificação',
      message: 'Mensagem malformada recebida',
      data: { error: true, raw: message },
    };
  }
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    settings: defaultSettings,
    stats: { 
      total: 0, 
      unread: 0, 
      byType: {
        'new-product-request': 0,
        'product-request-processed': 0,
        'request-approved': 0,
        'request-rejected': 0,
        'request-completed': 0,
        'budget-received': 0,
        'item-received': 0,
        system: 0
      } 
    },
    isLoading: false,
    error: null,
    connectionStats: {
      messagesReceived: 0,
      lastMessageTime: null,
      connectionDuration: 0,
    },
  });

  // Carregar configurações salvas
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'SET_SETTINGS', payload: { ...defaultSettings, ...settings } });
      }
      
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const nots = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: nots });
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
  }, []);

  // Salvar notificações
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
    }
  }, [state.notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const full: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: full });
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  const updateSettings = useCallback((settings: NotificationSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }, []);

  const playSound = useCallback((type: NotificationType) => {
    try {
      // Verificar se som está habilitado globalmente e para o tipo
      if (!state.settings.types[type]?.sound) return;
      
      // Verificar horário silencioso
      if (isQuietHours(state.settings)) {
        console.log('🔇 Horário silencioso ativo, som desabilitado');
        return;
      }

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
      audio.play().catch((error) => {
        console.warn('Erro ao reproduzir som:', error);
      });
    } catch (error) {
      console.error('Erro no sistema de som:', error);
    }
  }, [state.settings]);

  // SSE Connection com logs e métricas melhoradas
  const {
    isConnected: isSSEConnected,
    isReconnecting: isSSEReconnecting,
    stats: sseStats,
    reconnect: reconnectSSE,
  } = useSSE(
    `${import.meta.env.VITE_API_URL || '/api/v1'}/notifications`,
    {
      onConnected: () => {
        console.log('🔔 Sistema de notificações conectado');
        dispatch({ type: 'SET_ERROR', payload: null });
      },
      onOpen: () => {
        console.log('📡 Conexão SSE estabelecida');
        dispatch({ type: 'SET_ERROR', payload: null });
      },
      onMessage: (message: string) => {
        console.log('🔔 Notificação recebida:', message);
        
        // Atualizar estatísticas de conexão
        dispatch({
          type: 'UPDATE_CONNECTION_STATS',
          payload: {
            messagesReceived: state.connectionStats.messagesReceived + 1,
            lastMessageTime: new Date(),
          },
        });
        
        if (!state.settings.enabled) {
          console.log('🔕 Notificações desabilitadas globalmente');
          return;
        }
        
        const notification = parseSSEMessage(message);
        if (notification && state.settings.types[notification.type]?.enabled) {
          console.log('✅ Processando notificação:', notification);
          
          // Verificar horário silencioso para push notifications
          if (isQuietHours(state.settings) && !state.settings.types[notification.type]?.push) {
            console.log('🔇 Horário silencioso ativo, notificação visual desabilitada');
            return;
          }
          
          addNotification(notification);
          
          // Som se habilitado
          if (state.settings.types[notification.type]?.sound) {
            playSound(notification.type);
          }
        } else {
          console.log('⏭️ Notificação ignorada:', { 
            notification, 
            typeEnabled: notification ? state.settings.types[notification.type]?.enabled : false 
          });
        }
      },
      onError: (error: Event) => {
        console.error('❌ Erro SSE:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erro na conexão de notificações' });
      },
      onReconnecting: (attempt: number) => {
        console.log(`🔄 Reconectando SSE... tentativa ${attempt}`);
        dispatch({ type: 'SET_ERROR', payload: `Reconectando... (${attempt})` });
      },
      autoReconnect: true,
      maxReconnectAttempts: 10,
      debug: import.meta.env.DEV, // Debug apenas em desenvolvimento
    }
  );

  // Atualizar duração da conexão
  useEffect(() => {
    if (sseStats) {
      dispatch({
        type: 'UPDATE_CONNECTION_STATS',
        payload: { connectionDuration: sseStats.connectionDuration },
      });
    }
  }, [sseStats]);

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
        isSSEReconnecting,
        sseStats,
        reconnectSSE,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};