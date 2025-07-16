package models

import (
	"time"

	"gorm.io/gorm"
)

type RequestItem struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	PurchaseRequestID uint            `gorm:"not null"`
	PurchaseRequest   PurchaseRequest `gorm:"foreignKey:PurchaseRequestID"`

	ProductID uint    `gorm:"not null"`
	Product   Product `gorm:"foreignKey:ProductID"`

	Quantity   int    `gorm:"not null"`
	Status     string `gorm:"size:20;not null;default:'pending'"` // pending, approved, rejected
	Deadline   *time.Time
	AdminNotes string `gorm:"type:text"` // observações do admin sobre este item específico
}
