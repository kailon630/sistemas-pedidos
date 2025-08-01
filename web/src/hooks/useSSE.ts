import { useEffect, useRef, useState } from 'react';

interface UseSSEOptions {
  onMessage?: (data: string) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export const useSSE = (url: string, options: UseSSEOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxAttempts = options.maxReconnectAttempts || 5;

  const connect = () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      // EventSource não suporta headers customizados, então passamos o token via URL
      const urlWithToken = `${url}?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(urlWithToken);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        options.onOpen?.();
      };

      eventSource.onmessage = (event) => {
        options.onMessage?.(event.data);
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        setError('Erro na conexão SSE');
        options.onError?.(event);

        // Auto-reconnect
        if (options.autoReconnect && reconnectAttemptsRef.current < maxAttempts) {
          setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, 1000 * Math.pow(2, reconnectAttemptsRef.current)); // backoff exponencial
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError('Erro ao conectar SSE');
      console.error('SSE Error:', err);
    }
  };

  const disconnect = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsConnected(false);
  };

  useEffect(() => {
    connect();
    return disconnect;
  }, [url]);

  return {
    isConnected,
    error,
    reconnect: connect,
    disconnect,
  };
};