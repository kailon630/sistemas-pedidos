import React, { useState, useEffect, useContext } from 'react';
import { 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  TrendingDown, 
  Trophy,
  Flame,
  User,
  Building,
  Calendar
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getPurchaseRequests } from '../api/admin';
import type { PurchaseRequest, PriorityLevel } from '../types/admin';
import PriorityButton from '../components/PriorityButton';

interface PriorityStats {
  urgent: number;
  high: number;
  normal: number;
  low: number;
  total: number;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-800',
    bgGradient: 'bg-gradient-to-r from-red-500 to-red-600',
    icon: <AlertCircle size={24} />
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800',
    bgGradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    icon: <TrendingUp size={24} />
  },
  normal: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-800',
    bgGradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: <Clock size={24} />
  },
  low: {
    label: 'Baixa',
    color: 'bg-gray-100 text-gray-800',
    bgGradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
    icon: <TrendingDown size={24} />
  }
};

const PriorityDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PriorityStats>({
    urgent: 0,
    high: 0,
    normal: 0,
    low: 0,
    total: 0
  });

  const isAdmin = user?.role === 'admin';

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getPurchaseRequests();
      const requestsData = response.data;
      
      setRequests(requestsData);
      
      // Calcular estatísticas
      const newStats = requestsData.reduce((acc, req) => {
        const priority = req.priority || 'normal';
        acc[priority] = (acc[priority] || 0) + 1;
        acc.total += 1;
        return acc;
      }, { urgent: 0, high: 0, normal: 0, low: 0, total: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar requisições por prioridade
  const getUrgentRequests = () => 
    requests.filter(req => req.priority === 'urgent').slice(0, 5);
  
  const getHighPriorityRequests = () => 
    requests.filter(req => req.priority === 'high').slice(0, 3);

  const handleRequestUpdate = (updatedRequest: PurchaseRequest) => {
    setRequests(prev => 
      prev.map(req => 
        req.ID === updatedRequest.ID ? updatedRequest : req
      )
    );
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando dashboard de prioridades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Flame className="mr-3 text-red-500" />
            Dashboard de Prioridades
          </h1>
          <p className="text-gray-600">Acompanhe e gerencie requisições prioritárias</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Alerta para requisições urgentes */}
      {stats.urgent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">
              ⚠️ <strong>Atenção:</strong> {stats.urgent} requisição(ões) marcada(s) como <strong>URGENTE</strong>! 
              Essas requisições precisam de atenção imediata.
            </span>
          </div>
        </div>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(Object.entries(PRIORITY_CONFIG) as [PriorityLevel, typeof PRIORITY_CONFIG[PriorityLevel]][]).map(([key, config]) => {
          const count = stats[key] || 0;
          const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
          
          return (
            <div key={key} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className={`${config.bgGradient} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg">
                    {config.icon}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{percentage.toFixed(1)}% do total</span>
                  <div className={`w-12 h-2 bg-gray-200 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full ${config.bgGradient}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Listas de requisições por prioridade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requisições Urgentes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">Requisições Urgentes</h2>
                  <p className="text-sm text-gray-600">{stats.urgent} requisições</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {stats.urgent}
              </span>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {getUrgentRequests().length > 0 ? (
              <div className="divide-y">
                {getUrgentRequests().map((request) => (
                  <div key={request.ID} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">#{request.ID}</span>
                          <PriorityButton
                            request={request}
                            onUpdate={handleRequestUpdate}
                            isAdmin={isAdmin}
                            size="small"
                            showDropdown={false}
                          />
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User size={14} className="mr-2" />
                            {request.requester?.name}
                          </div>
                          <div className="flex items-center">
                            <Building size={14} className="mr-2" />
                            {request.sector?.name}
                          </div>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {request.priorityNotes && (
                          <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                            <p className="text-xs text-red-700 italic">"{request.priorityNotes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma requisição urgente!</p>
                <p className="text-sm text-gray-400">Ótimo trabalho! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Requisições de Alta Prioridade */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">Alta Prioridade</h2>
                  <p className="text-sm text-gray-600">{stats.high} requisições</p>
                </div>
              </div>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {stats.high}
              </span>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {getHighPriorityRequests().length > 0 ? (
              <div className="divide-y">
                {getHighPriorityRequests().map((request) => (
                  <div key={request.ID} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">#{request.ID}</span>
                          <PriorityButton
                            request={request}
                            onUpdate={handleRequestUpdate}
                            isAdmin={isAdmin}
                            size="small"
                            showDropdown={false}
                          />
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User size={14} className="mr-2" />
                            {request.requester?.name}
                          </div>
                          <div className="flex items-center">
                            <Building size={14} className="mr-2" />
                            {request.sector?.name}
                          </div>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma requisição de alta prioridade</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityDashboard;