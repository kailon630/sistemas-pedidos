package handlers

import (
	"io"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/notifications"
)

// NotificationsStream expõe SSE com eventos do servidor
func NotificationsStream() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientChan := notifications.RegisterClient()
		defer notifications.UnregisterClient(clientChan)

		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")

		c.Stream(func(w io.Writer) bool {
			if msg, ok := <-clientChan; ok {
				c.SSEvent("message", msg)
				return true
			}
			return false
		})
	}
}
