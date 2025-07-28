import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import type { RequestItem, ReviewItemData } from '../types/admin';

interface ReviewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewItemData) => void;
  item: RequestItem;
  loading?: boolean;
}

const ReviewItemModal: React.FC<ReviewItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  loading = false
}) => {
  const [status, setStatus] = useState<'approved' | 'rejected' | 'suspended'>('approved');
  const [adminNotes, setAdminNotes] = useState(item.adminNotes || '');
  const [suspensionReason, setSuspensionReason] = useState(item.suspensionReason || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ VALIDAÇÃO: Se suspenso, motivo é obrigatório
    if (status === 'suspended' && !suspensionReason.trim()) {
      alert('Motivo da suspensão é obrigatório');
      return;
    }
    
    onSubmit({
      status,
      adminNotes: adminNotes.trim() || undefined,
      suspensionReason: status === 'suspended' ? suspensionReason.trim() : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Revisar Item</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium">{item.product?.name || 'Produto não identificado'}</h4>
          <p className="text-sm text-gray-600">
            Quantidade: {item.quantity} {item.product?.unit || 'un'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* ✅ OPÇÕES DE STATUS ATUALIZADAS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Decisão</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="status" 
                    value="approved" 
                    checked={status === 'approved'}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mr-3"
                  />
                  <CheckCircle size={16} className="text-green-600 mr-2" />
                  <span className="text-sm font-medium">Aprovar</span>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="status" 
                    value="rejected" 
                    checked={status === 'rejected'}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mr-3"
                  />
                  <XCircle size={16} className="text-red-600 mr-2" />
                  <span className="text-sm font-medium">Rejeitar</span>
                </label>
                
                {/* ✅ NOVA OPÇÃO: SUSPENDER */}
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="status" 
                    value="suspended" 
                    checked={status === 'suspended'}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mr-3"
                  />
                  <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                  <span className="text-sm font-medium">Suspender</span>
                </label>
              </div>
            </div>
            
            {/* ✅ CAMPO CONDICIONAL: MOTIVO DA SUSPENSÃO */}
            {status === 'suspended' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Suspensão *
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Aguardando aprovação do orçamento, Produto em falta no mercado, Necessária cotação adicional..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Explique o motivo da suspensão para futuro acompanhamento
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Administrativas (opcional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adicione observações sobre esta decisão..."
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewItemModal;