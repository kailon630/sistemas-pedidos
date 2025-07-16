package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/gorm"
)

type createSupplierInput struct {
	Name         string `json:"name" binding:"required"`
	Contact      string `json:"contact"`
	Phone        string `json:"phone"`
	Email        string `json:"email,email"`
	Observations string `json:"observations"`
}

type updateSupplierInput struct {
	Name         *string `json:"name"`
	Contact      *string `json:"contact"`
	Phone        *string `json:"phone"`
	Email        *string `json:"email" binding:"omitempty,email"`
	Observations *string `json:"observations"`
}

// ListSuppliers retorna todos os fornecedores
func ListSuppliers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var suppliers []models.Supplier
		if err := db.Find(&suppliers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar fornecedores"})
			return
		}
		c.JSON(http.StatusOK, suppliers)
	}
}

// CreateSupplier cria um novo fornecedor
func CreateSupplier(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input createSupplierInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		forn := models.Supplier{
			Name:         input.Name,
			Contact:      input.Contact,
			Phone:        input.Phone,
			Email:        input.Email,
			Observations: input.Observations,
		}
		if err := db.Create(&forn).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar fornecedor"})
			return
		}
		c.JSON(http.StatusCreated, forn)
	}
}

// UpdateSupplier atualiza um fornecedor existente
func UpdateSupplier(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		id, _ := strconv.Atoi(idParam)

		var forn models.Supplier
		if err := db.First(&forn, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fornecedor não encontrado"})
			return
		}

		var input updateSupplierInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if input.Name != nil {
			forn.Name = *input.Name
		}
		if input.Contact != nil {
			forn.Contact = *input.Contact
		}
		if input.Phone != nil {
			forn.Phone = *input.Phone
		}
		if input.Email != nil {
			forn.Email = *input.Email
		}
		if input.Observations != nil {
			forn.Observations = *input.Observations
		}

		if err := db.Save(&forn).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar fornecedor"})
			return
		}
		c.JSON(http.StatusOK, forn)
	}
}

// DeleteSupplier remove um fornecedor (soft-delete)
func DeleteSupplier(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		id, _ := strconv.Atoi(idParam)

		if err := db.Delete(&models.Supplier{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover fornecedor"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}
