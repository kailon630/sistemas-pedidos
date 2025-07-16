package models

import (
	"time"

	"gorm.io/gorm"
)

type Sector struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	sector_ID uint `gorm:"not null"`

	Name string `gorm:"size:100;uniqueIndex;not null"`
}
