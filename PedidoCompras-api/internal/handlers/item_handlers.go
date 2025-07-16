package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/utils"
	"gorm.io/gorm"
)

// ListItemsForRequest lista todos os itens de uma requisição.
func ListItemsForRequest(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		// Verifica se o usuário pode acessar essa requisição
		var requisicao models.PurchaseRequest
		if err := databaseConnection.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Se não admin e não dono, bloquear
		if userRole != "admin" && utils.UintToString(requisicao.RequesterID) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		var itens []models.RequestItem
		if result := databaseConnection.
			Preload("Product").
			Where("purchase_request_id = ?", requestID).
			Find(&itens); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar itens"})
			return
		}
		c.JSON(http.StatusOK, itens)
	}
}

type createItemInput struct {
	ProductID uint       `json:"productId" binding:"required"`
	Quantity  int        `json:"quantity" binding:"required,min=1"`
	Deadline  *time.Time `json:"deadline"`
}

// CreateItem adiciona um novo item à requisição existente.
func CreateItem(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")
		userID := c.GetString("userID")

		// Verifica se a requisição existe e se o usuário pode modificá-la
		var requisicao models.PurchaseRequest
		if err := databaseConnection.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Apenas o dono pode adicionar itens à requisição (admin não adiciona itens)
		if utils.UintToString(requisicao.RequesterID) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Apenas o solicitante pode adicionar itens à requisição"})
			return
		}

		// Não permite adicionar itens se a requisição já foi revisada
		if requisicao.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível adicionar itens a requisições que já foram revisadas"})
			return
		}

		var dados createItemInput
		if err := c.ShouldBindJSON(&dados); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Busca dados do usuário para verificar o setor
		var user models.User
		if err := databaseConnection.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
			return
		}

		// Verifica se o produto existe e pertence ao setor do usuário
		var product models.Product
		if err := databaseConnection.Where("id = ? AND sector_id = ? AND status = ?",
			dados.ProductID, user.SectorID, "available").First(&product).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Produto não encontrado ou não disponível para seu setor"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar produto"})
			}
			return
		}

		// Verifica se o item já existe na requisição
		var existingItem models.RequestItem
		if err := databaseConnection.Where("purchase_request_id = ? AND product_id = ?",
			requestID, dados.ProductID).First(&existingItem).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Este produto já foi adicionado à requisição"})
			return
		}

		novoItem := models.RequestItem{
			PurchaseRequestID: utils.ParseUint(requestID),
			ProductID:         dados.ProductID,
			Quantity:          dados.Quantity,
			Status:            "pending",
			Deadline:          dados.Deadline,
		}

		if result := databaseConnection.Create(&novoItem); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar item"})
			return
		}

		// Carrega o item com o produto para retornar
		if err := databaseConnection.Preload("Product").First(&novoItem, novoItem.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar item criado"})
			return
		}

		c.JSON(http.StatusCreated, novoItem)
	}
}

type updateItemInput struct {
	Quantity   *int       `json:"quantity" binding:"omitempty,min=1"`
	Deadline   *time.Time `json:"deadline"`
	AdminNotes *string    `json:"adminNotes"` // apenas admin pode alterar
}

// UpdateItem altera campos de um item específico.
func UpdateItem(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID := c.Param("itemId")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var dados updateItemInput
		if err := c.ShouldBindJSON(&dados); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var item models.RequestItem
		if result := databaseConnection.Preload("PurchaseRequest").First(&item, itemID); result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar item"})
			}
			return
		}

		// Verifica permissões
		if userRole != "admin" {
			// Usuário comum só pode alterar itens da própria requisição
			if utils.UintToString(item.PurchaseRequest.RequesterID) != userID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
				return
			}

			// Usuário comum não pode alterar se a requisição já foi revisada
			if item.PurchaseRequest.Status != "pending" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível alterar itens de requisições já revisadas"})
				return
			}

			// Usuário comum não pode alterar adminNotes
			if dados.AdminNotes != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "Apenas administradores podem alterar notas administrativas"})
				return
			}
		}

		// Atualiza apenas os campos fornecidos
		if dados.Quantity != nil {
			item.Quantity = *dados.Quantity
		}
		if dados.Deadline != nil {
			item.Deadline = dados.Deadline
		}
		if dados.AdminNotes != nil && userRole == "admin" {
			item.AdminNotes = *dados.AdminNotes
		}

		if result := databaseConnection.Save(&item); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar item"})
			return
		}

		// Carrega o item atualizado com relacionamentos
		if err := databaseConnection.Preload("Product").Preload("PurchaseRequest").First(&item, itemID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar item atualizado"})
			return
		}

		c.JSON(http.StatusOK, item)
	}
}

// DeleteItem remove um item de uma requisição
func DeleteItem(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID := c.Param("itemId")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var item models.RequestItem
		if result := databaseConnection.Preload("PurchaseRequest").First(&item, itemID); result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar item"})
			}
			return
		}

		// Verifica permissões
		if userRole != "admin" {
			// Usuário comum só pode deletar itens da própria requisição
			if utils.UintToString(item.PurchaseRequest.RequesterID) != userID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
				return
			}

			// Usuário comum não pode deletar se a requisição já foi revisada
			if item.PurchaseRequest.Status != "pending" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível deletar itens de requisições já revisadas"})
				return
			}
		}

		// Remove o item
		if result := databaseConnection.Delete(&item); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar item"})
			return
		}

		c.Status(http.StatusNoContent)
	}
}

// GetItem busca um item específico
func GetItem(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID := c.Param("itemId")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var item models.RequestItem
		if result := databaseConnection.
			Preload("Product").
			Preload("PurchaseRequest").
			First(&item, itemID); result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar item"})
			}
			return
		}

		// Verifica permissões de acesso
		if userRole != "admin" && utils.UintToString(item.PurchaseRequest.RequesterID) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		c.JSON(http.StatusOK, item)
	}
}
