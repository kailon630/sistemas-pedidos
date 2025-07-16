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

// MyClaims estende RegisteredClaims com o Role do usuário
type MyClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func Login(databaseConnection *gorm.DB, appConfig *config.Config) gin.HandlerFunc {
	return func(context *gin.Context) {
		//recebe e valida JSON
		var dados loginInput
		if err := context.ShouldBindJSON(&dados); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		//buscar usario por e-mail
		var usuario models.User
		resultado := databaseConnection.
			Where("email = ?", dados.Email).
			First(&usuario)
		if resultado.Error != nil {
			context.JSON(http.StatusUnauthorized, gin.H{"error": "Credenicais invalidas"})
			return
		}

		//comparar hash da senha
		if err := bcrypt.CompareHashAndPassword(
			[]byte(usuario.PasswordHash),
			[]byte(dados.Password),
		); err != nil {
			context.JSON(http.StatusUnauthorized, gin.H{"error": "Crendencias invalidas"})
			return
		}
		//criar claims e token jwt
		myClaims := MyClaims{
			Role: usuario.Role,
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

		// 5) devolve o token
		context.JSON(http.StatusOK, gin.H{"token": tokenString})
	}
}
