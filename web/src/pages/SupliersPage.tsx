import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Truck, Search, Phone, Mail, FileText } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getSuppliers, deleteSupplier, type Supplier } from '../api/supplier';

const SuppliersPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
      alert('Erro ao carregar fornecedores. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
      try {
        await deleteSupplier(id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
        alert('Fornecedor excluído com sucesso!');
      } catch (error: any) {
        console.error('Erro ao excluir fornecedor:', error);
        if (error.response?.data?.error) {
          alert(`Erro: ${error.response.data.error}`);
        } else {
          alert('Erro ao excluir fornecedor. Tente novamente.');
        }
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!supplier) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (supplier.name && supplier.name.toLowerCase().includes(searchLower)) ||
      (supplier.cnpj && supplier.cnpj.toLowerCase().includes(searchLower)) ||      // ✅ BUSCA POR CNPJ
      (supplier.contact && supplier.contact.toLowerCase().includes(searchLower)) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchLower)) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(searchLower))
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
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Gerencie todos os fornecedores do sistema' 
              : 'Visualize os fornecedores cadastrados'
            }
          </p>
        </div>
        <Link
          to="/suppliers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Novo Fornecedor</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Fornecedores</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Com CNPJ</p>
              <p className="text-2xl font-bold text-indigo-600">
                {suppliers.filter(s => s?.cnpj && s.cnpj.trim()).length} {/* ✅ ESTATÍSTICA CNPJ */}
              </p>
            </div>
            <div className="p-3 rounded-full bg-indigo-100">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Com Email</p>
              <p className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => s?.email && s.email.trim()).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Com Telefone</p>
              <p className="text-2xl font-bold text-purple-600">
                {suppliers.filter(s => s?.phone && s.phone.trim()).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Phone className="h-6 w-6 text-purple-600" />
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
              placeholder="Buscar por nome, CNPJ, contato, email ou telefone..."
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

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {supplier.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {supplier.contact || 'Sem contato'}
                    </p>
                    {/* ✅ EXIBIR CNPJ */}
                    {supplier.cnpj && (
                      <p className="text-xs text-gray-500 mt-1">
                        CNPJ: {supplier.cnpj}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {supplier.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={14} className="mr-2 text-gray-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                
                {supplier.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone size={14} className="mr-2 text-gray-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}

                {supplier.observations && (
                  <div className="text-sm text-gray-600">
                    <p className="line-clamp-2">{supplier.observations}</p>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <span>Cadastrado em {new Date(supplier.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/suppliers/${supplier.id}/edit`}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Edit size={14} className="mr-1" />
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(supplier.id, supplier.name)}
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
      {filteredSuppliers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'Tente ajustar o termo de busca.' 
              : 'Comece criando um novo fornecedor.'
            }
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/suppliers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Fornecedor
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;