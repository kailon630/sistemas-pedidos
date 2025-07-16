package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/gorm"
)

// CreateItemBudget insere um orçamento para um item
func CreateItemBudget(db *gorm.DB) gin.HandlerFunc {
	type createBudgetInput struct {
		SupplierID uint    `json:"supplierId" binding:"required"`
		UnitPrice  float64 `json:"unitPrice"  binding:"required,gt=0"`
	}

	return func(c *gin.Context) {
		reqID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
		itemID, _ := strconv.ParseUint(c.Param("itemId"), 10, 64)

		var in createBudgetInput
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		budget := models.ItemBudget{
			PurchaseRequestID: uint(reqID),
			RequestItemID:     uint(itemID),
			SupplierID:        in.SupplierID,
			UnitPrice:         in.UnitPrice,
		}
		if err := db.Create(&budget).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar orçamento"})
			return
		}
		c.JSON(http.StatusCreated, budget)
	}
}

// UpdateBudget atualiza apenas o UnitPrice de um orçamento
func UpdateBudget(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		budgetID, _ := strconv.ParseUint(c.Param("budgetID"), 10, 64)
		var input struct {
			UnitPrice float64 `json:"unitPrice" binding:"required,gt=0"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var budget models.ItemBudget
		if err := db.First(&budget, budgetID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Orçamento não encontrado"})
			return
		}

		budget.UnitPrice = input.UnitPrice
		if err := db.Save(&budget).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar orçamento"})
			return
		}
		c.JSON(http.StatusOK, budget)
	}
}

// DeleteBudget remove um orçamento por ID
func DeleteBudget(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 🔍 DEBUG: Verificar dados do contexto
		fmt.Printf("🔍 DEBUG DeleteBudget:\n")
		fmt.Printf("  - Method: %s\n", c.Request.Method)
		fmt.Printf("  - URL: %s\n", c.Request.URL.Path)
		fmt.Printf("  - User Agent: %s\n", c.Request.UserAgent())

		// Debug dos dados extraídos pelo middleware
		userID := c.GetString("userID")
		role := c.GetString("role")

		fmt.Printf("  - userID extraído: '%s'\n", userID)
		fmt.Printf("  - role extraído: '%s'\n", role)
		fmt.Printf("  - role type: %T\n", role)
		fmt.Printf("  - role length: %d\n", len(role))
		fmt.Printf("  - role == 'admin': %t\n", role == "admin")
		fmt.Printf("  - role == 'requester': %t\n", role == "requester")

		// Debug de todos os valores do contexto
		fmt.Printf("  - Todos os valores do contexto:\n")
		for key, value := range c.Keys {
			fmt.Printf("    %s: %v (type: %T)\n", key, value, value)
		}

		// ✅ MUDANÇA: Permitir qualquer usuário autenticado
		// (remover verificação de admin temporariamente)

		budgetIDParam := c.Param("budgetID")
		fmt.Printf("  - budgetID param: '%s'\n", budgetIDParam)

		budgetID, err := strconv.ParseUint(budgetIDParam, 10, 64)
		if err != nil {
			fmt.Printf("  - ❌ Erro ao converter budgetID: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID de orçamento inválido"})
			return
		}

		fmt.Printf("  - budgetID convertido: %d\n", budgetID)

		// Verifica se o orçamento existe
		var budget models.ItemBudget
		if err := db.First(&budget, budgetID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				fmt.Printf("  - ❌ Orçamento não encontrado: %d\n", budgetID)
				c.JSON(http.StatusNotFound, gin.H{"error": "Orçamento não encontrado"})
			} else {
				fmt.Printf("  - ❌ Erro ao buscar orçamento: %v\n", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar orçamento"})
			}
			return
		}

		fmt.Printf("  - ✅ Orçamento encontrado: %+v\n", budget)

		// Remove o orçamento (soft delete)
		if err := db.Delete(&budget).Error; err != nil {
			fmt.Printf("  - ❌ Erro ao deletar orçamento: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar orçamento"})
			return
		}

		fmt.Printf("  - ✅ Orçamento deletado com sucesso: %d\n", budgetID)

		// Retorna status 204 (No Content) para indicar sucesso
		c.Status(http.StatusNoContent)
	}
}

// ListRequestBudgets lista todos os orçamentos de uma requisição
func ListRequestBudgets(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID, err := strconv.ParseUint(c.Param("id"), 10, 64) // ✅ "id"
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		var budgets []models.ItemBudget
		if err := db.
			Where("purchase_request_id = ?", reqID).
			Preload("RequestItem").
			Preload("Supplier").
			Find(&budgets).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar orçamentos"})
			return
		}
		c.JSON(http.StatusOK, budgets)
	}
}
