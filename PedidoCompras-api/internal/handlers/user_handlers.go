package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
)

// ListUsers retorna todos os usuários cadastrados.
func ListUsers(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(context *gin.Context) {
		var usuarios []models.User
		if resultado := databaseConnection.Find(&usuarios); resultado.Error != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao consultar usuários",
			})
			return
		}
		context.JSON(http.StatusOK, usuarios)
	}
}

// CreateUser permite cadastrar um novo usuário.
func CreateUser(databaseConnection *gorm.DB) gin.HandlerFunc {
	type userInput struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role" binding:"required,oneof=admin requester"`
	}

	return func(context *gin.Context) {
		var dadosEntrada userInput
		if err := context.ShouldBindJSON(&dadosEntrada); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Gera o hash da senha
		senhaHash, err := bcrypt.GenerateFromPassword(
			[]byte(dadosEntrada.Password),
			bcrypt.DefaultCost,
		)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao processar senha",
			})
			return
		}

		usuario := models.User{
			Name:         dadosEntrada.Name,
			Email:        dadosEntrada.Email,
			PasswordHash: string(senhaHash),
			Role:         dadosEntrada.Role,
		}

		if resultado := databaseConnection.Create(&usuario); resultado.Error != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao criar usuário",
			})
			return
		}

		// Não retornar o hash de senha
		response := gin.H{
			"id":    usuario.ID,
			"name":  usuario.Name,
			"email": usuario.Email,
			"role":  usuario.Role,
		}
		context.JSON(http.StatusCreated, response)
	}
}
