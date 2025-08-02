package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/config"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/handlers"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/middleware"
	"gorm.io/gorm"
)

// Setup configura todas as rotas da API
func Setup(router *gin.Engine, databaseConnection *gorm.DB, appConfig *config.Config) {
	// Health-check aberto
	router.GET("/api/v1/health", handlers.Health)

	// Grupo de rotas v1
	apiGroup := router.Group("/api/v1")
	{
		// ✅ CRÍTICO: ROTA PÚBLICA DO LOGO (DEVE VIR ANTES DAS PROTEGIDAS)
		apiGroup.GET("/settings/company/logo", handlers.GetCompanyLogo(databaseConnection))

		// Autenticação (aberto)
		authGroup := apiGroup.Group("/auth")
		{
			authGroup.POST("/login", handlers.Login(databaseConnection, appConfig))
		}

		// Usuários (protegido)
		userGroup := apiGroup.Group("/users")
		userGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			userGroup.GET("", handlers.ListUsers(databaseConnection))
			userGroup.POST("", handlers.CreateUser(databaseConnection))
		}

		// Produtos (protegido)
		productsGroup := apiGroup.Group("/products")
		productsGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			productsGroup.GET("", handlers.ListProducts(databaseConnection))
			productsGroup.POST("", handlers.CreateProduct(databaseConnection))
			productsGroup.GET("/:id", handlers.GetProduct(databaseConnection))
			productsGroup.PATCH("/:id", handlers.UpdateProduct(databaseConnection))
			productsGroup.DELETE("/:id", handlers.DeleteProduct(databaseConnection))
		}

		// Requisições (protegido)
		requestsGroup := apiGroup.Group("/requests")
		requestsGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			requestsGroup.GET("", handlers.ListPurchaseRequests(databaseConnection))
			requestsGroup.POST("", handlers.CreatePurchaseRequest(databaseConnection))
			requestsGroup.GET("/:id", handlers.GetPurchaseRequest(databaseConnection))
			requestsGroup.PATCH("/:id", handlers.UpdatePurchaseRequest(databaseConnection))

			// Rotas administrativas para revisão
			requestsGroup.PATCH("/:id/review", handlers.ReviewRequest(databaseConnection))
			requestsGroup.PATCH("/:id/items/:itemId/review", handlers.ReviewRequestItem(databaseConnection))

			// Rotas para prioridade
			requestsGroup.PATCH("/:id/priority", handlers.SetRequestPriority(databaseConnection))
			requestsGroup.DELETE("/:id/priority", handlers.RemoveRequestPriority(databaseConnection))
			requestsGroup.POST("/:id/toggle-urgent", handlers.ToggleUrgentPriority(databaseConnection))

			// Itens de cada requisição (incluindo recebimentos)
			itemsGroup := requestsGroup.Group("/:id/items")
			{
				itemsGroup.GET("", handlers.ListItemsForRequest(databaseConnection))
				itemsGroup.POST("", handlers.CreateItem(databaseConnection))
				itemsGroup.GET("/:itemId", handlers.GetItem(databaseConnection))
				itemsGroup.PATCH("/:itemId", handlers.UpdateItem(databaseConnection))
				itemsGroup.DELETE("/:itemId", handlers.DeleteItem(databaseConnection))

				// Recebimentos por item
				itemsGroup.POST("/:itemId/receipts", handlers.CreateReceipt(databaseConnection))
				itemsGroup.GET("/:itemId/receipts", handlers.ListItemReceipts(databaseConnection))
			}

			// Anexos de cada requisição
			attachmentsGroup := requestsGroup.Group("/:id/attachments")
			{
				attachmentsGroup.POST("", handlers.UploadAttachment(databaseConnection))
				attachmentsGroup.GET("", handlers.ListAttachments(databaseConnection))
				attachmentsGroup.GET("/:attachmentId", handlers.DownloadAttachment(databaseConnection))
			}

			// Orçamentos
			requestsGroup.POST("/:id/items/:itemId/budgets", handlers.CreateItemBudget(databaseConnection))
			requestsGroup.GET("/:id/budgets", handlers.ListRequestBudgets(databaseConnection))

			requestsGroup.POST("/:id/complete", handlers.CompleteRequest(databaseConnection))
			requestsGroup.POST("/:id/reopen", handlers.ReopenRequest(databaseConnection))

			// Recebimentos gerais da requisição
			receiptsGroup := requestsGroup.Group("/:id/receipts")
			{
				receiptsGroup.GET("/status", handlers.GetReceivingStatus(databaseConnection))
				receiptsGroup.GET("/summary", handlers.GetRequestReceiptsSummary(databaseConnection))
			}
		}

		// Rotas fora de /requests
		apiGroup.PATCH("/budgets/:budgetID", handlers.UpdateBudget(databaseConnection))
		apiGroup.DELETE("/budgets/:budgetID", handlers.DeleteBudget(databaseConnection))

		// Setores (protegido)
		sectors := apiGroup.Group("/sectors")
		sectors.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			sectors.GET("", handlers.ListSectors(databaseConnection))
			sectors.POST("", handlers.CreateSector(databaseConnection))
			sectors.PATCH("/:id", handlers.UpdateSector(databaseConnection))
			sectors.DELETE("/:id", handlers.DeleteSector(databaseConnection))
		}

		// Solicitantes (protegido)
		solicitantes := apiGroup.Group("/requesters")
		solicitantes.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			solicitantes.GET("", handlers.ListRequesters(databaseConnection))
			solicitantes.POST("", handlers.CreateRequester(databaseConnection))
		}

		// Fornecedores (protegido)
		suppliersGroup := apiGroup.Group("/suppliers")
		suppliersGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			suppliersGroup.GET("", handlers.ListSuppliers(databaseConnection))
			suppliersGroup.POST("", handlers.CreateSupplier(databaseConnection))
			suppliersGroup.GET("/:id", handlers.GetSupplier(databaseConnection))
			suppliersGroup.PATCH("/:id", handlers.UpdateSupplier(databaseConnection))
			suppliersGroup.DELETE("/:id", handlers.DeleteSupplier(databaseConnection))
		}

		// Notificações com middleware SSE especial
		apiGroup.GET("/notifications",
			middleware.SSEAuthMiddleware(appConfig.JWTSecretKey),
			handlers.NotificationsStream(),
		)

		// Rota de teste (temporária)
		apiGroup.GET("/test-notification",
			middleware.AuthMiddleware(appConfig.JWTSecretKey),
			handlers.TestNotification(),
		)

		// Relatórios em Excel
		apiGroup.GET("/reports/requests.xlsx",
			middleware.AuthMiddleware(appConfig.JWTSecretKey),
			handlers.ExportRequestsExcel(databaseConnection),
		)
		apiGroup.GET("/reports/receipts.xlsx",
			middleware.AuthMiddleware(appConfig.JWTSecretKey),
			handlers.ExportReceiptsExcel(databaseConnection),
		)

		// Upload/download de nota fiscal de recebimento
		apiGroup.POST(
			"/receipts/:receiptId/invoice",
			middleware.AuthMiddleware(appConfig.JWTSecretKey),
			handlers.UploadReceiptAttachment(databaseConnection),
		)
		apiGroup.GET(
			"/receipts/:receiptId/invoice",
			middleware.AuthMiddleware(appConfig.JWTSecretKey),
			handlers.DownloadReceiptInvoice(databaseConnection),
		)

		productRequestsGroup := apiGroup.Group("/product-requests")
		productRequestsGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			productRequestsGroup.GET("", handlers.ListProductRegistrationRequests(databaseConnection))
			productRequestsGroup.POST("", handlers.CreateProductRegistrationRequest(databaseConnection))
			productRequestsGroup.GET("/stats", handlers.GetProductRegistrationStats(databaseConnection))
			productRequestsGroup.GET("/:id", handlers.GetProductRegistrationRequest(databaseConnection))
			productRequestsGroup.PATCH("/:id", handlers.UpdateProductRegistrationRequest(databaseConnection))
			productRequestsGroup.DELETE("/:id", handlers.DeleteProductRegistrationRequest(databaseConnection))
			productRequestsGroup.PATCH("/:id/process", handlers.ProcessProductRegistrationRequest(databaseConnection))
		}

		profileGroup := apiGroup.Group("/profile")
		profileGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			profileGroup.GET("", handlers.GetProfile(databaseConnection))
			profileGroup.PUT("", handlers.UpdateProfile(databaseConnection))
			profileGroup.PATCH("/password", handlers.ChangePassword(databaseConnection))
		}

		// ✅ CONFIGURAÇÕES (PROTEGIDAS - EXCETO LOGO GET QUE JÁ ESTÁ ACIMA)
		settingsGroup := apiGroup.Group("/settings")
		settingsGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			// Configurações da empresa
			settingsGroup.GET("/company", handlers.GetCompanySettings(databaseConnection))
			settingsGroup.PUT("/company", handlers.UpdateCompanySettings(databaseConnection))
			settingsGroup.POST("/company/logo", handlers.UploadCompanyLogo(databaseConnection))
			// ⚠️ REMOVIDO: settingsGroup.GET("/company/logo", ...) - JÁ ESTÁ PÚBLICO ACIMA

			// Configurações do sistema
			settingsGroup.GET("/system", handlers.GetSystemSettings(databaseConnection))
			settingsGroup.PUT("/system", handlers.UpdateSystemSettings(databaseConnection))
		}

		// Relatórios (apenas admin)
		reportsGroup := apiGroup.Group("/reports")
		reportsGroup.Use(middleware.AuthMiddleware(appConfig.JWTSecretKey))
		{
			reportsGroup.GET("/requests", handlers.GetRequestsReport(databaseConnection))
			reportsGroup.GET("/requests/export", handlers.ExportRequestsReport(databaseConnection))
		}
	}
}
