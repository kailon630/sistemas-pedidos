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
		&models.Sector{},                     // Primeiro, pois é referenciado por User e Product
		&models.User{},                       // Segundo, pois é referenciado por PurchaseRequest
		&models.Product{},                    // Terceiro, pois é referenciado por RequestItem
		&models.Supplier{},                   // Referenciado por ItemBudget
		&models.PurchaseRequest{},            // Referenciado por RequestItem, Attachment, ItemBudget
		&models.RequestItem{},                // Referenciado por ItemBudget
		&models.Attachment{},                 // Depende de PurchaseRequest
		&models.ItemBudget{},                 // Depende de PurchaseRequest, RequestItem, Supplier
		&models.ItemReceipt{},                // Depende de RequestItem, User, Supplier
		&models.ProductRegistrationRequest{}, // NOVA TABELA - Depende de User, Sector, Product
		&models.CompanySettings{},            // NOVA TABELA
		&models.SystemSettings{},             // NOVA TABELA
	)
	if err != nil {
		log.Fatalf("Erro ao migrar tabelas: %v", err)
	}

	// ✅ NOVA MIGRAÇÃO: Adicionar campo is_priority se não existir
	if err := addPriorityFieldIfNotExists(databaseConnection); err != nil {
		log.Printf("Aviso: Erro ao adicionar campo de prioridade: %v", err)
	}

	log.Println("Tabelas migradas com sucesso")

	return databaseConnection
}

// ✅ FUNÇÃO para adicionar o campo is_priority manualmente (caso a migração automática falhe)
func addPriorityFieldIfNotExists(db *gorm.DB) error {
	// Verifica se o campo já existe
	var count int64
	err := db.Raw(`
		SELECT COUNT(*) 
		FROM information_schema.columns 
		WHERE table_name = 'purchase_requests' 
		AND column_name = 'is_priority'
	`).Scan(&count).Error

	if err != nil {
		return fmt.Errorf("erro ao verificar se coluna exists: %w", err)
	}

	// Se o campo não existe, adiciona
	if count == 0 {
		log.Println("Adicionando campo is_priority à tabela purchase_requests")
		err := db.Exec(`
			ALTER TABLE purchase_requests 
			ADD COLUMN is_priority BOOLEAN NOT NULL DEFAULT false
		`).Error
		if err != nil {
			return fmt.Errorf("erro ao adicionar coluna is_priority: %w", err)
		}
		log.Println("Campo is_priority adicionado com sucesso")
	}

	return nil
}

func addCNPJFieldToSuppliers(db *gorm.DB) error {
	// Verifica se o campo já existe
	var count int64
	err := db.Raw(`
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'cnpj'
    `).Scan(&count).Error

	if err != nil {
		return fmt.Errorf("erro ao verificar se coluna cnpj exists: %w", err)
	}

	// Se o campo não existe, adiciona
	if count == 0 {
		log.Println("Adicionando campo cnpj à tabela suppliers")
		err := db.Exec(`
            ALTER TABLE suppliers 
            ADD COLUMN cnpj VARCHAR(20) DEFAULT '' AFTER name
        `).Error
		if err != nil {
			return fmt.Errorf("erro ao adicionar coluna cnpj: %w", err)
		}
		log.Println("Campo cnpj adicionado com sucesso à tabela suppliers")
	} else {
		log.Println("Campo cnpj já existe na tabela suppliers")
	}

	return nil
}
