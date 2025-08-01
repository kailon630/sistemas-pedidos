import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, Volume2, Clock, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationSettings, NotificationType } from '../types/notifications';

const NotificationSettingsPage: React.FC = () => {
  const { settings, updateSettings, stats } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings));
  }, [localSettings, settings]);

  const notificationTypeLabels: Record<NotificationType, string> = {
    'new-product-request': 'Nova solicitação de produto',
    'product-request-processed': 'Solicitação de produto processada',
    'request-approved': 'Requisição aprovada',
    'request-rejected': 'Requisição rejeitada',
    'request-completed': 'Requisição concluída',
    'budget-received': 'Nova cotação recebida',
    'item-received': 'Item recebido',
    'system': 'Notificações do sistema',
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      updateSettings(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const updateTypeSettings = (type: NotificationType, key: keyof NotificationSettings['types'][NotificationType], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: {
          ...prev.types[type],
          [key]: value,
        },
      },
    }));
  };

  const toggleAllTypes = (enabled: boolean) => {
    const updatedTypes = { ...localSettings.types };
    Object.keys(updatedTypes).forEach(type => {
      updatedTypes[type as NotificationType].enabled = enabled;
    });
    setLocalSettings(prev => ({ ...prev, types: updatedTypes }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Notificações</h1>
          <p className="text-sm text-gray-600 mt-1">
            Personalize como e quando você deseja receber notificações
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
            <div className="text-sm text-gray-500">Não lidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total - stats.unread}</div>
            <div className="text-sm text-gray-500">Lidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(stats.byType).length}
            </div>
            <div className="text-sm text-gray-500">Tipos</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações Gerais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ativar/Desativar */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Notificações</h2>
                <p className="text-sm text-gray-600">
                  Controle geral das notificações do sistema
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.enabled}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Tipos de Notificação */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tipos de Notificação</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleAllTypes(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ativar todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => toggleAllTypes(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Desativar todas
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(localSettings.types).map(([type, typeSettings]) => (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {notificationTypeLabels[type as NotificationType]}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stats.byType[type as NotificationType] || 0} recebidas
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={typeSettings.enabled}
                        onChange={(e) => updateTypeSettings(
                          type as NotificationType, 
                          'enabled', 
                          e.target.checked
                        )}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {typeSettings.enabled && (
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeSettings.email}
                          onChange={(e) => updateTypeSettings(
                            type as NotificationType,
                            'email',
                            e.target.checked
                          )}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeSettings.push}
                          onChange={(e) => updateTypeSettings(
                            type as NotificationType,
                            'push',
                            e.target.checked
                          )}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <Bell size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">Push</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeSettings.sound}
                          onChange={(e) => updateTypeSettings(
                            type as NotificationType,
                            'sound',
                            e.target.checked
                          )}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <Volume2 size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">Som</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="space-y-6">
          {/* Frequência */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock size={20} className="text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900">Frequência</h2>
            </div>

            <div className="space-y-3">
              {[
                { value: 'immediate', label: 'Imediata' },
                { value: 'hourly', label: 'A cada hora' },
                { value: 'daily', label: 'Diariamente' },
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={localSettings.frequency === option.value}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      frequency: e.target.value as 'immediate' | 'hourly' | 'daily'
                    }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Horário Silencioso */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Moon size={20} className="text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900">Modo Silencioso</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.quietHours.enabled}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: e.target.checked }
                  }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Ativar modo silencioso</span>
              </label>

              {localSettings.quietHours.enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      value={localSettings.quietHours.start}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={localSettings.quietHours.end}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          {hasChanges && (
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;