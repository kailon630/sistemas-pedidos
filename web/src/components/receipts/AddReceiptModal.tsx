import React, { useState, useEffect } from 'react';
import { X, Package, AlertCircle, Calendar, FileText,Truck, CheckCircle } from 'lucide-react';
import { getSuppliers, type Supplier } from '../../api/supplier';
import { createReceipt, type CreateReceiptData } from '../../api/receipts';

interface AddReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestId: number;
  itemId: number;
  productName: string;
  productUnit: string;
  quantityPending: number;
}

const AddReceiptModal: React.FC<AddReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  requestId,
  itemId,
  productName,
  productUnit,
  quantityPending,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<CreateReceiptData>({
    quantityReceived: 1,
    invoiceNumber: '',
    invoiceDate: null,
    lotNumber: '',
    expirationDate: null,
    supplierId: null,
    notes: '',
    receiptCondition: 'good',
    qualityChecked: false,
    qualityNotes: '',
    rejectedQuantity: 0
  });
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      // ✅ Reset form com valores padrão
      setForm({
        quantityReceived: Math.min(1, quantityPending),
        invoiceNumber: '',
        invoiceDate: null, // ✅ null ao invés de string vazia
        lotNumber: '',
        expirationDate: null, // ✅ null ao invés de string vazia
        supplierId: null,
        notes: '',
        receiptCondition: 'good',
        qualityChecked: false,
        qualityNotes: '',
        rejectedQuantity: 0
      });
      setErrors({});
    }
  }, [isOpen, quantityPending]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const res = await getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('❌ Erro ao carregar fornecedores:', err);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validação da quantidade
    if (!form.quantityReceived || form.quantityReceived < 1) {
      newErrors.quantityReceived = 'Quantidade deve ser maior que zero';
    }
    if (form.quantityReceived > quantityPending) {
      newErrors.quantityReceived = `Quantidade não pode exceder ${quantityPending}`;
    }

    // Validação do número da nota fiscal
    if (!form.invoiceNumber?.trim()) {
      newErrors.invoiceNumber = 'Número da nota fiscal é obrigatório';
    }

    // Validação da quantidade rejeitada
    if (form.rejectedQuantity && form.rejectedQuantity >= form.quantityReceived) {
      newErrors.rejectedQuantity = 'Quantidade rejeitada deve ser menor que a recebida';
    }

    // ✅ VALIDAÇÃO MELHORADA: Datas
    if (form.invoiceDate) {
      const invoiceDate = new Date(form.invoiceDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permite até o final do dia atual
      
      if (isNaN(invoiceDate.getTime())) {
        newErrors.invoiceDate = 'Data da nota fiscal inválida';
      } else if (invoiceDate > today) {
        newErrors.invoiceDate = 'Data da nota fiscal não pode ser futura';
      }
    }

    if (form.expirationDate) {
      const expirationDate = new Date(form.expirationDate);
      
      if (isNaN(expirationDate.getTime())) {
        newErrors.expirationDate = 'Data de validade inválida';
      } else {
        const today = new Date();
        if (expirationDate < today) {
          newErrors.expirationDate = 'Data de validade não pode ser no passado';
        }
        
        // Se tem data da NF, validade deve ser posterior
        if (form.invoiceDate) {
          const invoiceDate = new Date(form.invoiceDate);
          if (expirationDate <= invoiceDate) {
            newErrors.expirationDate = 'Data de validade deve ser posterior à data da nota fiscal';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      console.log('📋 Dados do formulário antes da formatação:', form);
      
      await createReceipt(requestId, itemId, form);
      
      console.log('✅ Recebimento registrado com sucesso!');
      alert('Recebimento registrado com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro detalhado:', error);
      
      // ✅ MELHOR TRATAMENTO DE ERROS
      let errorMessage = 'Erro ao registrar recebimento.';
      
      if (error.response?.data?.error) {
        const backendError = error.response.data.error;
        
        // Erros específicos de data
        if (backendError.includes('parsing time')) {
          errorMessage = 'Erro no formato de data. Verifique as datas inseridas.';
        } else if (backendError.includes('required')) {
          errorMessage = 'Campos obrigatórios não preenchidos.';
        } else if (backendError.includes('invalid')) {
          errorMessage = 'Dados inválidos. Verifique os valores inseridos.';
        } else {
          errorMessage = `Erro: ${backendError}`;
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para registrar recebimentos.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Item ou requisição não encontrada.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateReceiptData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ✅ FUNÇÃO AUXILIAR: Converter data para input format
  const formatDateForInput = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-blue-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Registrar Recebimento</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {productName} - {quantityPending} {productUnit} pendentes
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-96">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resumo do Recebimento */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Resumo do Recebimento</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Quantidade a receber:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {form.quantityReceived} {productUnit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Quantidade rejeitada:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {form.rejectedQuantity} {productUnit}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-gray-600">Quantidade líquida:</span>
                  <span className="ml-2 font-bold text-blue-600">
                    {form.quantityReceived - (form.rejectedQuantity || 0)} {productUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantidade e Rejeição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package size={16} className="inline mr-1" />
                  Quantidade Recebida *
                </label>
                <input
                  type="number"
                  min="1"
                  max={quantityPending}
                  value={form.quantityReceived}
                  onChange={e => handleChange('quantityReceived', parseInt(e.target.value, 10) || 1)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantityReceived ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.quantityReceived && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.quantityReceived}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Máximo: {quantityPending} {productUnit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <X size={16} className="inline mr-1" />
                  Quantidade Rejeitada
                </label>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, form.quantityReceived - 1)}
                  value={form.rejectedQuantity}
                  onChange={e => handleChange('rejectedQuantity', parseInt(e.target.value, 10) || 0)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rejectedQuantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.rejectedQuantity && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.rejectedQuantity}
                  </div>
                )}
              </div>
            </div>

            {/* Nota Fiscal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Número da Nota Fiscal *
              </label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={e => handleChange('invoiceNumber', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 123456789"
                required
              />
              {errors.invoiceNumber && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.invoiceNumber}
                </div>
              )}
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Data da Nota Fiscal
                </label>
                <input
                  type="date"
                  value={formatDateForInput(form.invoiceDate)}
                  onChange={e => handleChange('invoiceDate', e.target.value || null)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.invoiceDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.invoiceDate && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.invoiceDate}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={formatDateForInput(form.expirationDate)}
                  onChange={e => handleChange('expirationDate', e.target.value || null)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.expirationDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expirationDate && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.expirationDate}
                  </div>
                )}
              </div>
            </div>

            {/* Fornecedor e Lote */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck size={16} className="inline mr-1" />
                  Fornecedor
                </label>
                <select
                  value={form.supplierId || ''}
                  onChange={e => handleChange('supplierId', e.target.value ? Number(e.target.value) : null)}
                  disabled={loadingSuppliers}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {loadingSuppliers ? 'Carregando...' : '-- Selecione --'}
                  </option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Lote
                </label>
                <input
                  type="text"
                  value={form.lotNumber || ''}
                  onChange={e => handleChange('lotNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: L20250721001"
                />
              </div>
            </div>

            {/* Condição do Recebimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condição do Recebimento
              </label>
              <select
                value={form.receiptCondition}
                onChange={e => handleChange('receiptCondition', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="good">✅ Boa Condição</option>
                <option value="damaged">❌ Danificado</option>
                <option value="partial_damage">⚠️ Parcialmente Danificado</option>
              </select>
            </div>

            {/* Controle de Qualidade */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="qualityChecked"
                  checked={form.qualityChecked}
                  onChange={e => handleChange('qualityChecked', e.target.checked)}
                  className="mr-3 w-4 h-4 text-blue-600"
                />
                <label htmlFor="qualityChecked" className="text-sm font-medium text-gray-700">
                  <CheckCircle size={16} className="inline mr-1" />
                  Controle de qualidade realizado
                </label>
              </div>

              {form.qualityChecked && (
                <div className="ml-7">
                  <textarea
                    value={form.qualityNotes || ''}
                    onChange={e => handleChange('qualityNotes', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva os procedimentos de qualidade realizados..."
                  />
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Gerais
              </label>
              <textarea
                value={form.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais sobre o recebimento, condições de entrega, etc..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                'Registrar Recebimento'
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-6 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={14} />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">⚠️ Importante:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Verifique a qualidade dos itens antes de confirmar o recebimento</li>
                  <li>A quantidade rejeitada será descontada do total recebido</li>
                  <li>Registre a data correta da nota fiscal para controle fiscal</li>
                  <li>Use o campo de observações para detalhes importantes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReceiptModal;