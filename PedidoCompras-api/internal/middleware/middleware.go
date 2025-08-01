package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// TokenClaims estende RegisteredClaims com dados completos do usuário
type TokenClaims struct {
	Role       string `json:"role"`
	Name       string `json:"name"`       // ✅ ADICIONADO
	Email      string `json:"email"`      // ✅ ADICIONADO
	SectorID   uint   `json:"sectorId"`   // ✅ ADICIONADO
	SectorName string `json:"sectorName"` // ✅ ADICIONADO
	jwt.RegisteredClaims
}

// AuthMiddleware valida o Bearer token e injeta dados completos no contexto
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Header Authorization
		headerAutorizacao := c.GetHeader("Authorization")
		if headerAutorizacao == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
			return
		}
		partes := strings.SplitN(headerAutorizacao, " ", 2)
		if len(partes) != 2 || partes[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			return
		}
		tokenString := partes[1]

		// 2) Parse e valida com os nossos TokenClaims
		token, err := jwt.ParseWithClaims(
			tokenString,
			&TokenClaims{},
			func(token *jwt.Token) (interface{}, error) {
				return []byte(jwtSecret), nil
			},
		)
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			return
		}

		// 3) Extrai os claims customizados
		claims, ok := token.Claims.(*TokenClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			return
		}

		// ✅ INJETAR TODOS OS DADOS NO CONTEXTO
		c.Set("userID", claims.Subject)
		c.Set("role", claims.Role)
		c.Set("userName", claims.Name)         // ✅ NOME
		c.Set("userEmail", claims.Email)       // ✅ EMAIL
		c.Set("sectorID", claims.SectorID)     // ✅ SETOR ID
		c.Set("sectorName", claims.SectorName) // ✅ SETOR NOME

		c.Next()
	}
}
