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

	Status       string `gorm:"size:20;not null;default:'pending'"` // pending, approved, partial, rejected, completed
	Observations string `gorm:"type:text"`                          // opcional

	// ✅ NOVO CAMPO PARA PRIORIDADE
	Priority      string     `gorm:"size:20;not null;default:'normal'"` // urgent, high, normal, low
	PriorityBy    *uint      `gorm:"index"`                             // ID do admin que definiu a prioridade
	PriorityAt    *time.Time // quando a prioridade foi definida
	PriorityNotes string     `gorm:"type:text"` // motivo da priorização

	// Campos para controle admin (já existentes)
	AdminNotes string `gorm:"type:text"` // observações do admin sobre o pedido geral
	ReviewedBy *uint  // ID do admin que revisou
	ReviewedAt *time.Time

	// CAMPOS PARA CONCLUSÃO
	CompletionNotes string     `gorm:"type:text"` // observações da conclusão
	CompletedBy     *uint      // ID do admin que concluiu
	CompletedAt     *time.Time // data/hora da conclusão

	// RELACIONAMENTO COM ITEMS
	Items []RequestItem `gorm:"foreignKey:PurchaseRequestID"`
}

// CONSTANTES PARA STATUS
const (
	StatusPending   = "pending"   // Pendente de aprovação
	StatusApproved  = "approved"  // Aprovada
	StatusPartial   = "partial"   // Parcialmente aprovada
	StatusRejected  = "rejected"  // Rejeitada
	StatusCompleted = "completed" // Concluída/Atendida
)

// ✅ NOVAS CONSTANTES PARA PRIORIDADE
const (
	PriorityUrgent = "urgent" // Urgente - vermelho
	PriorityHigh   = "high"   // Alta - laranja
	PriorityNormal = "normal" // Normal - azul (padrão)
	PriorityLow    = "low"    // Baixa - cinza
)

// MÉTODOS AUXILIARES EXISTENTES

func (pr *PurchaseRequest) CanBeCompleted() bool {
	// ✅ VALIDAÇÃO MAIS RIGOROSA
	if pr.Status != StatusApproved && pr.Status != StatusPartial {
		return false
	}

	// ✅ VERIFICAÇÃO ADICIONAL - NÃO PERMITIR SE JÁ CONCLUÍDA
	if pr.Status == StatusCompleted {
		return false
	}

	return true
}

func (pr *PurchaseRequest) CanBeReopened() bool {
	return pr.Status == StatusCompleted
}

func (pr *PurchaseRequest) IsCompleted() bool {
	return pr.Status == StatusCompleted
}

// ✅ NOVOS MÉTODOS PARA PRIORIDADE
func (pr *PurchaseRequest) IsUrgent() bool {
	return pr.Priority == PriorityUrgent
}

func (pr *PurchaseRequest) IsHighPriority() bool {
	return pr.Priority == PriorityHigh || pr.Priority == PriorityUrgent
}

func (pr *PurchaseRequest) GetPriorityOrder() int {
	switch pr.Priority {
	case PriorityUrgent:
		return 1
	case PriorityHigh:
		return 2
	case PriorityNormal:
		return 3
	case PriorityLow:
		return 4
	default:
		return 3
	}
}
