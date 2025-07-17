import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      setForm({ quantityReceived: 1, invoiceNumber: '' });
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoiceNumber.trim()) {
      alert('Número da nota é obrigatório');
      return;
    }
    if (form.quantityReceived < 1) {
      alert('Quantidade inválida');
      return;
    }

    try {
      setLoading(true);
      await createReceipt(requestId, itemId, form);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      alert('Erro ao registrar recebimento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">Registrar Recebimento</h3>
            <p className="text-sm text-gray-600">
              {productName} - {quantityPending} {productUnit} pendentes
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade Recebida</label>
            <input
              type="number"
              min="1"
              max={quantityPending}
              value={form.quantityReceived}
              onChange={e => setForm({ ...form, quantityReceived: parseInt(e.target.value, 10) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nota Fiscal</label>
            <input
              type="text"
              value={form.invoiceNumber}
              onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fornecedor (opcional)</label>
            <select
              value={form.supplierId ?? ''}
              onChange={e =>
                setForm({ ...form, supplierId: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">-- Selecione --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações (opcional)</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReceiptModal;
