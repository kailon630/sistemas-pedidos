package models

import (
	"time"

	"gorm.io/gorm"
)

type ProductRegistrationRequest struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Dados do produto solicitado
	ProductName        string `gorm:"size:255;not null"`
	ProductDescription string `gorm:"type:text"`
	ProductUnit        string `gorm:"size:50;not null"`   // kg, peça, caixa, litro, etc
	Justification      string `gorm:"type:text;not null"` // Por que precisa deste produto

	// Solicitante e setor
	RequesterID uint   `gorm:"not null"`
	Requester   User   `gorm:"foreignKey:RequesterID"`
	SectorID    uint   `gorm:"not null"`
	Sector      Sector `gorm:"foreignKey:SectorID"`

	// Status e processamento
	Status     string `gorm:"size:20;not null;default:'pending'"` // pending, approved, rejected
	AdminNotes string `gorm:"type:text"`                          // Observações do admin

	// Controle administrativo
	ProcessedBy *uint `gorm:"index"` // ID do admin que processou
	ProcessedAt *time.Time
	Processor   *User `gorm:"foreignKey:ProcessedBy"`

	// Produto criado (se aprovado)
	CreatedProductID *uint    `gorm:"index"`
	CreatedProduct   *Product `gorm:"foreignKey:CreatedProductID"`
}

// Constantes de status
const (
	ProductRequestStatusPending  = "pending"
	ProductRequestStatusApproved = "approved"
	ProductRequestStatusRejected = "rejected"
)

// Métodos auxiliares
func (prr *ProductRegistrationRequest) CanBeProcessed() bool {
	return prr.Status == ProductRequestStatusPending
}

func (prr *ProductRegistrationRequest) IsProcessed() bool {
	return prr.Status == ProductRequestStatusApproved || prr.Status == ProductRequestStatusRejected
}
