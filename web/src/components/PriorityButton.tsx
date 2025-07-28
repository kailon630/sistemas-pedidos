import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flag, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare,
  X
} from 'lucide-react';
import type { PurchaseRequest, PriorityLevel } from '../types/admin';
import { setRequestPriority, removeRequestPriority, toggleUrgentPriority } from '../api/admin';

interface PriorityButtonProps {
  request: PurchaseRequest;
  onUpdate: (updatedRequest: PurchaseRequest) => void;
  size?: 'small' | 'normal';
  showDropdown?: boolean;
  isAdmin?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-600',
    textColor: 'text-red-600',
    icon: <AlertTriangle size={16} />
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-600',
    textColor: 'text-orange-600',
    icon: <TrendingUp size={16} />
  },
  normal: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    icon: <Clock size={16} />
  },
  low: {
    label: 'Baixa',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-600',
    textColor: 'text-gray-600',
    icon: <TrendingDown size={16} />
  }
};

const PriorityButton: React.FC<PriorityButtonProps> = ({ 
  request, 
  onUpdate, 
  showDropdown = true,
  isAdmin = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);

  // ✅ CORRIGIR LEITURA DA PRIORIDADE ATUAL
  const currentPriority = (request.priority || 'normal') as PriorityLevel;
  const priorityConfig = PRIORITY_CONFIG[currentPriority];

  console.log('PriorityButton - Request:', request.ID, 'Priority:', request.priority, 'Current:', currentPriority);

  // Toggle rápido para urgente
  const handleQuickToggle = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await toggleUrgentPriority(request.ID);
      onUpdate(response.data);
      
      const newPriority = response.data.priority;
      console.log(
        newPriority === 'urgent' 
          ? 'Requisição marcada como urgente!' 
          : 'Urgência removida da requisição'
      );
    } catch (error) {
      console.error('Erro ao alterar prioridade:', error);
      alert('Erro ao alterar prioridade');
    } finally {
      setLoading(false);
    }
  };

  // Definir prioridade específica
  const handleSetPriority = async (priority: PriorityLevel, notes = '') => {
    setLoading(true);
    try {
      const response = await setRequestPriority(request.ID, { priority, notes });
      onUpdate(response.data);
      console.log(`Prioridade alterada para ${PRIORITY_CONFIG[priority].label}`);
      setShowModal(false);
      setShowDropdownMenu(false);
    } catch (error) {
      console.error('Erro ao alterar prioridade:', error);
      alert('Erro ao alterar prioridade');
    } finally {
      setLoading(false);
    }
  };

  // Remover priorização
  const handleRemovePriority = async () => {
    setLoading(true);
    try {
      const response = await removeRequestPriority(request.ID);
      onUpdate(response.data);
      console.log('Prioridade removida');
      setShowDropdownMenu(false);
    } catch (error) {
      console.error('Erro ao remover prioridade:', error);
      alert('Erro ao remover prioridade');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    // Usuário comum - apenas visualização
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
        {priorityConfig.icon}
        <span className="ml-1">{priorityConfig.label}</span>
      </span>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center space-x-1">
          {/* ✅ BOTÃO PRINCIPAL CORRIGIDO - MOSTRA PRIORIDADE ATUAL */}
          <button
            onClick={handleQuickToggle}
            disabled={loading}
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentPriority === 'urgent'
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : priorityConfig.color.replace('border-', 'hover:bg-').replace('200', '200')
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={currentPriority === 'urgent' ? 'Remover urgência' : 'Marcar como urgente'}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <>
                {priorityConfig.icon}
                <span className="ml-1">{priorityConfig.label}</span>
              </>
            )}
          </button>

          {/* Dropdown com todas as opções */}
          {showDropdown && (
            <div className="relative">
              <button
                onClick={() => setShowDropdownMenu(!showDropdownMenu)}
                disabled={loading}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                title="Mais opções de prioridade"
              >
                <Flag size={16} />
              </button>

              {showDropdownMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {(Object.entries(PRIORITY_CONFIG) as [PriorityLevel, typeof PRIORITY_CONFIG[PriorityLevel]][]).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleSetPriority(key)}
                        className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                          currentPriority === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${config.bgColor} mr-3`}></span>
                        {config.icon}
                        <span className="ml-2">{config.label}</span>
                        {currentPriority === key && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    ))}
                    <hr className="my-1" />
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <MessageSquare size={16} className="mr-3" />
                      Definir com observação...
                    </button>
                    {currentPriority !== 'normal' && (
                      <>
                        <hr className="my-1" />
                        <button
                          onClick={handleRemovePriority}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <X size={16} className="mr-3" />
                          Remover priorização
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para definir prioridade com observação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Definir Prioridade</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const priority = formData.get('priority') as PriorityLevel;
              const notes = formData.get('notes') as string;
              
              if (priority) {
                handleSetPriority(priority, notes || undefined);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Prioridade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(PRIORITY_CONFIG) as [PriorityLevel, typeof PRIORITY_CONFIG[PriorityLevel]][]).map(([key, config]) => (
                      <label key={key} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="priority" 
                          value={key} 
                          className="mr-2"
                          defaultChecked={key === currentPriority}
                        />
                        <span className={`w-3 h-3 rounded-full ${config.bgColor} mr-2`}></span>
                        {config.icon}
                        <span className="ml-2 text-sm">{config.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da priorização (opcional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Cliente VIP, prazo apertado, problema urgente..."
                    defaultValue={request.priorityNotes || ''}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Definir Prioridade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clique fora para fechar dropdown */}
      {showDropdownMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDropdownMenu(false)}
        ></div>
      )}
    </>
  );
};

export default PriorityButton;