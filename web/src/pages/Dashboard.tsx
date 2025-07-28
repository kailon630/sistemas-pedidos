import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, TrendingUp, Clock, CheckCircle, AlertCircle, AlertTriangle, User, Building } from 'lucide-react'
import ItemsTooltip from '../components/ItemsTooltip'
import PriorityBadge from '../components/PriorityBadge'

interface PurchaseRequest {
  ID: number
  CreatedAt: string
  RequesterID: number
  Status: string
  Observations: string
  Priority?: 'urgent' | 'high' | 'normal' | 'low'
  PriorityNotes?: string
  // Dados do requerente
  Requester?: {
    ID: number
    Name: string
    Email: string
    Role: string
    SectorID: number
    Sector: {
      ID: number
      Name: string
    }
  }
  // Dados do setor
  Sector?: {
    ID: number
    Name: string
  }
  // Contagem de itens
  Items?: Array<{
    ID: number
    Status: string
  }>
}

interface DashboardStats {
  total: number
  pending: number
  approved: number
  partial: number
  rejected: number
  urgent: number
  high: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    partial: 0,
    rejected: 0,
    urgent: 0,
    high: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/requests')
        const data = response.data as PurchaseRequest[]
        
        console.log('Dashboard - Dados recebidos:', data)
        
        setRequests(data as PurchaseRequest[])
        
        // Calcular estatísticas com verificações de segurança
        const statsCalc = data.reduce((acc: DashboardStats, req: PurchaseRequest) => {
          acc.total++
          
          // Status
          const status = req.Status || req.Status || 'pending'
          switch (status.toLowerCase()) {
            case 'pending': case 'pendente': acc.pending++; break;
            case 'approved': case 'aprovado': acc.approved++; break;
            case 'partial': case 'parcial': acc.partial++; break;
            case 'rejected': case 'rejeitado': acc.rejected++; break;
          }
          
          // Prioridade - verificar tanto PascalCase quanto camelCase
          const priority = (req as any).Priority || req.Priority || (req as any).priority || req.Priority
          if (priority) {
            switch (priority.toLowerCase()) {
              case 'urgent': acc.urgent++; break;
              case 'high': acc.high++; break;
            }
          }
          
          return acc
        }, { 
          total: 0, pending: 0, approved: 0, partial: 0, rejected: 0,
          urgent: 0, high: 0
        })
        
        setStats(statsCalc)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        alert('Erro ao carregar dados do dashboard. Verifique sua conexão.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status.toLowerCase()) {
      case 'pending': case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'approved': case 'aprovado': return 'bg-green-100 text-green-800'
      case 'partial': case 'parcial': return 'bg-purple-100 text-purple-800'
      case 'rejected': case 'rejeitado': return 'bg-red-100 text-red-800'
      case 'completed': case 'concluido': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Clock size={16} />
    
    switch (status.toLowerCase()) {
      case 'pending': case 'pendente': return <Clock size={16} />
      case 'approved': case 'aprovado': return <CheckCircle size={16} />
      case 'partial': case 'parcial': return <AlertCircle size={16} />
      case 'rejected': case 'rejeitado': return <AlertCircle size={16} />
      case 'completed': case 'concluido': return <CheckCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const getStatusText = (status: string | undefined) => {
    if (!status) return 'Indefinido'
    
    switch (status.toLowerCase()) {
      case 'pending': return 'Pendente'
      case 'approved': return 'Aprovado'
      case 'partial': return 'Parcial'
      case 'rejected': return 'Rejeitado'
      case 'completed': return 'Concluído'
      default: return status
    }
  }

  const getItemsCount = (request: PurchaseRequest) => {
    return request.Items?.length || 0
  }

  const getApprovedItemsCount = (request: PurchaseRequest) => {
    if (!request.Items) return 0
    return request.Items.filter(item => item.Status?.toLowerCase() === 'approved').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Gerencie suas requisições de compra</p>
        </div>
        <button
          onClick={() => navigate('/requests/new')}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
        >
          <Plus size={20} className="mr-2" />
          Nova Requisição
        </button>
      </div>

      {/* Cards de Estatísticas Melhorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Parciais</p>
              <p className="text-2xl font-bold text-gray-900">{stats.partial}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Card Urgentes - sempre visível */}
        <div className={`bg-white p-6 rounded-lg shadow-sm border ${stats.urgent > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${stats.urgent > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${stats.urgent > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgentes</p>
              <p className={`text-2xl font-bold ${stats.urgent > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.urgent}
              </p>
            </div>
          </div>
        </div>

        {/* Card Alta Prioridade */}
        <div className={`bg-white p-6 rounded-lg shadow-sm border ${stats.high > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${stats.high > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <TrendingUp className={`h-6 w-6 ${stats.high > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
              <p className={`text-2xl font-bold ${stats.high > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                {stats.high}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Requisições Melhorada */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Requisições Recentes</h2>
        </div>
        
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma requisição encontrada</p>
            <button
              onClick={() => navigate('/requests/new')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
            >
              <Plus size={20} className="mr-2" />
              Criar primeira requisição
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID / Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User size={14} className="mr-1" />
                      Requerente
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Building size={14} className="mr-1" />
                      Setor
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => {
                  const priority = (req as any).Priority || req.Priority || (req as any).priority || req.Priority || 'normal';
                  const totalItems = getItemsCount(req);
                  const approvedItems = getApprovedItemsCount(req);
                  
                  return (
                    <tr 
                      key={req.ID} 
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        priority === 'urgent' ? 'bg-red-50 border-l-4 border-red-500' :
                        priority === 'high' ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-gray-900">#{req.ID}</span>
                          <PriorityBadge priority={priority as any} />
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {req.Requester?.Name || 'Não identificado'}
                            </div>
                            {req.Requester?.Email && (
                              <div className="text-sm text-gray-500 truncate max-w-32" title={req.Requester.Email}>
                                {req.Requester.Email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {req.Sector?.Name || req.Requester?.Sector?.Name || 'Não identificado'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.Status)}`}>
                          {getStatusIcon(req.Status)}
                          <span className="ml-1">{getStatusText(req.Status)}</span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-900">
                            {totalItems > 0 ? (
                              <span>
                                {approvedItems > 0 && approvedItems !== totalItems ? (
                                  <span className="text-green-600 font-medium">{approvedItems}</span>
                                ) : null}
                                {approvedItems > 0 && approvedItems !== totalItems ? '/' : ''}
                                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                              </span>
                            ) : (
                              'Nenhum item'
                            )}
                          </div>
                          {totalItems > 0 && (
                            <ItemsTooltip requestId={req.ID} />
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={req.Observations || 'Sem observações'}>
                          {req.Observations || 'Sem observações'}
                        </div>
                        {priority !== 'normal' && (req as any).PriorityNotes && (
                          <div className="text-xs text-gray-500 italic mt-1 max-w-xs truncate" title={(req as any).PriorityNotes}>
                            Prioridade: {(req as any).PriorityNotes}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {req.CreatedAt ? new Date(req.CreatedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Data não disponível'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => navigate(`/requests/${req.ID}`)}
                          className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                        >
                          <Eye size={16} className="mr-1" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard