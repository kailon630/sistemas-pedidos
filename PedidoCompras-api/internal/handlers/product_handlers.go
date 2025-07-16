package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/gorm"
)

type createProductInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Unit        string `json:"unit" binding:"required"` // kg, peça, caixa, litro, etc
	SectorID    uint   `json:"sectorId" binding:"required"`
}

type updateProductInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Unit        *string `json:"unit"`
	Status      *string `json:"status" binding:"omitempty,oneof=available discontinued"`
}

// ListProducts retorna produtos do setor do usuário (ou todos se admin) - OTIMIZADO
func ListProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var products []models.Product

		if userRole == "admin" {
			// Admin vê todos os produtos com preload otimizado
			if err := db.Preload("Sector").Find(&products).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao consultar produtos"})
				return
			}
		} else {
			// Usuário comum: busca o setor primeiro e depois filtra produtos
			var user models.User
			if err := db.Select("sector_id").First(&user, userID).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
				return
			}

			// Consulta otimizada: filtra por setor E status em uma única query
			if err := db.Preload("Sector").
				Where("sector_id = ? AND status = ?", user.SectorID, "available").
				Find(&products).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao consultar produtos"})
				return
			}
		}

		c.JSON(http.StatusOK, products)
	}
}

// CreateProduct cria um novo produto
func CreateProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var input createProductInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verifica permissões para criar produto
		if userRole != "admin" {
			// Se não for admin, verifica se está tentando criar produto para seu próprio setor
			var user models.User
			if err := db.Select("sector_id").First(&user, userID).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
				return
			}

			if user.SectorID != input.SectorID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Você só pode criar produtos para o seu setor"})
				return
			}
		}

		// Verifica se o setor existe
		var sectorExists bool
		if err := db.Model(&models.Sector{}).
			Select("count(*) > 0").
			Where("id = ?", input.SectorID).
			Find(&sectorExists).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar setor"})
			return
		}

		if !sectorExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Setor não encontrado"})
			return
		}

		// Cria o produto
		product := models.Product{
			Name:        input.Name,
			Description: input.Description,
			Unit:        input.Unit,
			SectorID:    input.SectorID,
			Status:      "available",
		}

		if err := db.Create(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar produto"})
			return
		}

		// Carrega o setor para retornar completo
		if err := db.Preload("Sector").First(&product, product.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar produto criado"})
			return
		}

		c.JSON(http.StatusCreated, product)
	}
}

// GetProduct retorna um produto específico
func GetProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productID := c.Param("id")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var product models.Product
		if err := db.Preload("Sector").First(&product, productID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produto"})
			}
			return
		}

		// Verifica permissão de acesso
		if userRole != "admin" {
			var user models.User
			if err := db.Select("sector_id").First(&user, userID).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
				return
			}

			if user.SectorID != product.SectorID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado a este produto"})
				return
			}
		}

		c.JSON(http.StatusOK, product)
	}
}

// UpdateProduct atualiza um produto existente
func UpdateProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productID := c.Param("id")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var product models.Product
		if err := db.First(&product, productID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produto"})
			}
			return
		}

		// Verifica permissões para atualizar
		if userRole != "admin" {
			var user models.User
			if err := db.Select("sector_id").First(&user, userID).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
				return
			}

			if user.SectorID != product.SectorID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Você só pode atualizar produtos do seu setor"})
				return
			}
		}

		var input updateProductInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Atualiza apenas os campos fornecidos
		updates := make(map[string]interface{})
		if input.Name != nil {
			updates["name"] = *input.Name
		}
		if input.Description != nil {
			updates["description"] = *input.Description
		}
		if input.Unit != nil {
			updates["unit"] = *input.Unit
		}
		if input.Status != nil {
			// Apenas admin pode alterar status
			if userRole != "admin" {
				c.JSON(http.StatusForbidden, gin.H{"error": "Apenas administradores podem alterar o status do produto"})
				return
			}
			updates["status"] = *input.Status
		}

		// Atualização otimizada
		if err := db.Model(&product).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar produto"})
			return
		}

		// Carrega o produto atualizado com setor
		if err := db.Preload("Sector").First(&product, product.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar produto atualizado"})
			return
		}

		c.JSON(http.StatusOK, product)
	}
}

// DeleteProduct remove um produto (soft delete)
func DeleteProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productID := c.Param("id")
		userRole := c.GetString("role")
		userID := c.GetString("userID")

		var product models.Product
		if err := db.Select("id", "sector_id").First(&product, productID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produto"})
			}
			return
		}

		// Verifica permissões para deletar
		if userRole != "admin" {
			var user models.User
			if err := db.Select("sector_id").First(&user, userID).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados do usuário"})
				return
			}

			if user.SectorID != product.SectorID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Você só pode deletar produtos do seu setor"})
				return
			}
		}

		// Verifica se o produto está sendo usado em alguma requisição ativa - OTIMIZADO
		var count int64
		if err := db.Model(&models.RequestItem{}).
			Where("product_id = ?", productID).
			Count(&count).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar dependências"})
			return
		}

		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Não é possível deletar produto que está sendo usado em requisições",
			})
			return
		}

		// Realiza o soft delete
		if err := db.Delete(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar produto"})
			return
		}

		c.Status(http.StatusNoContent)
	}
}
