// internal/models/product.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	Name        string `gorm:"size:255;not null"`
	Description string `gorm:"type:text"`
	Unit        string `gorm:"size:50;not null"`
	SectorID    uint   `gorm:"not null"`
	Sector      Sector `gorm:"foreignKey:SectorID"`
	Status      string `gorm:"size:20;not null;default:'available'"`
}
