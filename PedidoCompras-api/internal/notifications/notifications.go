package notifications

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Client representa um cliente conectado com mais metadados
type Client struct {
	ID        string
	Channel   chan string
	UserID    string
	Role      string
	UserName  string
	Connected time.Time
	LastPing  time.Time
	Context   context.Context
	Cancel    context.CancelFunc
}

// ClientManager gerencia clientes conectados de forma mais robusta
type ClientManager struct {
	clients   map[string]*Client
	mu        sync.RWMutex
	cleanup   chan string
	cleanupWg sync.WaitGroup
}

var manager = &ClientManager{
	clients: make(map[string]*Client),
	cleanup: make(chan string, 100),
}

// Inicializar o gerenciador
func init() {
	go manager.cleanupWorker()
}

// RegisterClient registra um novo cliente com contexto
func RegisterClient(userID, role, userName string, parentCtx context.Context) (string, chan string) {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	clientID := fmt.Sprintf("client_%s_%d", userID, time.Now().UnixNano())
	ctx, cancel := context.WithCancel(parentCtx)
	ch := make(chan string, 100)

	client := &Client{
		ID:        clientID,
		Channel:   ch,
		UserID:    userID,
		Role:      role,
		UserName:  userName,
		Connected: time.Now(),
		LastPing:  time.Now(),
		Context:   ctx,
		Cancel:    cancel,
	}

	manager.clients[clientID] = client

	fmt.Printf("📡 Cliente registrado: %s (%s) - Total: %d\n",
		clientID, userName, len(manager.clients))

	// Monitorar timeout do cliente
	go manager.monitorClient(client)

	return clientID, ch
}

// UnregisterClient remove cliente de forma segura
func UnregisterClient(clientID string) {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	if client, exists := manager.clients[clientID]; exists {
		client.Cancel() // Cancela contexto
		close(client.Channel)
		delete(manager.clients, clientID)
		fmt.Printf("📡 Cliente removido: %s (%s) - Total: %d\n",
			clientID, client.UserName, len(manager.clients))
	}
}

// Publish envia mensagem para clientes específicos ou todos
func Publish(message string, targetUserID ...string) {
	manager.mu.RLock()
	defer manager.mu.RUnlock()

	if len(targetUserID) > 0 {
		// Enviar para usuários específicos
		for _, client := range manager.clients {
			for _, target := range targetUserID {
				if client.UserID == target {
					manager.sendToClient(client, message)
				}
			}
		}
	} else {
		// Broadcast para todos
		fmt.Printf("📡 Broadcasting: %s para %d clientes\n", message, len(manager.clients))
		for _, client := range manager.clients {
			manager.sendToClient(client, message)
		}
	}
}

// sendToClient envia mensagem para um cliente específico
func (cm *ClientManager) sendToClient(client *Client, message string) {
	select {
	case client.Channel <- message:
		// Sucesso
	default:
		// Canal bloqueado, agendar para limpeza
		fmt.Printf("⚠️ Canal bloqueado para cliente %s, agendando limpeza\n", client.ID)
		select {
		case cm.cleanup <- client.ID:
		default:
			// Se cleanup também está cheio, força remoção
			go func() {
				UnregisterClient(client.ID)
			}()
		}
	}
}

// monitorClient monitora timeout de cliente
func (cm *ClientManager) monitorClient(client *Client) {
	ticker := time.NewTicker(45 * time.Second) // Verifica a cada 45s
	defer ticker.Stop()

	for {
		select {
		case <-client.Context.Done():
			return
		case <-ticker.C:
			// Se último ping foi há mais de 60s, remove cliente
			if time.Since(client.LastPing) > 60*time.Second {
				fmt.Printf("📡 Cliente %s timeout, removendo\n", client.ID)
				UnregisterClient(client.ID)
				return
			}
		}
	}
}

// cleanupWorker processa limpeza assíncrona
func (cm *ClientManager) cleanupWorker() {
	for clientID := range cm.cleanup {
		UnregisterClient(clientID)
	}
}

// UpdateClientPing atualiza último ping do cliente
func UpdateClientPing(clientID string) {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	if client, exists := manager.clients[clientID]; exists {
		client.LastPing = time.Now()
	}
}

// GetConnectedClients retorna estatísticas
func GetConnectedClients() map[string]interface{} {
	manager.mu.RLock()
	defer manager.mu.RUnlock()

	stats := map[string]interface{}{
		"total":   len(manager.clients),
		"by_role": make(map[string]int),
		"clients": make([]map[string]interface{}, 0),
	}

	roleCount := make(map[string]int)
	for _, client := range manager.clients {
		roleCount[client.Role]++
		stats["clients"] = append(stats["clients"].([]map[string]interface{}), map[string]interface{}{
			"id":        client.ID,
			"user_name": client.UserName,
			"role":      client.Role,
			"connected": client.Connected,
			"last_ping": client.LastPing,
		})
	}
	stats["by_role"] = roleCount

	return stats
}
