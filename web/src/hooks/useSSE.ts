// src/hooks/useSSE.ts - Versão Corrigida
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseSSEOptions {
  onMessage?: (data: string) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: (attempt: number) => void; // ✅ Adicionado
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  debug?: boolean;
}

export interface SSEStats { // ✅ Renomeado para consistência
  connectionAttempts: number;
  messagesReceived: number;
  lastMessageTime: Date | null;
  connectionDuration: number;
  reconnectAttempts: number;
}

// ✅ Tipo de retorno explícito e completo
export interface UseSSEReturn {
  isConnected: boolean;
  isReconnecting: boolean; // ✅ Adicionado
  error: string | null;
  tokenAvailable: boolean;
  stats: SSEStats; // ✅ Adicionado
  reconnect: () => void;
  disconnect: () => void;
  resetStats: () => void; // ✅ Adicionado
}

export const useSSE = (url: string, options: UseSSEOptions = {}): UseSSEReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false); // ✅ Adicionado
  const [error, setError] = useState<string | null>(null);
  const [tokenAvailable, setTokenAvailable] = useState(false);

  // ✅ Refs internas ao hook
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectionStartRef = useRef<Date | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ Estado de estatísticas
  const [stats, setStats] = useState<SSEStats>({
    connectionAttempts: 0,
    messagesReceived: 0,
    lastMessageTime: null,
    connectionDuration: 0,
    reconnectAttempts: 0,
  });

  const maxAttempts = options.maxReconnectAttempts ?? 10;
  const reconnectInterval = options.reconnectInterval ?? 1000;
  const debug = options.debug ?? false;

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[SSE] ${message}`, ...args);
    }
  }, [debug]);

  const checkToken = useCallback((): boolean => {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    const available = !!token;
    setTokenAvailable(available);
    return available;
  }, []);

  const updateConnectionDuration = useCallback(() => {
    if (connectionStartRef.current && isConnected) {
      const duration = Date.now() - connectionStartRef.current.getTime();
      setStats(prev => ({ ...prev, connectionDuration: duration }));
    }
  }, [isConnected]);

  const connect = useCallback(() => {
    try {
      log('Tentando conectar...');
      
      // Verificar token
      if (!checkToken()) {
        log('Token não disponível, aguardando...');
        setError('Aguardando autenticação...');
        return;
      }

      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken');

      if (!token) {
        log('Token não encontrado após verificação');
        setError('Token não encontrado');
        return;
      }

      // Limpar timers anteriores
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Fechar conexão anterior
      if (eventSourceRef.current) {
        log('Fechando conexão anterior');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Atualizar estatísticas
      setStats(prev => ({ 
        ...prev, 
        connectionAttempts: prev.connectionAttempts + 1 
      }));

      const urlWithToken = `${url}?token=${encodeURIComponent(token)}`;
      log('Conectando em:', urlWithToken);

      const es = new EventSource(urlWithToken);
      connectionStartRef.current = new Date();

      es.onopen = (ev) => {
        log('Conexão estabelecida!', ev);
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        setStats(prev => ({ ...prev, reconnectAttempts: 0 }));
        options.onOpen?.();
      };

      // Eventos específicos
      es.addEventListener('connected', (ev) => {
        log('Evento conectado:', (ev as MessageEvent).data);
        options.onConnected?.();
      });

      es.addEventListener('message', (ev) => {
        const data = (ev as MessageEvent).data;
        log('Mensagem recebida:', data);
        setStats(prev => ({ 
          ...prev, 
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }));
        options.onMessage?.(data);
      });

      es.addEventListener('ping', (ev) => {
        log('Ping recebido:', (ev as MessageEvent).data);
        // Ping recebido, conexão está ativa
      });

      es.addEventListener('timeout', (ev) => {
        log('Timeout recebido:', (ev as MessageEvent).data);
        setError('Conexão expirou');
        reconnect();
      });

      es.addEventListener('disconnected', (ev) => {
        log('Desconectado pelo servidor:', (ev as MessageEvent).data);
        setIsConnected(false);
        options.onDisconnected?.();
      });

      es.onerror = (ev) => {
        log('Erro na conexão:', ev);
        setIsConnected(false);
        setError('Erro na conexão SSE');
        options.onError?.(ev);

        // Auto-reconnect com backoff exponencial
        if (options.autoReconnect && stats.reconnectAttempts < maxAttempts && checkToken()) {
          setIsReconnecting(true);
          const nextAttempt = stats.reconnectAttempts + 1;
          options.onReconnecting?.(nextAttempt);
          
          const delay = Math.min(
            reconnectInterval * Math.pow(2, stats.reconnectAttempts), 
            30000
          );
          
          log(`Reconectando em ${delay}ms (${nextAttempt}/${maxAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setStats(prev => ({ 
              ...prev, 
              reconnectAttempts: nextAttempt 
            }));
            connect();
          }, delay);
        } else {
          log('Parando tentativas de reconexão');
          setIsReconnecting(false);
        }
      };

      eventSourceRef.current = es;

      // Iniciar atualização de duração
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      statsIntervalRef.current = setInterval(updateConnectionDuration, 1000);

    } catch (err) {
      log('Erro ao conectar:', err);
      setError('Erro ao conectar SSE');
    }
  }, [url, options, stats.reconnectAttempts, maxAttempts, reconnectInterval, checkToken, log, updateConnectionDuration]);

  const disconnect = useCallback(() => {
    log('Desconectando...');
    
    // Limpar timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    
    // Fechar EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
    setError(null);
    connectionStartRef.current = null;
  }, [log]);

  const reconnect = useCallback(() => {
    log('Forçando reconexão...');
    disconnect();
    setTimeout(connect, 1000);
  }, [log, disconnect, connect]);

  const resetStats = useCallback(() => {
    setStats({
      connectionAttempts: 0,
      messagesReceived: 0,
      lastMessageTime: null,
      connectionDuration: 0,
      reconnectAttempts: 0,
    });
  }, []);

  // Conectar/desconectar quando a URL muda
  useEffect(() => {
    connect();
    return disconnect;
  }, [url]); // Removido connect e disconnect das dependências para evitar loops

  // Verificar token periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (checkToken() && !isConnected && !isReconnecting) {
        log('Token detectado, tentando conectar...');
        connect();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, isReconnecting, checkToken, connect, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // ✅ Retorno completo com todas as propriedades
  return {
    isConnected,
    isReconnecting,
    error,
    tokenAvailable,
    stats,
    reconnect,
    disconnect,
    resetStats,
  };
};