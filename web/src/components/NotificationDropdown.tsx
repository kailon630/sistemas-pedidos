
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  X,
  Package,
  ShoppingCart,
  AlertCircle,
  Info
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationType } from '../types/notifications';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    stats,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    isSSEConnected,
  } = useNotifications();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap: Record<NotificationType, React.ReactNode> = {
      'new-product-request': <Package size={16} className="text-blue-500" />,
      'product-request-processed': <Package size={16} className="text-green-500" />,
      'request-approved': <Check size={16} className="text-green-500" />,
      'request-rejected': <X size={16} className="text-red-500" />,
      'request-completed': <CheckCheck size={16} className="text-green-600" />,
      'budget-received': <ShoppingCart size={16} className="text-purple-500" />,
      'item-received': <Package size={16} className="text-indigo-500" />,
      'system': <Info size={16} className="text-gray-500" />,
    };
    return iconMap[type] || <Bell size={16} className="text-gray-500" />;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isOpen ? 'bg-blue-50' : 'hover:bg-gray-100'
        }`}
        title="Notificações"
      >
        {stats.unread > 0 ? (
          <BellRing size={20} className="text-blue-600" />
        ) : (
          <Bell size={20} className="text-gray-600" />
        )}
        
        {/* Badge */}
        {stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
        
        {/* Connection Status */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          isSSEConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Notificações</h3>
              <p className="text-sm text-gray-500">
                {stats.unread > 0 ? `${stats.unread} não lidas` : 'Tudo em dia'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to="/notifications/settings"
                className="p-1 rounded hover:bg-gray-200"
                title="Configurações"
                onClick={() => setIsOpen(false)}
              >
                <Settings size={16} className="text-gray-600" />
              </Link>
              
              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={16} className="text-blue-600" />
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Limpar todas"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              )}
            </div>
          </div>

          {/* Connection Status */}
          {!isSSEConnected && (
            <div className="px-4 py-2 bg-yellow-50 border-b">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Reconectando às notificações em tempo real...
                </span>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhuma notificação
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Você será notificado sobre atualizações importantes aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-25 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm ${
                              !notification.read ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 rounded hover:bg-gray-200"
                                title="Marcar como lida"
                              >
                                <Check size={14} className="text-blue-600" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 rounded hover:bg-gray-200"
                              title="Remover"
                            >
                              <X size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <Link
                to="/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Ver todas as notificações ({notifications.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;