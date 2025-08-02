package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/notifications"
)

// NotificationsStream - SSE melhorado com gerenciamento robusto
func NotificationsStream() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ✅ EXTRAIR DADOS COMPLETOS DO USUÁRIO
		userID := c.GetString("userID")
		userRole := c.GetString("role")
		userName := c.GetString("userName")

		if userID == "" || userName == "" {
			c.JSON(400, gin.H{"error": "Dados de usuário incompletos"})
			return
		}

		fmt.Printf("📡 Nova conexão SSE - User: %s (%s), Role: %s\n", userName, userID, userRole)

		// ✅ HEADERS SSE CORRETOS
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Cache-Control")
		c.Writer.Header().Set("X-Accel-Buffering", "no") // Para NGINX

		// ✅ FLUSH INICIAL
		c.Writer.Flush()

		// ✅ REGISTRAR CLIENTE COM CONTEXTO
		clientID, clientChan := notifications.RegisterClient(userID, userRole, userName, c.Request.Context())
		defer func() {
			notifications.UnregisterClient(clientID)
			fmt.Printf("📡 Conexão SSE encerrada - User: %s\n", userName)
		}()

		// ✅ ENVIAR EVENTO DE CONEXÃO
		c.SSEvent("connected", fmt.Sprintf("Conectado como %s (%s)", userName, userRole))
		c.Writer.Flush()

		// ✅ TICKERS PARA MANUTENÇÃO
		pingTicker := time.NewTicker(30 * time.Second)
		defer pingTicker.Stop()

		// ✅ TIMEOUT CONFIGURÁVEL POR ROLE
		timeoutDuration := 60 * time.Minute
		if userRole == "admin" {
			timeoutDuration = 2 * time.Hour // Admins ficam conectados mais tempo
		}
		timeout := time.NewTimer(timeoutDuration)
		defer timeout.Stop()

		// ✅ LOOP PRINCIPAL MELHORADO
		for {
			select {
			case msg, ok := <-clientChan:
				if !ok {
					fmt.Printf("📡 Canal fechado para user %s\n", userName)
					c.SSEvent("disconnected", "Canal fechado")
					c.Writer.Flush()
					return
				}

				fmt.Printf("📡 Enviando notificação para %s: %s\n", userName, msg)
				c.SSEvent("message", msg)
				if flusher, ok := c.Writer.(http.Flusher); ok {
					flusher.Flush()
				}

			case <-pingTicker.C:
				// Atualizar último ping
				notifications.UpdateClientPing(clientID)
				c.SSEvent("ping", fmt.Sprintf("alive_%d", time.Now().Unix()))
				if flusher, ok := c.Writer.(http.Flusher); ok {
					flusher.Flush()
				}

			case <-timeout.C:
				fmt.Printf("📡 Timeout SSE para user %s após %v\n", userName, timeoutDuration)
				c.SSEvent("timeout", "Conexão expirou por inatividade")
				c.Writer.Flush()
				return

			case <-c.Request.Context().Done():
				fmt.Printf("📡 Contexto cancelado para user %s (cliente desconectou)\n", userName)
				return
			}
		}
	}
}

// ✅ HANDLER DE TESTE MELHORADO
func TestNotification() gin.HandlerFunc {
	return func(c *gin.Context) {
		message := c.DefaultQuery("message", "Teste de notificação")
		targetUser := c.Query("user_id") // Opcional: enviar para usuário específico

		fmt.Printf("📢 Teste: Enviando notificação: %s\n", message)

		if targetUser != "" {
			fmt.Printf("📢 Teste: Direcionado para usuário %s\n", targetUser)
			notifications.Publish(fmt.Sprintf("test:%s", message), targetUser)
		} else {
			notifications.Publish(fmt.Sprintf("test:%s", message))
		}

		stats := notifications.GetConnectedClients()

		c.JSON(200, gin.H{
			"message": "Notificação enviada",
			"target":  targetUser,
			"stats":   stats,
		})
	}
}

// ✅ NOVO: HANDLER PARA ESTATÍSTICAS
func NotificationStats() gin.HandlerFunc {
	return func(c *gin.Context) {
		stats := notifications.GetConnectedClients()
		c.JSON(200, stats)
	}
}

// ✅ NOVO: HANDLER PARA NOTIFICAÇÕES DIRECIONADAS
func SendTargetedNotification() gin.HandlerFunc {
	type NotificationInput struct {
		UserIDs []string               `json:"user_ids" binding:"required"`
		Type    string                 `json:"type" binding:"required"`
		Title   string                 `json:"title" binding:"required"`
		Message string                 `json:"message" binding:"required"`
		Data    map[string]interface{} `json:"data,omitempty"`
	}

	return func(c *gin.Context) {
		var input NotificationInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Construir mensagem estruturada
		notification := fmt.Sprintf("%s:%s:%s", input.Type, input.Title, input.Message)

		if len(input.UserIDs) > 0 {
			notifications.Publish(notification, input.UserIDs...)
		} else {
			notifications.Publish(notification)
		}

		stats := notifications.GetConnectedClients()
		c.JSON(200, gin.H{
			"message": "Notificação direcionada enviada",
			"targets": input.UserIDs,
			"stats":   stats,
		})
	}
}
