package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	Name         string `gorm:"size:100;not null"`
	Email        string `gorm:"size:100;uniqueIndex;not null"`
	PasswordHash string `gorm:"size:255;not null"`
	Role         string `gorm:"size:20;not null"`
	SectorID     uint   `gorm:"not null"`
	Sector       Sector `gorm:"foreignKey:SectorID"`
}
