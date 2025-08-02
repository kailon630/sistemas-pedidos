package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/notifications"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type createRequesterInput struct {
	Name     string `json:"name"  binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	SectorID uint   `json:"sectorId" binding:"required"`
}

type RequestItemInput struct {
	ProductID uint       `json:"productId" binding:"required"`
	Quantity  int        `json:"quantity" binding:"required,min=1"`
	Deadline  *time.Time `json:"deadline"`
}

type createPurchaseRequestInput struct {
	Items        []RequestItemInput `json:"items" binding:"required,min=1"`
	Observations string             `json:"observations"`
}

type updatePurchaseRequestInput struct {
	Status       string `json:"status" binding:"omitempty,oneof=pending approved partial rejected"`
	AdminNotes   string `json:"adminNotes"`
	Observations string `json:"observations"`
}

type reviewRequestInput struct {
	Status     string `json:"status" binding:"required,oneof=approved partial rejected"`
	AdminNotes string `json:"adminNotes"`
}

type reviewItemInput struct {
	Status     string `json:"status" binding:"required,oneof=approved rejected"`
	AdminNotes string `json:"adminNotes"`
}

func ListPurchaseRequests(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) lê userID e role do contexto (setados no AuthMiddleware)
		userID := c.GetString("userID")
		userRole := c.GetString("role")

		// 2) monta query com preload dos relacionamentos
		query := databaseConnection.
			Preload("Requester.Sector").
			Preload("Sector").
			Preload("Items.Product").
			Preload("Items")

		// 3) se não for admin, filtra por requester_id
		if userRole != "admin" {
			query = query.Where("requester_id = ?", userID)
		}

		// 4) executa a busca
		var requisicoes []models.PurchaseRequest
		if err := query.Find(&requisicoes).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao consultar requisições",
			})
			return
		}

		// 5) retorna o array de requisições com todos os dados já preenchidos
		c.JSON(http.StatusOK, requisicoes)
	}
}

// CreatePurchaseRequest cria uma nova requisição com itens, usando o setor do usuário
func CreatePurchaseRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Extrai o userID do contexto (definido no middleware)
		userIDStr := c.GetString("userID")
		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "userID inválido"})
			return
		}

		// 2) Busca dados do usuário para pegar o SectorID
		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
			return
		}

		// 3) Faz o bind do JSON
		var input createPurchaseRequestInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 4) Valida se todos os produtos existem e pertencem ao setor do usuário
		var productIDs []uint
		for _, item := range input.Items {
			productIDs = append(productIDs, item.ProductID)
		}

		var products []models.Product
		if err := db.Where("id IN ? AND sector_id = ? AND status = ?",
			productIDs, user.SectorID, "available").Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao validar produtos"})
			return
		}

		if len(products) != len(productIDs) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Alguns produtos não foram encontrados ou não pertencem ao seu setor",
			})
			return
		}

		// 5) Inicia transação para criar requisição + itens
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// 6) Cria a requisição principal
		novaReq := models.PurchaseRequest{
			RequesterID:  uint(userID),
			SectorID:     user.SectorID, // Usa o setor do usuário
			Status:       "pending",
			Observations: input.Observations,
		}
		if err := tx.Create(&novaReq).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar requisição"})
			return
		}

		// 7) Cria os itens da requisição
		for _, itemInput := range input.Items {
			item := models.RequestItem{
				PurchaseRequestID: novaReq.ID,
				ProductID:         itemInput.ProductID,
				Quantity:          itemInput.Quantity,
				Status:            "pending",
				Deadline:          itemInput.Deadline,
			}
			if err := tx.Create(&item).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar itens da requisição"})
				return
			}
		}

		// 8) Confirma a transação
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao finalizar criação da requisição"})
			return
		}

		// 9) Carrega a requisição completa para retornar
		var requisicaoCompleta models.PurchaseRequest
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicaoCompleta, novaReq.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição criada"})
			return
		}

		// 10) Emite notificação SSE
		notifications.Publish(fmt.Sprintf("new-request:%d", novaReq.ID))

		c.JSON(http.StatusCreated, requisicaoCompleta)
	}
}

// GetPurchaseRequest busca uma requisição por ID (e autoriza acesso)
func GetPurchaseRequest(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		var requisicao models.PurchaseRequest
		if result := databaseConnection.
			Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID); result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro no banco"})
			}
			return
		}

		// Se não admin e não dono, bloquear
		if c.GetString("role") != "admin" &&
			utils.UintToString(requisicao.RequesterID) != c.GetString("userID") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		c.JSON(http.StatusOK, requisicao)
	}
}

// UpdatePurchaseRequest permite atualizar observações (usuário) ou status/notas admin (admin)
func UpdatePurchaseRequest(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var dados updatePurchaseRequestInput
		if err := c.ShouldBindJSON(&dados); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var requisicao models.PurchaseRequest
		if result := databaseConnection.First(&requisicao, requestID); result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			return
		}

		// Verifica permissões
		if userRole != "admin" {
			// Usuário comum só pode alterar observações da própria requisição
			if utils.UintToString(requisicao.RequesterID) != userID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
				return
			}
			// Usuário comum só pode alterar observações
			if dados.Status != "" || dados.AdminNotes != "" {
				c.JSON(http.StatusForbidden, gin.H{"error": "Apenas administradores podem alterar status e notas admin"})
				return
			}
			requisicao.Observations = dados.Observations
		} else {
			// Admin pode alterar tudo
			if dados.Status != "" {
				requisicao.Status = dados.Status
				now := time.Now()
				requisicao.ReviewedAt = &now

				// Define quem revisou
				reviewerID, _ := strconv.ParseUint(userID, 10, 64)
				reviewerIDUint := uint(reviewerID)
				requisicao.ReviewedBy = &reviewerIDUint
			}
			if dados.AdminNotes != "" {
				requisicao.AdminNotes = dados.AdminNotes
			}
			if dados.Observations != "" {
				requisicao.Observations = dados.Observations
			}
		}

		if result := databaseConnection.Save(&requisicao); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar requisição"})
			return
		}

		// Carrega requisição atualizada
		if err := databaseConnection.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição atualizada"})
			return
		}

		c.JSON(http.StatusOK, requisicao)

		notifications.Publish(
			fmt.Sprintf("update-request:%d:%s", requisicao.ID, requisicao.Status),
		)
	}
}

// ReviewRequest - Endpoint específico para admin revisar requisição completa
func ReviewRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode acessar
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")
		userID := c.GetString("userID")

		var input reviewRequestInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var requisicao models.PurchaseRequest
		if err := db.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Atualiza status da requisição
		requisicao.Status = input.Status
		requisicao.AdminNotes = input.AdminNotes
		now := time.Now()
		requisicao.ReviewedAt = &now

		reviewerID, _ := strconv.ParseUint(userID, 10, 64)
		reviewerIDUint := uint(reviewerID)
		requisicao.ReviewedBy = &reviewerIDUint

		if err := db.Save(&requisicao).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar requisição"})
			return
		}

		// Carrega requisição completa
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição"})
			return
		}

		c.JSON(http.StatusOK, requisicao)

		notifications.Publish(
			fmt.Sprintf("review-request:%d:%s", requisicao.ID, requisicao.Status),
		)
	}
}

// ReviewRequestItem - Admin aprova/rejeita item específico
func ReviewRequestItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode acessar
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		itemID := c.Param("itemId")

		// ✅ INPUT COM STATUS SUSPENSO E MOTIVO
		type reviewItemInput struct {
			Status           string `json:"status" binding:"required,oneof=approved rejected suspended"`
			AdminNotes       string `json:"adminNotes"`
			SuspensionReason string `json:"suspensionReason"` // ✅ NOVO CAMPO
		}

		var input reviewItemInput
		if err := c.ShouldBindJSON(&input); err != nil {
			fmt.Printf("❌ Erro no bind JSON: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// ✅ VALIDAÇÃO MAIS RIGOROSA: Se status é suspenso, motivo é obrigatório
		if input.Status == "suspended" && strings.TrimSpace(input.SuspensionReason) == "" {
			fmt.Printf("❌ Status suspenso sem motivo\n")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Motivo da suspensão é obrigatório"})
			return
		}

		// ✅ LOG DOS DADOS RECEBIDOS
		fmt.Printf("📝 Dados recebidos - ItemID: %s, Status: %s, SuspensionReason: %s, AdminNotes: %s\n",
			itemID, input.Status, input.SuspensionReason, input.AdminNotes)

		var item models.RequestItem
		if err := db.Preload("PurchaseRequest").First(&item, itemID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				fmt.Printf("❌ Item não encontrado: %s\n", itemID)
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			} else {
				fmt.Printf("❌ Erro ao buscar item: %v\n", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar item"})
			}
			return
		}

		// ✅ LOG DO ITEM ENCONTRADO
		fmt.Printf("📦 Item encontrado - ID: %d, Status atual: %s, RequestID: %d\n",
			item.ID, item.Status, item.PurchaseRequestID)

		// ✅ INICIAR TRANSAÇÃO PARA ATOMICIDADE
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Atualiza o item
		item.Status = input.Status
		item.AdminNotes = input.AdminNotes

		// ✅ ATUALIZAR MOTIVO DE SUSPENSÃO
		if input.Status == "suspended" {
			item.SuspensionReason = input.SuspensionReason
			fmt.Printf("✅ Definindo motivo de suspensão: %s\n", input.SuspensionReason)
		} else {
			item.SuspensionReason = "" // Limpar se não for suspenso
		}

		if err := tx.Save(&item).Error; err != nil {
			tx.Rollback()
			fmt.Printf("❌ Erro ao salvar item: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar item"})
			return
		}

		fmt.Printf("✅ Item salvo com sucesso - Status: %s\n", item.Status)

		// ✅ RECALCULAR STATUS DA REQUISIÇÃO - LÓGICA CORRIGIDA
		var totalItems, approvedItems, rejectedItems, suspendedItems, pendingItems int64

		tx.Model(&models.RequestItem{}).Where("purchase_request_id = ?", item.PurchaseRequestID).Count(&totalItems)
		tx.Model(&models.RequestItem{}).Where("purchase_request_id = ? AND status = ?", item.PurchaseRequestID, "approved").Count(&approvedItems)
		tx.Model(&models.RequestItem{}).Where("purchase_request_id = ? AND status = ?", item.PurchaseRequestID, "rejected").Count(&rejectedItems)
		tx.Model(&models.RequestItem{}).Where("purchase_request_id = ? AND status = ?", item.PurchaseRequestID, "suspended").Count(&suspendedItems)
		tx.Model(&models.RequestItem{}).Where("purchase_request_id = ? AND status = ?", item.PurchaseRequestID, "pending").Count(&pendingItems)

		// ✅ NOVA LÓGICA DE STATUS DA REQUISIÇÃO
		var requisicao models.PurchaseRequest
		if err := tx.First(&requisicao, item.PurchaseRequestID).Error; err == nil {
			oldStatus := requisicao.Status
			newStatus := requisicao.Status // manter atual como padrão

			// Se ainda tem itens pendentes, mantém pending
			if pendingItems > 0 {
				newStatus = "pending"
			} else {
				// Todos os itens foram revisados
				if approvedItems == totalItems {
					// ✅ TODOS APROVADOS = APROVADO
					newStatus = "approved"
				} else if rejectedItems == totalItems {
					// ✅ TODOS REJEITADOS = REJEITADO
					newStatus = "rejected"
				} else {
					// ✅ QUALQUER MISTURA = PARCIAL
					// (aprovados + rejeitados, aprovados + suspensos, etc.)
					newStatus = "partial"
				}
			}

			fmt.Printf("📊 Recálculo de status - RequestID: %d, Total: %d, Approved: %d, Rejected: %d, Suspended: %d, Pending: %d\n",
				item.PurchaseRequestID, totalItems, approvedItems, rejectedItems, suspendedItems, pendingItems)
			fmt.Printf("📊 Status: %s -> %s\n", oldStatus, newStatus)

			// ✅ SÓ ATUALIZAR SE MUDOU
			if newStatus != oldStatus {
				requisicao.Status = newStatus
				if err := tx.Save(&requisicao).Error; err != nil {
					tx.Rollback()
					fmt.Printf("❌ Erro ao atualizar status da requisição: %v\n", err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar status da requisição"})
					return
				}
				fmt.Printf("✅ Status da requisição atualizado: %s\n", newStatus)
			}
		}

		// ✅ CONFIRMAR TRANSAÇÃO
		if err := tx.Commit().Error; err != nil {
			fmt.Printf("❌ Erro ao fazer commit: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao finalizar atualização"})
			return
		}

		// Carrega item completo APÓS o commit
		if err := db.Preload("Product").Preload("PurchaseRequest").First(&item, itemID).Error; err != nil {
			fmt.Printf("❌ Erro ao carregar item atualizado: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar item"})
			return
		}

		fmt.Printf("✅ Operação concluída com sucesso - Item %d, Status: %s\n", item.ID, item.Status)

		c.JSON(http.StatusOK, item)

		// ✅ EMITIR NOTIFICAÇÃO
		notifications.Publish(
			fmt.Sprintf("review-item:%d:%s", item.ID, item.Status),
		)
	}
}

// ListRequesters retorna apenas os usuários cujo Role é "requester"
func ListRequesters(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var requesters []models.User
		if err := databaseConnection.
			Preload("Sector").
			Where("role = ?", "requester").
			Find(&requesters).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao consultar solicitantes"})
			return
		}
		ctx.JSON(http.StatusOK, requesters)
	}
}

func CreateRequester(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input createRequesterInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verifica se o setor existe
		var sector models.Sector
		if err := databaseConnection.First(&sector, input.SectorID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "Setor não encontrado"})
			} else {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar setor"})
			}
			return
		}

		hashDaSenha, err := bcrypt.GenerateFromPassword(
			[]byte(input.Password),
			bcrypt.DefaultCost,
		)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar hash da senha"})
			return
		}

		novoSolicitante := models.User{
			Name:         input.Name,
			Email:        input.Email,
			PasswordHash: string(hashDaSenha),
			Role:         "requester", // força o papel de solicitante
			SectorID:     input.SectorID,
		}

		if err := databaseConnection.Create(&novoSolicitante).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar solicitante"})
			return
		}

		// Carrega o solicitante com setor para retornar
		if err := databaseConnection.Preload("Sector").First(&novoSolicitante, novoSolicitante.ID).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar solicitante criado"})
			return
		}

		// remove o hash do retorno
		ctx.JSON(http.StatusCreated, gin.H{
			"id":     novoSolicitante.ID,
			"name":   novoSolicitante.Name,
			"email":  novoSolicitante.Email,
			"role":   novoSolicitante.Role,
			"sector": novoSolicitante.Sector,
		})
	}
}

// CompleteRequest - CORRIGIDO (removido partialItems desnecessário)
func CompleteRequest(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode concluir requisições
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")
		userID := c.GetString("userID")

		type completeInput struct {
			CompletionNotes string `json:"completionNotes"`
		}

		var input completeInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var requisicao models.PurchaseRequest
		if err := databaseConnection.Preload("Items").First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// ✅ VALIDAÇÃO 1: VERIFICAR SE AINDA HÁ ITENS PENDENTES
		var pendingItems int64
		databaseConnection.Model(&models.RequestItem{}).
			Where("purchase_request_id = ? AND status = ?", requestID, "pending").
			Count(&pendingItems)

		if pendingItems > 0 {
			fmt.Printf("❌ Tentativa de concluir requisição %s com %d itens pendentes\n", requestID, pendingItems)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Não é possível concluir requisição com %d itens ainda pendentes. Revise todos os itens primeiro.", pendingItems),
			})
			return
		}

		// ✅ VALIDAÇÃO 2: STATUS DA REQUISIÇÃO DEVE SER APPROVED OU PARTIAL
		if !requisicao.CanBeCompleted() {
			fmt.Printf("❌ Tentativa de concluir requisição %s com status inválido: %s\n", requestID, requisicao.Status)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Requisição deve estar aprovada ou parcialmente aprovada para ser concluída",
			})
			return
		}

		// ✅ VALIDAÇÃO 3: DEVE HAVER PELO MENOS UM ITEM APROVADO OU SUSPENSO
		// (Suspensos são considerados "em andamento", então podem ser concluídos)
		var usefulItems int64 // ← NOME MAIS CLARO
		databaseConnection.Model(&models.RequestItem{}).
			Where("purchase_request_id = ? AND status IN (?)", requestID, []string{"approved", "suspended"}).
			Count(&usefulItems)

		if usefulItems == 0 {
			fmt.Printf("❌ Tentativa de concluir requisição %s sem itens aprovados/suspensos\n", requestID)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Não é possível concluir requisição sem pelo menos um item aprovado ou suspenso",
			})
			return
		}

		fmt.Printf("✅ Validações aprovadas - Concluindo requisição %s (pendentes: %d, úteis: %d)\n",
			requestID, pendingItems, usefulItems)

		// Marca como concluída
		requisicao.Status = models.StatusCompleted
		requisicao.CompletionNotes = input.CompletionNotes
		now := time.Now()
		requisicao.CompletedAt = &now

		completedBy, _ := strconv.ParseUint(userID, 10, 64)
		completedByUint := uint(completedBy)
		requisicao.CompletedBy = &completedByUint

		if err := databaseConnection.Save(&requisicao).Error; err != nil {
			fmt.Printf("❌ Erro ao salvar conclusão: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao concluir requisição"})
			return
		}

		// Carrega requisição completa
		if err := databaseConnection.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição"})
			return
		}

		fmt.Printf("✅ Requisição %s concluída com sucesso\n", requestID)

		c.JSON(http.StatusOK, requisicao)

		notifications.Publish(
			fmt.Sprintf("complete-request:%d", requisicao.ID),
		)
	}
}

// ReopenRequest reabre uma requisição concluída
func ReopenRequest(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode reabrir requisições
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")

		var requisicao models.PurchaseRequest
		if err := databaseConnection.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Verifica se pode ser reaberta
		if !requisicao.CanBeReopened() {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Apenas requisições concluídas podem ser reabertas",
			})
			return
		}

		// Reabre a requisição
		requisicao.Status = models.StatusApproved // ou StatusPartial dependendo dos itens
		requisicao.CompletionNotes = ""
		requisicao.CompletedAt = nil
		requisicao.CompletedBy = nil

		if err := databaseConnection.Save(&requisicao).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao reabrir requisição"})
			return
		}

		// Carrega requisição completa
		if err := databaseConnection.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição"})
			return
		}

		c.JSON(http.StatusOK, requisicao)

		notifications.Publish(
			fmt.Sprintf("reopen-request:%d", requisicao.ID),
		)
	}
}
