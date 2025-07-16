package database

import (
	"fmt"
	"log"

	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/config"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(cfg *config.Config) *gorm.DB {
	dataSourceName := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode,
	)
	databaseConnection, err := gorm.Open(postgres.Open(dataSourceName), &gorm.Config{})
	if err != nil {
		log.Fatalf("Erro ao conectar no banco de dados: %v", err)
	}
	log.Println("Conectado ao banco de dados")

	// AutoMigrate cria/atualiza tabelas conforme as structs
	// IMPORTANTE: A ordem importa devido às foreign keys
	err = databaseConnection.AutoMigrate(
		&models.Sector{},          // Primeiro, pois é referenciado por User e Product
		&models.User{},            // Segundo, pois é referenciado por PurchaseRequest
		&models.Product{},         // Terceiro, pois é referenciado por RequestItem
		&models.Supplier{},        // Referenciado por ItemBudget
		&models.PurchaseRequest{}, // Referenciado por RequestItem, Attachment, ItemBudget
		&models.RequestItem{},     // Referenciado por ItemBudget
		&models.Attachment{},      // Depende de PurchaseRequest
		&models.ItemBudget{},      // Depende de PurchaseRequest, RequestItem, Supplier
		&models.ItemReceipt{},     // NOVO - Depende de RequestItem, User, Supplier
	)
	if err != nil {
		log.Fatalf("Erro ao migrar tabelas: %v", err)
	}
	log.Println("Tabelas migradas com sucesso")

	return databaseConnection
}
