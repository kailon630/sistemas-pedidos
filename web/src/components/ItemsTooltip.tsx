import React, { useState } from 'react';
import { Info, Package, Clock } from 'lucide-react';
import api from '../api/client';

interface Item {
  ID: number;
  ProductID: number;
  Product: {
    ID: number;
    Name: string;
    Description: string;
    Unit: string;
  };
  Quantity: number;
  Status: string;
  Deadline?: string;
}

interface ItemsTooltipProps {
  requestId: number;
  className?: string;
}

const ItemsTooltip: React.FC<ItemsTooltipProps> = ({ requestId, className = '' }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadItems = async () => {
    if (loaded || loading) return;
    
    setLoading(true);
    try {
      const response = await api.get<Item[]>(`/requests/${requestId}/items`);
      setItems(response.data);
      setLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    loadItems();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600';
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${className}`}
        title="Ver itens do pedido"
      >
        <Info size={16} className="text-gray-500 hover:text-blue-600" />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 max-w-96">
            <div className="flex items-center mb-3">
              <Package size={16} className="text-gray-600 mr-2" />
              <span className="font-semibold text-sm text-gray-900">
                Itens do Pedido #{requestId}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Carregando...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-4">
                <Package size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.ID} className="border-b border-gray-100 pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {item.Product?.Name || 'Produto não identificado'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-600">
                            Qtd: {item.Quantity} {item.Product?.Unit || 'un'}
                          </span>
                          <span className={`text-xs font-medium ${getStatusColor(item.Status)}`}>
                            {getStatusText(item.Status)}
                          </span>
                        </div>
                        {item.Deadline && (
                          <div className="flex items-center mt-1">
                            <Clock size={12} className="text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              Prazo: {new Date(item.Deadline).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Seta do tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 -mt-1"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsTooltip;