// src/pages/RequestDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Package, Calendar, Edit, User, Building, Clock, CheckCircle, XCircle, AlertCircle, Plus, DollarSign } from 'lucide-react';
import api from '../api/client';
import AttachmentsSection from '../components/AttachmentsSection';

interface Item {
  ID: number;
  Description: string;
  Quantity: number;
  Status: string;
  Deadline?: string;
}

interface Request {
  ID: number;
  Status: string;
  Observations: string;
  Items: Item[];
  CreatedAt?: string;
  RequesterName?: string;
  SectorName?: string;
}

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get<Request>(`/requests/${id}`);
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar requisição:', error);
      alert('Erro ao carregar requisição');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'partial':
      case 'parcial':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
      case 'rejeitado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return <Clock size={16} />;
      case 'approved':
      case 'aprovado':
        return <CheckCircle size={16} />;
      case 'partial':
      case 'parcial':
        return <AlertCircle size={16} />;
      case 'rejected':
      case 'rejeitado':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'partial': return 'Parcial';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Requisição não encontrada</h3>
        <Link
          to="/requests"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
          Voltar para Requisições
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/requests"
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisição #{data.ID}</h1>
          <p className="text-gray-600">
            Detalhes e itens da requisição de compra
          </p>
        </div>
      </div>

      {/* Request Info Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Informações da Requisição</h2>
                <p className="text-sm text-gray-600">
                  {data.CreatedAt && `Criada em ${new Date(data.CreatedAt).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.Status)}`}>
              {getStatusIcon(data.Status)}
              <span className="ml-2">{getStatusText(data.Status)}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.RequesterName && (
              <div className="flex items-center">
                <User size={20} className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Solicitante</p>
                  <p className="font-medium text-gray-900">{data.RequesterName}</p>
                </div>
              </div>
            )}

            {data.SectorName && (
              <div className="flex items-center">
                <Building size={20} className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Setor</p>
                  <p className="font-medium text-gray-900">{data.SectorName}</p>
                </div>
              </div>
            )}
          </div>

          {data.Observations && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Observações</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {data.Observations}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Itens da Requisição</h2>
                <p className="text-sm text-gray-600">
                  {data.Items.length} {data.Items.length === 1 ? 'item' : 'itens'} solicitado{data.Items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                to={`/requests/${id}/budgets`}
                className="bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 flex items-center space-x-2 transition-colors"
              >
                <DollarSign size={16} />
                <span>Cotações</span>
              </Link>
              <Link
                to={`/requests/${id}/items/new`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span>Adicionar Item</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          {data.Items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item adicionado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece adicionando itens à esta requisição.
              </p>
              <div className="mt-6">
                <Link
                  to={`/requests/${id}/items/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Adicionar Primeiro Item
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {data.Items.map((item) => (
                <div key={item.ID} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-900">{item.Description}</h4>
                        <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.Status)}`}>
                          {getStatusText(item.Status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Package size={14} className="mr-1" />
                          <span>Quantidade: {item.Quantity}</span>
                        </div>
                        
                        {item.Deadline && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>Prazo: {new Date(item.Deadline).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      to={`/requests/${id}/items/${item.ID}/edit`}
                      className="ml-4 bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 flex items-center text-sm font-medium transition-colors"
                    >
                      <Edit size={14} className="mr-1" />
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <AttachmentsSection requestId={id!} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Link
          to="/requests"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Requisições
        </Link>
        
        <Link
          to={`/requests/${id}/budgets`}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
        >
          <DollarSign size={16} className="mr-2" />
          Gerenciar Cotações
        </Link>
      </div>
    </div>
  );
};

export default RequestDetailPage;