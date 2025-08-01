package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/gorm"
)

type createSupplierInput struct {
	Name         string `json:"name" binding:"required"`
	CNPJ         string `json:"cnpj"` // ✅ NOVO CAMPO
	Contact      string `json:"contact"`
	Phone        string `json:"phone"`
	Email        string `json:"email" binding:"omitempty,email"`
	Observations string `json:"observations"`
}

type updateSupplierInput struct {
	Name         *string `json:"name"`
	CNPJ         *string `json:"cnpj"` // ✅ NOVO CAMPO
	Contact      *string `json:"contact"`
	Phone        *string `json:"phone"`
	Email        *string `json:"email" binding:"omitempty,email"`
	Observations *string `json:"observations"`
}

// ✅ FUNÇÃO AUXILIAR PARA VALIDAR CNPJ
func isValidCNPJ(cnpj string) bool {
	// Remove caracteres não numéricos
	cnpj = regexp.MustCompile(`[^\d]`).ReplaceAllString(cnpj, "")

	// Verifica se tem 14 dígitos
	if len(cnpj) != 14 {
		return false
	}

	// Verifica se não são todos os dígitos iguais
	if regexp.MustCompile(`^(\d)\1{13}$`).MatchString(cnpj) {
		return false
	}

	// Algoritmo de validação do CNPJ
	digits := make([]int, 14)
	for i, char := range cnpj {
		digits[i] = int(char - '0')
	}

	// Primeiro dígito verificador
	sum := 0
	weight := 5
	for i := 0; i < 12; i++ {
		sum += digits[i] * weight
		weight--
		if weight < 2 {
			weight = 9
		}
	}
	remainder := sum % 11
	firstDigit := 0
	if remainder >= 2 {
		firstDigit = 11 - remainder
	}

	if digits[12] != firstDigit {
		return false
	}

	// Segundo dígito verificador
	sum = 0
	weight = 6
	for i := 0; i < 13; i++ {
		sum += digits[i] * weight
		weight--
		if weight < 2 {
			weight = 9
		}
	}
	remainder = sum % 11
	secondDigit := 0
	if remainder >= 2 {
		secondDigit = 11 - remainder
	}

	return digits[13] == secondDigit
}

// ✅ FUNÇÃO PARA FORMATAR CNPJ
func formatCNPJ(cnpj string) string {
	// Remove caracteres não numéricos
	cnpj = regexp.MustCompile(`[^\d]`).ReplaceAllString(cnpj, "")

	// Se não tem 14 dígitos, retorna como está
	if len(cnpj) != 14 {
		return cnpj
	}

	// Formata: XX.XXX.XXX/XXXX-XX
	return cnpj[:2] + "." + cnpj[2:5] + "." + cnpj[5:8] + "/" + cnpj[8:12] + "-" + cnpj[12:]
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

// GetSupplier retorna um fornecedor específico
func GetSupplier(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		var supplier models.Supplier
		if err := db.First(&supplier, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Fornecedor não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar fornecedor"})
			}
			return
		}
		c.JSON(http.StatusOK, supplier)
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

		// ✅ VALIDAÇÃO DE CNPJ
		if input.CNPJ != "" {
			if !isValidCNPJ(input.CNPJ) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "CNPJ inválido"})
				return
			}

			// Verifica se CNPJ já existe
			var existingSupplier models.Supplier
			cleanCNPJ := regexp.MustCompile(`[^\d]`).ReplaceAllString(input.CNPJ, "")
			if err := db.Where("REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = ?", cleanCNPJ).First(&existingSupplier).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "CNPJ já cadastrado"})
				return
			}
		}

		forn := models.Supplier{
			Name:         strings.TrimSpace(input.Name),
			CNPJ:         formatCNPJ(input.CNPJ), // ✅ FORMATAR CNPJ
			Contact:      strings.TrimSpace(input.Contact),
			Phone:        strings.TrimSpace(input.Phone),
			Email:        strings.TrimSpace(input.Email),
			Observations: strings.TrimSpace(input.Observations),
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
		id, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		var forn models.Supplier
		if err := db.First(&forn, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Fornecedor não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar fornecedor"})
			}
			return
		}

		var input updateSupplierInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// ✅ VALIDAÇÃO DE CNPJ NA ATUALIZAÇÃO
		if input.CNPJ != nil && *input.CNPJ != "" {
			if !isValidCNPJ(*input.CNPJ) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "CNPJ inválido"})
				return
			}

			// Verifica se CNPJ já existe (exceto no próprio fornecedor)
			var existingSupplier models.Supplier
			cleanCNPJ := regexp.MustCompile(`[^\d]`).ReplaceAllString(*input.CNPJ, "")
			if err := db.Where("REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = ? AND id != ?", cleanCNPJ, id).First(&existingSupplier).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "CNPJ já cadastrado para outro fornecedor"})
				return
			}
		}

		// Atualizar campos
		if input.Name != nil {
			forn.Name = strings.TrimSpace(*input.Name)
		}
		if input.CNPJ != nil {
			forn.CNPJ = formatCNPJ(*input.CNPJ) // ✅ FORMATAR CNPJ
		}
		if input.Contact != nil {
			forn.Contact = strings.TrimSpace(*input.Contact)
		}
		if input.Phone != nil {
			forn.Phone = strings.TrimSpace(*input.Phone)
		}
		if input.Email != nil {
			forn.Email = strings.TrimSpace(*input.Email)
		}
		if input.Observations != nil {
			forn.Observations = strings.TrimSpace(*input.Observations)
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
		id, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		if err := db.Delete(&models.Supplier{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover fornecedor"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}
