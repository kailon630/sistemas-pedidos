import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute' // Novo componente para rotas admin
import Layout from './components/Layout'

import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import CreateRequestPage from './pages/CreateRequestPage'
import RequestDetailPage from './pages/RequestDetailPage'
import CreateEditItemPage from './pages/CreateEdititemPage'
import SectorsPage from './pages/SectorsPage'
import SectorFormPage from './pages/SectorFormPage'
import RequestersPage from './pages/RequestersPage'
import RequesterFormPage from './pages/RequesterFormPage'
import SuppliersPage from './pages/SupliersPage'
import SupplierFormPage from './pages/SupplierFormPage'
import AdminRequestsPanel from './pages/AdminRequestsPanel' // Novo painel admin
import ProductsPage from './pages/ProductsPage' // Nova página de produtos
import ProductFormPage from './pages/ProductFormPage' // Nova página de formulário de produtos
import RequestsListPage from './pages/RequestListPage'
import BudgetsPage from './pages/BudgetsPage';
import RequestBudgetsPage from './pages/RequestBudgetsPage';
import RequestReceiptsPage from './pages/RequestReceiptsPage';
import PriorityDashboard from './pages/PriorityDashboard'
import ProductRegistrationFormPage from './pages/ProductRegistrationFormPage'
import ProductRegistrationDetailPage from './pages/ProductRegistrationDetailPage'
import ProductRegistrationListPage from './pages/ProductRegistrationListPage'
import { NotificationProvider } from './contexts/NotificationContext'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'

const App: React.FC = () => (
  <AuthProvider>
    <NotificationProvider>
    <Routes>
      {/* rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* criação de requisição */}
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateRequestPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* detalhes da requisição */}
      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* listagem de requisições */}
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestsListPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* adicionar ou editar item */}
      <Route
        path="/requests/:id/items/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateEditItemPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id/items/:itemId/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateEditItemPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* PAINEL ADMINISTRATIVO - apenas para admins */}
      <Route
        path="/admin/requests"
        element={
          <AdminRoute>
            <Layout>
              <AdminRequestsPanel />
            </Layout>
          </AdminRoute>
        }
      />

      {/* CRUD de produtos */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductFormPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductFormPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* CRUD de setores - apenas admin */}
      <Route
        path="/sectors"
        element={
          <AdminRoute>
            <Layout>
              <SectorsPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/sectors/new"
        element={
          <AdminRoute>
            <Layout>
              <SectorFormPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/sectors/:id/edit"
        element={
          <AdminRoute>
            <Layout>
              <SectorFormPage />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Listagem de solicitantes - apenas admin */}
      <Route
        path="/requesters"
        element={
          <AdminRoute>
            <Layout>
              <RequestersPage />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Formulário de novo solicitante - apenas admin */}
      <Route
        path="/requesters/new"
        element={
          <AdminRoute>
            <Layout>
              <RequesterFormPage />
            </Layout>
          </AdminRoute>
        }
      />

      {/* CRUD de fornecedores */}
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Layout><SuppliersPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers/new"
        element={
          <ProtectedRoute>
            <Layout><SupplierFormPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers/:id/edit"
        element={
          <ProtectedRoute>
            <Layout><SupplierFormPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <Layout>
              <BudgetsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Gerenciar cotações de uma requisição específica */}
      <Route
        path="/requests/:id/budgets"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestBudgetsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Gerenciar recebimentos de uma requisição */}
      <Route
        path="/requests/:id/receipts"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestReceiptsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/priorities"
        element={
          <AdminRoute>
            <Layout>
              <PriorityDashboard />
            </Layout>
          </AdminRoute>
        }
      />

      {/* catch-all: redireciona ao dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
       {/* Solicitações de Cadastro de Produtos */}
      <Route
        path="/product-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductRegistrationListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/product-requests/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductRegistrationFormPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/product-requests/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductRegistrationDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/product-requests/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductRegistrationFormPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Nova rota para configurações de notificações */}
      <Route
        path="/notifications/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationSettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      // E também para /settings (alias):
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <AdminRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </AdminRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <AdminRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </AdminRoute>
        }
      />

    </Routes>
    </NotificationProvider>
  </AuthProvider>
)

export default App