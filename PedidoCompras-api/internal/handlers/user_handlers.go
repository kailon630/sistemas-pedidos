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
// CreateUserUpdated - versão atualizada do CreateUser com validações de admin
func CreateUserUpdated(databaseConnection *gorm.DB) gin.HandlerFunc {
	type userInput struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role" binding:"required,oneof=admin requester"`
		SectorID uint   `json:"sectorId" binding:"required"`
	}

	return func(context *gin.Context) {
		var dadosEntrada userInput
		if err := context.ShouldBindJSON(&dadosEntrada); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Se está tentando criar admin, verificar permissões
		if dadosEntrada.Role == "admin" {
			currentRole, exists := context.Get("role")
			if !exists || currentRole != "admin" {
				context.JSON(http.StatusForbidden, gin.H{
					"error": "Apenas administradores podem criar outros administradores",
				})
				return
			}
		}

		// Verificar se email já existe
		var existingUser models.User
		if resultado := databaseConnection.Where("email = ?", dadosEntrada.Email).First(&existingUser); resultado.Error == nil {
			context.JSON(http.StatusBadRequest, gin.H{
				"error": "Este email já está em uso",
			})
			return
		}

		// Verificar se setor existe
		var sector models.Sector
		if resultado := databaseConnection.First(&sector, dadosEntrada.SectorID); resultado.Error != nil {
			context.JSON(http.StatusBadRequest, gin.H{
				"error": "Setor inválido",
			})
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
			SectorID:     dadosEntrada.SectorID,
		}

		if resultado := databaseConnection.Create(&usuario); resultado.Error != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao criar usuário",
			})
			return
		}

		// Carregar setor
		databaseConnection.Preload("Sector").First(&usuario, usuario.ID)

		// Não retornar o hash de senha
		response := gin.H{
			"id":       usuario.ID,
			"name":     usuario.Name,
			"email":    usuario.Email,
			"role":     usuario.Role,
			"sectorId": usuario.SectorID,
			"sector": gin.H{
				"ID":   usuario.Sector.ID,
				"Name": usuario.Sector.Name,
			},
			"createdAt": usuario.CreatedAt,
		}

		context.JSON(http.StatusCreated, response)
	}
}

// UpdateUser permite editar dados de um usuário existente
func UpdateUser(databaseConnection *gorm.DB) gin.HandlerFunc {
	type updateUserInput struct {
		Name     *string `json:"name"`
		Email    *string `json:"email"`
		Password *string `json:"password"` // Opcional - se fornecida, será alterada
		Role     *string `json:"role" binding:"omitempty,oneof=admin requester"`
		SectorID *uint   `json:"sectorId"`
	}

	return func(context *gin.Context) {
		// Verificar se usuário é admin
		currentRole, exists := context.Get("role")
		if !exists || currentRole != "admin" {
			context.JSON(http.StatusForbidden, gin.H{
				"error": "Apenas administradores podem editar usuários",
			})
			return
		}

		// Obter ID do usuário atual e do usuário a ser editado
		currentUserID, _ := context.Get("userID")
		targetUserID := context.Param("id")

		// Impedir que admin edite a si mesmo (segurança)
		if currentUserID == targetUserID {
			context.JSON(http.StatusForbidden, gin.H{
				"error": "Não é possível editar seu próprio usuário",
			})
			return
		}

		var dadosEntrada updateUserInput
		if err := context.ShouldBindJSON(&dadosEntrada); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Buscar usuário a ser editado
		var usuario models.User
		if resultado := databaseConnection.Preload("Sector").First(&usuario, targetUserID); resultado.Error != nil {
			context.JSON(http.StatusNotFound, gin.H{
				"error": "Usuário não encontrado",
			})
			return
		}

		// Verificar se é o último admin (não pode alterar role)
		if dadosEntrada.Role != nil && *dadosEntrada.Role != "admin" && usuario.Role == "admin" {
			var adminCount int64
			databaseConnection.Model(&models.User{}).Where("role = ? AND deleted_at IS NULL", "admin").Count(&adminCount)
			if adminCount <= 1 {
				context.JSON(http.StatusBadRequest, gin.H{
					"error": "Não é possível remover o último administrador do sistema",
				})
				return
			}
		}

		// Validar email único (se fornecido)
		if dadosEntrada.Email != nil {
			var existingUser models.User
			result := databaseConnection.Where("email = ? AND id != ?", *dadosEntrada.Email, targetUserID).First(&existingUser)
			if result.Error == nil {
				context.JSON(http.StatusBadRequest, gin.H{
					"error": "Este email já está em uso por outro usuário",
				})
				return
			}
		}

		// Atualizar campos fornecidos
		updates := make(map[string]interface{})

		if dadosEntrada.Name != nil {
			updates["name"] = *dadosEntrada.Name
		}

		if dadosEntrada.Email != nil {
			updates["email"] = *dadosEntrada.Email
		}

		if dadosEntrada.Role != nil {
			updates["role"] = *dadosEntrada.Role
		}

		if dadosEntrada.SectorID != nil {
			updates["sector_id"] = *dadosEntrada.SectorID
		}

		// Se senha foi fornecida, gerar novo hash
		if dadosEntrada.Password != nil && *dadosEntrada.Password != "" {
			senhaHash, err := bcrypt.GenerateFromPassword(
				[]byte(*dadosEntrada.Password),
				bcrypt.DefaultCost,
			)
			if err != nil {
				context.JSON(http.StatusInternalServerError, gin.H{
					"error": "Erro ao processar nova senha",
				})
				return
			}
			updates["password_hash"] = string(senhaHash)
		}

		// Executar atualização
		if resultado := databaseConnection.Model(&usuario).Updates(updates); resultado.Error != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao atualizar usuário",
			})
			return
		}

		// Recarregar usuário com dados atualizados
		databaseConnection.Preload("Sector").First(&usuario, targetUserID)

		// Retornar dados atualizados (sem senha)
		response := gin.H{
			"id":       usuario.ID,
			"name":     usuario.Name,
			"email":    usuario.Email,
			"role":     usuario.Role,
			"sectorId": usuario.SectorID,
			"sector": gin.H{
				"ID":   usuario.Sector.ID,
				"Name": usuario.Sector.Name,
			},
			"updatedAt": usuario.UpdatedAt,
		}

		context.JSON(http.StatusOK, response)
	}
}

// =============================================================================
// DELETE USER HANDLER
// =============================================================================

// DeleteUser realiza soft delete de um usuário
func DeleteUser(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(context *gin.Context) {
		// Verificar se usuário é admin
		currentRole, exists := context.Get("role")
		if !exists || currentRole != "admin" {
			context.JSON(http.StatusForbidden, gin.H{
				"error": "Apenas administradores podem excluir usuários",
			})
			return
		}

		// Obter IDs
		currentUserID, _ := context.Get("userID")
		targetUserID := context.Param("id")

		// Impedir que admin delete a si mesmo
		if currentUserID == targetUserID {
			context.JSON(http.StatusForbidden, gin.H{
				"error": "Não é possível excluir seu próprio usuário",
			})
			return
		}

		// Buscar usuário a ser deletado
		var usuario models.User
		if resultado := databaseConnection.First(&usuario, targetUserID); resultado.Error != nil {
			context.JSON(http.StatusNotFound, gin.H{
				"error": "Usuário não encontrado",
			})
			return
		}

		// Verificar se é o último admin
		if usuario.Role == "admin" {
			var adminCount int64
			databaseConnection.Model(&models.User{}).Where("role = ? AND deleted_at IS NULL", "admin").Count(&adminCount)
			if adminCount <= 1 {
				context.JSON(http.StatusBadRequest, gin.H{
					"error": "Não é possível excluir o último administrador do sistema",
				})
				return
			}
		}

		// Verificar se usuário tem requisições pendentes
		var activeRequestsCount int64
		databaseConnection.Table("purchase_requests").
			Where("requester_id = ? AND status NOT IN ('completed', 'cancelled')", targetUserID).
			Count(&activeRequestsCount)

		if activeRequestsCount > 0 {
			context.JSON(http.StatusBadRequest, gin.H{
				"error": "Não é possível excluir usuário com requisições ativas. Finalize ou cancele as requisições primeiro.",
			})
			return
		}

		// Realizar soft delete
		if resultado := databaseConnection.Delete(&usuario); resultado.Error != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao excluir usuário",
			})
			return
		}

		context.JSON(http.StatusOK, gin.H{
			"message": "Usuário excluído com sucesso",
			"deletedUser": gin.H{
				"id":    usuario.ID,
				"name":  usuario.Name,
				"email": usuario.Email,
			},
		})
	}
}

// =============================================================================
// PROMOTE TO ADMIN HANDLER
// =============================================================================

// PromoteToAdmin promove um usuário requester para admin
func PromoteToAdmin(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(context *gin.Context) {
		// Verificar se usuário é admin
		currentRole, exists := context.Get("role")
		if !exists || currentRole != "admin" {
			context.JSON(http.StatusForbidden, gin.H{
				"error": "Apenas administradores podem promover usuários",
			})
			return
		}

		targetUserID := context.Param("id")

		// Buscar usuário a ser promovido
		var usuario models.User
		if resultado := databaseConnection.Preload("Sector").First(&usuario, targetUserID); resultado.Error != nil {
			context.JSON(http.StatusNotFound, gin.H{
				"error": "Usuário não encontrado",
			})
			return
		}

		// Verificar se já é admin
		if usuario.Role == "admin" {
			context.JSON(http.StatusBadRequest, gin.H{
				"error": "Usuário já é administrador",
			})
			return
		}

		// Promover para admin
		if resultado := databaseConnection.Model(&usuario).Update("role", "admin"); resultado.Error != nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao promover usuário",
			})
			return
		}

		// Recarregar dados
		databaseConnection.Preload("Sector").First(&usuario, targetUserID)

		context.JSON(http.StatusOK, gin.H{
			"message": "Usuário promovido a administrador com sucesso",
			"user": gin.H{
				"id":       usuario.ID,
				"name":     usuario.Name,
				"email":    usuario.Email,
				"role":     usuario.Role,
				"sectorId": usuario.SectorID,
				"sector": gin.H{
					"ID":   usuario.Sector.ID,
					"Name": usuario.Sector.Name,
				},
			},
		})
	}
}

// =============================================================================
// GET SINGLE USER HANDLER
// =============================================================================

// GetUser retorna dados de um usuário específico
func GetUser(databaseConnection *gorm.DB) gin.HandlerFunc {
	return func(context *gin.Context) {
		// Verificar se usuário é admin
		currentRole, exists := context.Get("role")
		if !exists || currentRole != "admin" {
			context.JSON(http.StatusForbidden, gin.H{
				"error": "Apenas administradores podem visualizar detalhes de usuários",
			})
			return
		}

		userID := context.Param("id")

		var usuario models.User
		if resultado := databaseConnection.Preload("Sector").First(&usuario, userID); resultado.Error != nil {
			context.JSON(http.StatusNotFound, gin.H{
				"error": "Usuário não encontrado",
			})
			return
		}

		// Buscar estatísticas do usuário se for requester
		var stats gin.H
		if usuario.Role == "requester" {
			var totalRequests, pendingRequests, completedRequests int64

			databaseConnection.Table("purchase_requests").
				Where("requester_id = ?", userID).
				Count(&totalRequests)

			databaseConnection.Table("purchase_requests").
				Where("requester_id = ? AND status IN ('pending', 'in_review')", userID).
				Count(&pendingRequests)

			databaseConnection.Table("purchase_requests").
				Where("requester_id = ? AND status = 'completed'", userID).
				Count(&completedRequests)

			stats = gin.H{
				"totalRequests":     totalRequests,
				"pendingRequests":   pendingRequests,
				"completedRequests": completedRequests,
			}
		}

		response := gin.H{
			"id":        usuario.ID,
			"name":      usuario.Name,
			"email":     usuario.Email,
			"role":      usuario.Role,
			"sectorId":  usuario.SectorID,
			"createdAt": usuario.CreatedAt,
			"updatedAt": usuario.UpdatedAt,
			"sector": gin.H{
				"ID":   usuario.Sector.ID,
				"Name": usuario.Sector.Name,
			},
		}

		if stats != nil {
			response["stats"] = stats
		}

		context.JSON(http.StatusOK, response)
	}
}
