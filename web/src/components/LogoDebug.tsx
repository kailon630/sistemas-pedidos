// src/components/LogoDebug.tsx - Componente para debug do logo
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import settingsApi from '../api/settings';
import type { CompanySettings } from '../types/settings';

const LogoDebug: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [logoExists, setLogoExists] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      // 1. Buscar configurações
      const settingsResponse = await settingsApi.getCompanySettings();
      setSettings(settingsResponse.data);

      // 2. Verificar se logo existe
      const exists = await settingsApi.checkLogoExists();
      setLogoExists(exists);

      setLastCheck(new Date());
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getLogoStatus = () => {
    if (!settings) return { icon: AlertTriangle, color: 'text-gray-500', text: 'Carregando...' };
    
    if (!settings.LogoPath) {
      return { icon: XCircle, color: 'text-red-500', text: 'Nenhum logo configurado' };
    }
    
    if (logoExists === null) {
      return { icon: AlertTriangle, color: 'text-yellow-500', text: 'Verificando...' };
    }
    
    if (logoExists) {
      return { icon: CheckCircle, color: 'text-green-500', text: 'Logo funcionando' };
    }
    
    return { icon: XCircle, color: 'text-red-500', text: 'Logo não encontrado' };
  };

  const status = getLogoStatus();
  const StatusIcon = status.icon;

  return (
    <div className="fixed bottom-20 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🖼️ Debug Logo</h3>
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {/* Status Geral */}
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} className={status.color} />
          <span className={status.color}>{status.text}</span>
        </div>

        {/* Detalhes das Configurações */}
        {settings && (
          <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
            <div><strong>Empresa:</strong> {settings.CompanyName}</div>
            {settings.LogoPath && (
              <>
                <div><strong>Arquivo:</strong> {settings.LogoFilename || 'N/A'}</div>
                <div><strong>Path:</strong> {settings.LogoPath}</div>
              </>
            )}
            <div><strong>URL:</strong> 
              <a 
                href={settingsApi.getCompanyLogoUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1 break-all"
              >
                {settingsApi.getCompanyLogoUrl()}
              </a>
            </div>
          </div>
        )}

        {/* Testes */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Configuração existe:</span>
            <span className={settings ? 'text-green-600' : 'text-red-600'}>
              {settings ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Logo configurado:</span>
            <span className={settings?.LogoPath ? 'text-green-600' : 'text-red-600'}>
              {settings?.LogoPath ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Arquivo acessível:</span>
            <span className={logoExists ? 'text-green-600' : logoExists === false ? 'text-red-600' : 'text-yellow-600'}>
              {logoExists === null ? '?' : logoExists ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-1 pt-2 border-t">
          <button
            onClick={() => window.open(settingsApi.getCompanyLogoUrl(true), '_blank')}
            className="w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600"
            disabled={!settings?.LogoPath}
          >
            🔗 Abrir Logo
          </button>
          <button
            onClick={() => {
              if (settings) {
                console.log('Settings:', settings);
                console.log('Logo URL:', settingsApi.getCompanyLogoUrl());
                console.log('Logo exists:', logoExists);
              }
            }}
            className="w-full bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600"
          >
            📋 Log Console
          </button>
        </div>

        {/* Último Check */}
        {lastCheck && (
          <div className="text-xs text-gray-500 pt-1 border-t">
            Último check: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Problemas Comuns */}
        {!logoExists && settings?.LogoPath && (
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
            <strong>Possíveis soluções:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verificar se o endpoint GET é público</li>
              <li>Verificar se o arquivo existe no servidor</li>
              <li>Limpar cache do navegador</li>
              <li>Fazer novo upload do logo</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoDebug;