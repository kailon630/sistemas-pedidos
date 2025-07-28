package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/notifications"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/utils"
	"gorm.io/gorm"
)

// Input para criação de solicitação
type createProductRegistrationInput struct {
	ProductName        string `json:"productName" binding:"required"`
	ProductDescription string `json:"productDescription"`
	ProductUnit        string `json:"productUnit" binding:"required"`
	Justification      string `json:"justification" binding:"required"`
}

// Input para processamento pelo admin
type processProductRegistrationInput struct {
	Status     string `json:"status" binding:"required,oneof=approved rejected"`
	AdminNotes string `json:"adminNotes"`
}

// CreateProductRegistrationRequest - Usuário comum solicita cadastro de produto
func CreateProductRegistrationRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		userRole := c.GetString("role")

		// Apenas usuários não-admin podem fazer solicitações
		if userRole == "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Administradores devem criar produtos diretamente"})
			return
		}

		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ID de usuário inválido"})
			return
		}

		var input createProductRegistrationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Busca dados do usuário para pegar o setor
		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
			return
		}

		// Verifica se já existe um produto com o mesmo nome no setor
		var existingProduct models.Product
		if err := db.Where("name = ? AND sector_id = ? AND deleted_at IS NULL",
			input.ProductName, user.SectorID).First(&existingProduct).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Já existe um produto com este nome no seu setor",
			})
			return
		}

		// Verifica se já existe uma solicitação pendente para o mesmo produto no setor
		var existingRequest models.ProductRegistrationRequest
		if err := db.Where("product_name = ? AND sector_id = ? AND status = ?",
			input.ProductName, user.SectorID, models.ProductRequestStatusPending).
			First(&existingRequest).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Já existe uma solicitação pendente para este produto no seu setor",
			})
			return
		}

		// Cria a solicitação
		request := models.ProductRegistrationRequest{
			ProductName:        input.ProductName,
			ProductDescription: input.ProductDescription,
			ProductUnit:        input.ProductUnit,
			Justification:      input.Justification,
			RequesterID:        uint(userID),
			SectorID:           user.SectorID,
			Status:             models.ProductRequestStatusPending,
		}

		if err := db.Create(&request).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar solicitação"})
			return
		}

		// Carrega a solicitação completa para retornar
		if err := db.Preload("Requester").
			Preload("Sector").
			First(&request, request.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar solicitação criada"})
			return
		}

		// Emite notificação para admins
		notifications.Publish(fmt.Sprintf("new-product-request:%d", request.ID))

		c.JSON(http.StatusCreated, request)
	}
}

// ListProductRegistrationRequests - Lista solicitações (admin vê todas, usuário vê suas)
func ListProductRegistrationRequests(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("userID")
		userRole := c.GetString("role")

		query := db.Preload("Requester").
			Preload("Sector").
			Preload("Processor").
			Preload("CreatedProduct")

		// Filtros opcionais
		status := c.Query("status")
		if status != "" {
			query = query.Where("status = ?", status)
		}

		// Se não for admin, filtra por requester
		if userRole != "admin" {
			query = query.Where("requester_id = ?", userID)
		}

		var requests []models.ProductRegistrationRequest
		if err := query.Order("created_at DESC").Find(&requests).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar solicitações"})
			return
		}

		c.JSON(http.StatusOK, requests)
	}
}

// GetProductRegistrationRequest - Busca solicitação específica
func GetProductRegistrationRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		userID := c.GetString("userID")
		userRole := c.GetString("role")

		var request models.ProductRegistrationRequest
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Processor").
			Preload("CreatedProduct").
			First(&request, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Solicitação não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar solicitação"})
			}
			return
		}

		// Verifica permissões
		if userRole != "admin" && utils.UintToString(request.RequesterID) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		c.JSON(http.StatusOK, request)
	}
}

// ProcessProductRegistrationRequest - Admin aprova/rejeita solicitação
func ProcessProductRegistrationRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode processar
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")
		userID := c.GetString("userID")

		var input processProductRegistrationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var request models.ProductRegistrationRequest
		if err := db.Preload("Requester").
			Preload("Sector").
			First(&request, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Solicitação não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar solicitação"})
			}
			return
		}

		// Verifica se pode ser processada
		if !request.CanBeProcessed() {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Esta solicitação já foi processada",
			})
			return
		}

		// Inicia transação
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Se aprovado, cria o produto
		var createdProductID *uint
		if input.Status == models.ProductRequestStatusApproved {
			// Verifica novamente se não existe produto com mesmo nome (concorrência)
			var existingProduct models.Product
			if err := tx.Where("name = ? AND sector_id = ? AND deleted_at IS NULL",
				request.ProductName, request.SectorID).First(&existingProduct).Error; err == nil {
				tx.Rollback()
				c.JSON(http.StatusConflict, gin.H{
					"error": "Produto com este nome já foi cadastrado no setor",
				})
				return
			}

			// Cria o produto
			product := models.Product{
				Name:        request.ProductName,
				Description: request.ProductDescription,
				Unit:        request.ProductUnit,
				SectorID:    request.SectorID,
				Status:      "available",
			}

			if err := tx.Create(&product).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Erro ao criar produto",
				})
				return
			}

			createdProductID = &product.ID
		}

		// Atualiza a solicitação
		processorID, _ := strconv.ParseUint(userID, 10, 64)
		processorIDUint := uint(processorID)
		now := time.Now()

		request.Status = input.Status
		request.AdminNotes = input.AdminNotes
		request.ProcessedBy = &processorIDUint
		request.ProcessedAt = &now
		request.CreatedProductID = createdProductID

		if err := tx.Save(&request).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao atualizar solicitação",
			})
			return
		}

		// Confirma transação
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao finalizar processamento",
			})
			return
		}

		// Carrega solicitação completa
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Processor").
			Preload("CreatedProduct").
			First(&request, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao carregar solicitação processada",
			})
			return
		}

		// Emite notificação
		notifications.Publish(fmt.Sprintf("product-request-processed:%d:%s", request.ID, request.Status))

		c.JSON(http.StatusOK, request)
	}
}

// UpdateProductRegistrationRequest - Usuário pode editar solicitação pendente
func UpdateProductRegistrationRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		userID := c.GetString("userID")
		userRole := c.GetString("role")

		var request models.ProductRegistrationRequest
		if err := db.First(&request, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Solicitação não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar solicitação"})
			}
			return
		}

		// Verifica permissões
		if userRole != "admin" && utils.UintToString(request.RequesterID) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		// Apenas solicitações pendentes podem ser editadas
		if !request.CanBeProcessed() {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Apenas solicitações pendentes podem ser editadas",
			})
			return
		}

		var input createProductRegistrationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Atualiza os campos
		request.ProductName = input.ProductName
		request.ProductDescription = input.ProductDescription
		request.ProductUnit = input.ProductUnit
		request.Justification = input.Justification

		if err := db.Save(&request).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao atualizar solicitação",
			})
			return
		}

		// Carrega solicitação completa
		if err := db.Preload("Requester").
			Preload("Sector").
			First(&request, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao carregar solicitação atualizada",
			})
			return
		}

		c.JSON(http.StatusOK, request)
	}
}

// DeleteProductRegistrationRequest - Remove solicitação pendente
func DeleteProductRegistrationRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		userID := c.GetString("userID")
		userRole := c.GetString("role")

		var request models.ProductRegistrationRequest
		if err := db.First(&request, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Solicitação não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar solicitação"})
			}
			return
		}

		// Verifica permissões (apenas o solicitante ou admin)
		if userRole != "admin" && utils.UintToString(request.RequesterID) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		// Apenas solicitações pendentes podem ser excluídas
		if !request.CanBeProcessed() {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Apenas solicitações pendentes podem ser excluídas",
			})
			return
		}

		// Soft delete
		if err := db.Delete(&request).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao excluir solicitação",
			})
			return
		}

		c.Status(http.StatusNoContent)
	}
}

// GetProductRegistrationStats - Estatísticas das solicitações (apenas admin)
func GetProductRegistrationStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		type Stats struct {
			TotalRequests    int64 `json:"totalRequests"`
			PendingRequests  int64 `json:"pendingRequests"`
			ApprovedRequests int64 `json:"approvedRequests"`
			RejectedRequests int64 `json:"rejectedRequests"`
		}

		var stats Stats

		// Total
		db.Model(&models.ProductRegistrationRequest{}).Count(&stats.TotalRequests)

		// Por status
		db.Model(&models.ProductRegistrationRequest{}).
			Where("status = ?", models.ProductRequestStatusPending).
			Count(&stats.PendingRequests)

		db.Model(&models.ProductRegistrationRequest{}).
			Where("status = ?", models.ProductRequestStatusApproved).
			Count(&stats.ApprovedRequests)

		db.Model(&models.ProductRegistrationRequest{}).
			Where("status = ?", models.ProductRequestStatusRejected).
			Count(&stats.RejectedRequests)

		c.JSON(http.StatusOK, stats)
	}
}
