package models

import (
	"time"

	"gorm.io/gorm"
)

type Supplier struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Name         string         `gorm:"size:255;not null" json:"name"`
	CNPJ         string         `gorm:"size:20" json:"cnpj"` // ✅ NOVO CAMPO
	Contact      string         `gorm:"size:255" json:"contact"`
	Phone        string         `gorm:"size:50" json:"phone"`
	Email        string         `gorm:"size:255" json:"email"`
	Observations string         `gorm:"type:text" json:"observations"`
}
