// src/pages/RequestersPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, Mail, Building, Calendar, FileText } from 'lucide-react';
import { getRequesters, type Requester } from '../api/requesters';

const RequestersPage: React.FC = () => {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<number | 'all'>('all');

  // Extrair setores únicos dos solicitantes para filtro
  const uniqueSectors = Array.from(
    new Set(requesters.map(r => r.Sector?.ID).filter(Boolean))
  ).map(id => requesters.find(r => r.Sector?.ID === id)?.Sector).filter(Boolean);

  useEffect(() => {
    loadRequesters();
  }, []);

  const loadRequesters = async () => {
    try {
      setLoading(true);
      const response = await getRequesters();
      setRequesters(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitantes:', error);
      setRequesters([]);
      alert('Erro ao carregar solicitantes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequesters = requesters.filter(requester => {
    if (!requester) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (requester.Name && requester.Name.toLowerCase().includes(searchLower)) ||
      (requester.Email && requester.Email.toLowerCase().includes(searchLower)) ||
      (requester.Sector?.Name && requester.Sector.Name.toLowerCase().includes(searchLower));
    
    const matchesSector = sectorFilter === 'all' || requester.SectorID === sectorFilter;
    
    return matchesSearch && matchesSector;
  });

  // Calcular estatísticas por setor
  const sectorStats = uniqueSectors.map(sector => ({
    sector,
    count: requesters.filter(r => r.SectorID === sector?.ID).length
  })).sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitantes</h1>
          <p className="text-gray-600">
            Gerencie os usuários solicitantes do sistema
          </p>
        </div>
        <Link
          to="/requesters/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Novo Solicitante</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Solicitantes</p>
              <p className="text-2xl font-bold text-gray-900">{requesters.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Setores Ativos</p>
              <p className="text-2xl font-bold text-green-600">{uniqueSectors.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Building className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Criados Este Mês</p>
              <p className="text-2xl font-bold text-purple-600">
                {requesters.filter(r => {
                  const created = new Date(r.CreatedAt);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Média por Setor</p>
              <p className="text-2xl font-bold text-orange-600">
                {uniqueSectors.length > 0 ? Math.round(requesters.length / uniqueSectors.length) : 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Setores</option>
            {uniqueSectors.map(sector => (
              <option key={sector?.ID} value={sector?.ID}>{sector?.Name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSectorFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Sector Distribution - Se há mais de um setor */}
      {uniqueSectors.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Distribuição por Setor</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorStats.map(({ sector, count }) => (
                <div key={sector?.ID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{sector?.Name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count} {count === 1 ? 'solicitante' : 'solicitantes'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Requesters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequesters.map((requester) => (
          <div key={requester.ID} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {requester.Name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {requester.ID}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  <span className="truncate">{requester.Email}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Building size={14} className="mr-2 text-gray-400" />
                  <span>{requester.Sector?.Name || 'Sem setor'}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-2 text-gray-400" />
                  <span>Criado em {new Date(requester.CreatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Indicador de status ativo */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
                  Ativo
                </span>
                
                {/* Aqui poderia ter um botão "Ver Requisições" se necessário */}
                <span className="text-xs text-gray-500">
                  Solicitante
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRequesters.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || sectorFilter !== 'all' ? 'Nenhum solicitante encontrado' : 'Nenhum solicitante cadastrado'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || sectorFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.' 
              : 'Comece criando um novo solicitante.'
            }
          </p>
          {!searchTerm && sectorFilter === 'all' && (
            <div className="mt-6">
              <Link
                to="/requesters/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Solicitante
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Users className="text-blue-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sobre solicitantes:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Solicitantes são usuários que podem criar requisições de compra</li>
              <li>Cada solicitante pertence a um setor específico</li>
              <li>Eles só podem requisitar produtos de seu próprio setor</li>
              <li>Todas as requisições ficam vinculadas ao solicitante que as criou</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestersPage;