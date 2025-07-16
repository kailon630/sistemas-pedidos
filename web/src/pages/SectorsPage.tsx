// src/pages/SectorsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Building, Search, Users } from 'lucide-react';
import api from '../api/client';

// Interface para corresponder ao backend Go
interface Sector {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Name: string;
}

const SectorsPage: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setLoading(true);
      const response = await api.get<Sector[]>('/sectors');
      setSectors(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      setSectors([]);
      alert('Erro ao carregar setores. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o setor "${name}"?`)) {
      try {
        await api.delete(`/sectors/${id}`);
        setSectors(prev => prev.filter(s => s.ID !== id));
        alert('Setor excluído com sucesso!');
      } catch (error: any) {
        console.error('Erro ao excluir setor:', error);
        if (error.response?.data?.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao excluir setor. Pode haver usuários ou produtos vinculados a este setor.');
        }
      }
    }
  };

  const filteredSectors = sectors.filter(sector => {
    if (!sector) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (sector.Name && sector.Name.toLowerCase().includes(searchLower))
    );
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Setores</h1>
          <p className="text-gray-600">
            Gerencie os setores da organização
          </p>
        </div>
        <Link
          to="/sectors/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Novo Setor</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Setores</p>
              <p className="text-2xl font-bold text-gray-900">{sectors.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Criados Este Mês</p>
              <p className="text-2xl font-bold text-green-600">
                {sectors.filter(s => {
                  const created = new Date(s.CreatedAt);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mais Antigo</p>
              <p className="text-2xl font-bold text-purple-600">
                {sectors.length > 0 
                  ? new Date(Math.min(...sectors.map(s => new Date(s.CreatedAt).getTime()))).getFullYear()
                  : '----'
                }
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar setores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Sectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSectors.map((sector) => (
          <div key={sector.ID} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sector.Name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {sector.ID}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Criado em:</span>
                  <span className="font-medium">
                    {new Date(sector.CreatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                {sector.UpdatedAt !== sector.CreatedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Atualizado:</span>
                    <span className="font-medium">
                      {new Date(sector.UpdatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/sectors/${sector.ID}/edit`}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Edit size={14} className="mr-1" />
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(sector.ID, sector.Name)}
                  className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={14} className="mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSectors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'Nenhum setor encontrado' : 'Nenhum setor cadastrado'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'Tente ajustar o termo de busca.' 
              : 'Comece criando um novo setor.'
            }
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/sectors/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Setor
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Users className="text-yellow-600 mr-3 mt-0.5" size={16} />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">⚠️ Importante:</p>
            <p>
              Setores com usuários ou produtos vinculados não podem ser excluídos. 
              Certifique-se de realocar todos os itens antes de excluir um setor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorsPage;