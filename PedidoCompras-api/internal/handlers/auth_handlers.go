package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/config"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type loginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// MyClaims estende RegisteredClaims com dados completos do usuário
type MyClaims struct {
	Role       string `json:"role"`
	Name       string `json:"name"`       // ✅ ADICIONADO
	Email      string `json:"email"`      // ✅ ADICIONADO
	SectorID   uint   `json:"sectorId"`   // ✅ ADICIONADO
	SectorName string `json:"sectorName"` // ✅ ADICIONADO
	jwt.RegisteredClaims
}

func Login(databaseConnection *gorm.DB, appConfig *config.Config) gin.HandlerFunc {
	return func(context *gin.Context) {
		// Recebe e valida JSON
		var dados loginInput
		if err := context.ShouldBindJSON(&dados); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Buscar usuário por e-mail COM o setor carregado
		var usuario models.User
		resultado := databaseConnection.
			Preload("Sector"). // ✅ CARREGAR SETOR
			Where("email = ?", dados.Email).
			First(&usuario)
		if resultado.Error != nil {
			context.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
			return
		}

		// Comparar hash da senha
		if err := bcrypt.CompareHashAndPassword(
			[]byte(usuario.PasswordHash),
			[]byte(dados.Password),
		); err != nil {
			context.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
			return
		}

		// ✅ CRIAR CLAIMS COM DADOS COMPLETOS
		myClaims := MyClaims{
			Role:       usuario.Role,
			Name:       usuario.Name,        // Nome do usuário
			Email:      usuario.Email,       // Email do usuário
			SectorID:   usuario.SectorID,    // ID do setor
			SectorName: usuario.Sector.Name, // Nome do setor
			RegisteredClaims: jwt.RegisteredClaims{
				Subject:   strconv.FormatUint(uint64(usuario.ID), 10),
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
			},
		}
		tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, myClaims)

		tokenString, err := tokenObj.SignedString([]byte(appConfig.JWTSecretKey))
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível gerar token"})
			return
		}

		// ✅ RETORNAR DADOS COMPLETOS DO USUÁRIO JUNTO COM O TOKEN
		context.JSON(http.StatusOK, gin.H{
			"token": tokenString,
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
