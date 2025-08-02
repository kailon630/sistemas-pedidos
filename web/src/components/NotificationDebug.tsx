import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../api/client';

interface TestNotificationResponse {
  clients: number;
  stats: {
    total: number;
    by_role: Record<string, number>;
    clients: Array<{
      id: string;
      user_name: string;
      role: string;
      connected: string;
      last_ping: string;
    }>;
  };
}

const NotificationDebug: React.FC = () => {
  const { 
    isSSEConnected, 
    isSSEReconnecting,
    stats, 
    connectionStats,
    sseStats,
    reconnectSSE,
    settings,
    playSound 
  } = useNotifications();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [serverStats, setServerStats] = useState<TestNotificationResponse['stats'] | null>(null);

  const testNotification = async () => {
    try {
      console.log('🧪 Testando notificação...');
      const response = await api.get<TestNotificationResponse>(
        '/test-notification?message=Teste manual do frontend'
      );
      console.log('✅ Teste enviado:', response.data);
      setServerStats(response.data.stats);
      alert(`Notificação enviada para ${response.data.clients} clientes`);
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert('Erro ao enviar notificação de teste');
    }
  };

  const getServerStats = async () => {
    try {
        const { data } = await api.get<TestNotificationResponse['stats']>(
        '/notifications/stats'
        );
        setServerStats(data);
        console.log('📊 Estatísticas do servidor:', data);
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
    }
 };

  const testTargetedNotification = async () => {
    try {
      const response = await api.post('/notifications/send', {
        user_ids: [], // Vazio = broadcast
        type: 'system',
        title: 'Teste Direcionado',
        message: 'Esta é uma notificação de teste direcionada'
      });
      console.log('✅ Notificação direcionada enviada:', response.data);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação direcionada:', error);
    }
  };

  const checkToken = () => {
    const tokens = {
      accessToken: !!localStorage.getItem('accessToken'),
      token: !!localStorage.getItem('token'),
      authToken: !!localStorage.getItem('authToken'),
    };
    console.log('🔍 Tokens no localStorage:', tokens);
    alert(`Tokens encontrados: ${Object.entries(tokens)
      .filter(([,v]) => v)
      .map(([k]) => k)
      .join(', ') || 'Nenhum'}`);
  };

  const testSound = () => {
    playSound('system');
  };

  const clearLocalData = () => {
    localStorage.removeItem('notifications');
    localStorage.removeItem('notificationSettings');
    alert('Dados locais limpos. Recarregue a página.');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getConnectionStatus = () => {
    if (isSSEConnected) return { text: '🟢 Conectado', color: 'text-green-600' };
    if (isSSEReconnecting) return { text: '🟡 Reconectando...', color: 'text-yellow-600' };
    return { text: '🔴 Desconectado', color: 'text-red-600' };
  };

  const status = getConnectionStatus();

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg z-50 max-w-sm">
      {/* Header Compacto */}
      <div 
        className="p-3 cursor-pointer flex items-center justify-between bg-gray-50 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold">🔧 Debug Notificações</span>
          <span className={`text-xs ${status.color}`}>{status.text}</span>
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {/* Status da Conexão */}
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-gray-700">Conexão SSE</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={status.color}>{status.text.split(' ')[1]}</span>
              </div>
              <div className="flex justify-between">
                <span>Tentativas:</span>
                <span>{sseStats?.connectionAttempts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Duração:</span>
                <span>{formatDuration(connectionStats.connectionDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mensagens:</span>
                <span>{connectionStats.messagesReceived}</span>
              </div>
            </div>
          </div>

          {/* Estatísticas de Notificações */}
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-gray-700">Notificações</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Não lidas:</span>
                <span className="font-bold text-red-600">{stats.unread}</span>
              </div>
              <div className="flex justify-between">
                <span>Habilitadas:</span>
                <span className={settings.enabled ? 'text-green-600' : 'text-red-600'}>
                  {settings.enabled ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Última msg:</span>
                <span className="text-xs">
                  {connectionStats.lastMessageTime 
                    ? connectionStats.lastMessageTime.toLocaleTimeString()
                    : 'Nunca'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Estatísticas do Servidor */}
          {serverStats && (
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-gray-700">Servidor</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Clientes:</span>
                  <span>{serverStats.total}</span>
                </div>
                {Object.entries(serverStats.by_role).map(([role, count]) => (
                  <div key={role} className="flex justify-between pl-2">
                    <span className="capitalize">{role}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={testNotification}
                className="bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600"
              >
                🧪 Teste
              </button>
              <button
                onClick={getServerStats}
                className="bg-purple-500 text-white text-xs py-1 px-2 rounded hover:bg-purple-600"
              >
                📊 Stats
              </button>
              <button
                onClick={testSound}
                className="bg-green-500 text-white text-xs py-1 px-2 rounded hover:bg-green-600"
              >
                🔊 Som
              </button>
              <button
                onClick={checkToken}
                className="bg-yellow-500 text-white text-xs py-1 px-2 rounded hover:bg-yellow-600"
              >
                🔍 Token
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={testTargetedNotification}
                className="bg-indigo-500 text-white text-xs py-1 px-2 rounded hover:bg-indigo-600"
              >
                🎯 Teste Direcionado
              </button>
              <button
                onClick={reconnectSSE}
                className="bg-orange-500 text-white text-xs py-1 px-2 rounded hover:bg-orange-600"
              >
                🔄 Reconectar
              </button>
              <button
                onClick={clearLocalData}
                className="bg-red-500 text-white text-xs py-1 px-2 rounded hover:bg-red-600"
              >
                🗑️ Limpar Dados
              </button>
            </div>
          </div>

          {/* Tipos de Notificação Habilitados */}
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-gray-700">Tipos Habilitados</h4>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {Object.entries(settings.types).map(([type, config]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="truncate text-xs">{type}</span>
                  <div className="flex space-x-1">
                    <span className={config.enabled ? 'text-green-600' : 'text-red-600'}>
                      {config.enabled ? '✓' : '✗'}
                    </span>
                    <span className={config.sound ? 'text-blue-600' : 'text-gray-400'}>
                      🔊
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDebug;