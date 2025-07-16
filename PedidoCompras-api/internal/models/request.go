// models/request.go - ATUALIZADO COM CAMPOS DE CONCLUSÃO

package models

import (
	"time"

	"gorm.io/gorm"
)

type PurchaseRequest struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	RequesterID uint `gorm:"not null"`
	Requester   User `gorm:"foreignKey:RequesterID"`

	// SectorID será derivado automaticamente do Requester.SectorID
	SectorID uint   `gorm:"not null"`
	Sector   Sector `gorm:"foreignKey:SectorID"`

	Status       string `gorm:"size:20;not null;default:'pending'"` // pending, approved, partial, rejected, completed ✅ NOVO STATUS
	Observations string `gorm:"type:text"`                          // opcional

	// Campos para controle admin (já existentes)
	AdminNotes string `gorm:"type:text"` // observações do admin sobre o pedido geral
	ReviewedBy *uint  // ID do admin que revisou
	ReviewedAt *time.Time

	// ✅ NOVOS CAMPOS PARA CONCLUSÃO
	CompletionNotes string     `gorm:"type:text"` // observações da conclusão
	CompletedBy     *uint      // ID do admin que concluiu
	CompletedAt     *time.Time // data/hora da conclusão

	// RELACIONAMENTO COM ITEMS
	Items []RequestItem `gorm:"foreignKey:PurchaseRequestID"`
}

// ✅ CONSTANTES PARA STATUS (OPCIONAL - FACILITA O USO)
const (
	StatusPending   = "pending"   // Pendente de aprovação
	StatusApproved  = "approved"  // Aprovada
	StatusPartial   = "partial"   // Parcialmente aprovada
	StatusRejected  = "rejected"  // Rejeitada
	StatusCompleted = "completed" // ✅ NOVO: Concluída/Atendida
)

// ✅ MÉTODOS AUXILIARES (OPCIONAL - FACILITA VALIDAÇÕES)
func (pr *PurchaseRequest) CanBeCompleted() bool {
	return pr.Status == StatusApproved || pr.Status == StatusPartial
}

func (pr *PurchaseRequest) CanBeReopened() bool {
	return pr.Status == StatusCompleted
}

func (pr *PurchaseRequest) IsCompleted() bool {
	return pr.Status == StatusCompleted
}
