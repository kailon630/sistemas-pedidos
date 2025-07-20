//src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface PurchaseRequest {
  ID: number
  CreatedAt: string
  RequesterID: number
  Status: string
  Observations: string
}

interface DashboardStats {
  total: number
  pending: number
  approved: number
  partial: number
  rejected: number
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
    rejected: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/requests')
        const data = response.data
        setRequests(data)
        
        // Calcular estatísticas
        const statsCalc = data.reduce((acc: DashboardStats, req: PurchaseRequest) => {
          acc.total++
          switch (req.Status.toLowerCase()) {
            case 'pending':
            case 'pendente':
              acc.pending++
              break
            case 'approved':
            case 'aprovado':
              acc.approved++
              break
            case 'partial':
            case 'parcial':
              acc.partial++
              break
            case 'rejected':
            case 'rejeitado':
              acc.rejected++
              break
          }
          return acc
        }, { total: 0, pending: 0, approved: 0, partial: 0, rejected: 0 })
        
        setStats(statsCalc)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
      case 'aprovado':
        return 'bg-green-100 text-green-800'
      case 'partial':
      case 'parcial':
        return 'bg-purple-100 text-purple-800'
      case 'rejected':
      case 'rejeitado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return <Clock size={16} />
      case 'approved':
      case 'aprovado':
        return <CheckCircle size={16} />
      case 'partial':
      case 'parcial':
        return <AlertCircle size={16} />
      case 'rejected':
      case 'rejeitado':
        return <AlertCircle size={16} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
      </div>

      {/* Tabela de Requisições */}
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
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {requests.map((req) => (
                  <tr key={req.ID} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{req.ID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.Status)}`}>
                        {getStatusIcon(req.Status)}
                        <span className="ml-1">{req.Status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {req.Observations || 'Sem observações'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.CreatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard