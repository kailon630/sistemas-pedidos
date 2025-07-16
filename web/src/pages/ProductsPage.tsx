// src/pages/ProductsPage.tsx - CORRIGIDO para backend Go
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getProducts, deleteProduct, getSectors, type Product } from '../api/products';

interface Sector {
  ID: number;
  Name: string; // ← CORRIGIDO: maiúsculo
}

const ProductsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'discontinued'>('all');
  const [sectorFilter, setSectorFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    loadProducts();
    if (user?.role === 'admin') {
      loadSectors();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSectors = async () => {
    try {
      const response = await getSectors();
      setSectors(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      setSectors([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(id);
        setProducts(prev => prev.filter(p => p.ID !== id));
        alert('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  // Filtro CORRIGIDO para usar propriedades com maiúsculas
  const filteredProducts = products.filter(product => {
    if (!product) return false;

    const matchesSearch = 
      (product.Name && product.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.Description && product.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      false;
    
    const matchesStatus = statusFilter === 'all' || product.Status === statusFilter;
    const matchesSector = sectorFilter === 'all' || product.SectorID === sectorFilter;
    
    return matchesSearch && matchesStatus && matchesSector;
  });

  const getStatusColor = (status: string) => {
    return status === 'available' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status: string) => {
    return status === 'available' ? 'Disponível' : 'Descontinuado';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'Gerencie todos os produtos do sistema' 
              : `Produtos disponíveis para seu setor`
            }
          </p>
        </div>
        <Link
          to="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Novo Produto</span>
        </Link>
      </div>

      {/* Stats Cards - CORRIGIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p?.Status === 'available').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Descontinuados</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p?.Status === 'discontinued').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <Package className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'discontinued')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="available">Disponível</option>
            <option value="discontinued">Descontinuado</option>
          </select>

          {user?.role === 'admin' && (
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(sector => (
                <option key={sector.ID} value={sector.ID}>{sector.Name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSectorFilter('all');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Products Grid - CORRIGIDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.ID} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {product.Name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.Description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.Status)}`}>
                  {getStatusText(product.Status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unidade:</span>
                  <span className="font-medium">{product.Unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Setor:</span>
                  <span className="font-medium">{product.Sector.Name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Criado:</span>
                  <span className="font-medium">
                    {new Date(product.CreatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/products/${product.ID}/edit`}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Edit size={14} className="mr-1" />
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(product.ID)}
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
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || sectorFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.' 
              : 'Comece criando um novo produto.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && sectorFilter === 'all' && (
            <div className="mt-6">
              <Link
                to="/products/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Produto
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;