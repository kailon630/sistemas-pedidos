package models

import (
	"time"

	"gorm.io/gorm"
)

type Attachment struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	PurchaseRequestID uint            `gorm:"not null"`
	PurchaseRequest   PurchaseRequest `gorm:"foreignKey:PurchaseRequestID"`

	FileName string `gorm:"size:255;not null"`
	FilePath string `gorm:"size:512;not null"` // caminho no disco
}
