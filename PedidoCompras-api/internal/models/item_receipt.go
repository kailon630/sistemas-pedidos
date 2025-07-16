package models

import (
	"time"

	"gorm.io/gorm"
)

type ItemReceipt struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Relacionamento com o item da requisição
	RequestItemID uint        `gorm:"not null"`
	RequestItem   RequestItem `gorm:"foreignKey:RequestItemID"`

	// Quantidade e responsável
	QuantityReceived int  `gorm:"not null"`
	ReceivedBy       uint `gorm:"not null"`
	Receiver         User `gorm:"foreignKey:ReceivedBy"`

	// Informações fiscais e de rastreamento
	InvoiceNumber  string `gorm:"size:100;not null"`
	InvoiceDate    *time.Time
	LotNumber      string `gorm:"size:100"`
	ExpirationDate *time.Time

	// Fornecedor que entregou (pode ser diferente do cotado)
	SupplierID *uint     `gorm:"index"`
	Supplier   *Supplier `gorm:"foreignKey:SupplierID"`

	// Observações e anexos
	Notes            string `gorm:"type:text"`
	AttachmentPath   string `gorm:"size:512"`               // Caminho para NF digitalizada
	ReceiptCondition string `gorm:"size:50;default:'good'"` // good, damaged, partial_damage

	// Campos para controle de qualidade
	QualityChecked   bool   `gorm:"default:false"`
	QualityNotes     string `gorm:"type:text"`
	RejectedQuantity int    `gorm:"default:0"`
}

// ReceivingStatus representa o status calculado de recebimento
type ReceivingStatus struct {
	ItemID           uint       `json:"itemId"`
	ProductName      string     `json:"productName"`
	QuantityOrdered  int        `json:"quantityOrdered"`
	QuantityReceived int        `json:"quantityReceived"`
	QuantityPending  int        `json:"quantityPending"`
	Status           string     `json:"status"` // pending, partial, complete, over_delivered
	LastReceivedAt   *time.Time `json:"lastReceivedAt"`
}
