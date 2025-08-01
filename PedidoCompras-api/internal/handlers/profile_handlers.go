package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Estruturas para requests
type updateProfileInput struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}

type changePasswordInput struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// GetProfile - Busca dados do perfil do usuário logado
func GetProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ID de usuário inválido"})
			return
		}

		var user models.User
		if err := db.Preload("Sector").First(&user, userID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
			}
			return
		}

		// Retorna dados do usuário sem a senha
		userResponse := gin.H{
			"ID":       user.ID,
			"Name":     user.Name,
			"Email":    user.Email,
			"Role":     user.Role,
			"SectorID": user.SectorID,
			"Sector": gin.H{
				"ID":   user.Sector.ID,
				"Name": user.Sector.Name,
			},
			"CreatedAt": user.CreatedAt,
			"UpdatedAt": user.UpdatedAt,
		}

		c.JSON(http.StatusOK, userResponse)
	}
}

// UpdateProfile - Atualiza informações básicas do perfil
func UpdateProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ID de usuário inválido"})
			return
		}

		var input updateProfileInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Busca o usuário
		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
			}
			return
		}

		// Atualiza apenas o nome (outros campos são protegidos)
		user.Name = input.Name

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar perfil"})
			return
		}

		// Recarrega com setor para retornar completo
		if err := db.Preload("Sector").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar perfil atualizado"})
			return
		}

		// Retorna dados atualizados
		userResponse := gin.H{
			"ID":       user.ID,
			"Name":     user.Name,
			"Email":    user.Email,
			"Role":     user.Role,
			"SectorID": user.SectorID,
			"Sector": gin.H{
				"ID":   user.Sector.ID,
				"Name": user.Sector.Name,
			},
			"CreatedAt": user.CreatedAt,
			"UpdatedAt": user.UpdatedAt,
		}

		c.JSON(http.StatusOK, userResponse)
	}
}

// ChangePassword - Altera a senha do usuário
func ChangePassword(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.GetString("userID")
		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ID de usuário inválido"})
			return
		}

		var input changePasswordInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validação: nova senha deve ser diferente da confirmação
		if input.NewPassword != input.ConfirmPassword {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nova senha e confirmação não coincidem"})
			return
		}

		// Busca o usuário
		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
			}
			return
		}

		// Verifica senha atual
		if err := bcrypt.CompareHashAndPassword(
			[]byte(user.PasswordHash),
			[]byte(input.CurrentPassword),
		); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Senha atual incorreta"})
			return
		}

		// Validação de força da senha (mínimo 6 caracteres já validado pelo binding)
		if len(input.NewPassword) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nova senha deve ter pelo menos 6 caracteres"})
			return
		}

		// Não permitir senha muito simples
		weakPasswords := []string{"123456", "password", "123123", "admin", "qwerty"}
		for _, weak := range weakPasswords {
			if input.NewPassword == weak {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Senha muito simples. Escolha uma senha mais segura"})
				return
			}
		}

		// Gera hash da nova senha
		newHashBytes, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar nova senha"})
			return
		}

		// Atualiza a senha
		user.PasswordHash = string(newHashBytes)
		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar senha"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Senha alterada com sucesso"})
	}
}
