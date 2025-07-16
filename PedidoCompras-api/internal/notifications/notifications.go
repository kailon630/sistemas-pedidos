// internal/notifications/notifications.go
package notifications

import (
	"sync"
)

// broadcaster mantém registro de clientes conectados
var (
	clients   = make(map[chan string]struct{})
	clientsMu sync.RWMutex
)

// RegisterClient adiciona um canal para receber notificações
func RegisterClient() chan string {
	ch := make(chan string)
	clientsMu.Lock()
	clients[ch] = struct{}{}
	clientsMu.Unlock()
	return ch
}

// UnregisterClient remove o canal e fecha
func UnregisterClient(ch chan string) {
	clientsMu.Lock()
	delete(clients, ch)
	clientsMu.Unlock()
	close(ch)
}

// Publish envia a mensagem para todos os clientes
func Publish(message string) {
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	for ch := range clients {
		// enviar de forma não bloqueante
		select {
		case ch <- message:
		default:
		}
	}
}
