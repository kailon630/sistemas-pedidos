package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// SSEAuthMiddleware - Middleware especial para SSE que aceita token via query string
func SSEAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		fmt.Printf("🔍 SSE Auth: Verificando autenticação...\n")

		// ✅ TENTAR PEGAR TOKEN DO HEADER PRIMEIRO
		headerAuth := c.GetHeader("Authorization")
		if headerAuth != "" {
			parts := strings.SplitN(headerAuth, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
				fmt.Printf("✅ SSE Auth: Token encontrado no header\n")
			}
		}

		// ✅ SE NÃO ENCONTROU NO HEADER, TENTAR QUERY STRING
		if tokenString == "" {
			tokenString = c.Query("token")
			if tokenString != "" {
				fmt.Printf("✅ SSE Auth: Token encontrado na query string\n")
			}
		}

		// ✅ SE AINDA NÃO TEM TOKEN, RETORNAR ERRO
		if tokenString == "" {
			fmt.Printf("❌ SSE Auth: Token não fornecido\n")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
			return
		}

		// ✅ VALIDAR TOKEN
		token, err := jwt.ParseWithClaims(
			tokenString,
			&TokenClaims{},
			func(token *jwt.Token) (interface{}, error) {
				return []byte(jwtSecret), nil
			},
		)

		if err != nil || !token.Valid {
			fmt.Printf("❌ SSE Auth: Token inválido - %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			return
		}

		// ✅ EXTRAIR CLAIMS E INJETAR NO CONTEXTO
		claims, ok := token.Claims.(*TokenClaims)
		if !ok {
			fmt.Printf("❌ SSE Auth: Claims inválidos\n")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			return
		}

		fmt.Printf("✅ SSE Auth: Usuário autenticado - %s (%s)\n", claims.Name, claims.Subject)

		c.Set("userID", claims.Subject)
		c.Set("role", claims.Role)
		c.Set("userName", claims.Name)
		c.Set("userEmail", claims.Email)
		c.Set("sectorID", claims.SectorID)
		c.Set("sectorName", claims.SectorName)

		c.Next()
	}
}
