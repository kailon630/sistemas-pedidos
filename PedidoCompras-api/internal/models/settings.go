package models

import (
	"time"

	"gorm.io/gorm"
)

// CompanySettings - Configurações da empresa
type CompanySettings struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Dados da empresa
	CompanyName string `gorm:"size:255;not null"`
	CNPJ        string `gorm:"size:20"`
	Address     string `gorm:"type:text"`
	Phone       string `gorm:"size:20"`
	Email       string `gorm:"size:100"`
	Website     string `gorm:"size:255"`

	// Logo
	LogoPath     string `gorm:"size:500"` // Caminho do arquivo
	LogoFilename string `gorm:"size:255"` // Nome original do arquivo
}

// SystemSettings - Configurações do sistema
type SystemSettings struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Política de senhas
	MinPasswordLength      int  `gorm:"default:6"`
	RequireUppercase       bool `gorm:"default:false"`
	RequireLowercase       bool `gorm:"default:true"`
	RequireNumbers         bool `gorm:"default:false"`
	RequireSpecialChars    bool `gorm:"default:false"`
	PasswordExpirationDays int  `gorm:"default:0"` // 0 = nunca expira

	// Sessão
	SessionTimeoutMinutes int `gorm:"default:60"`

	// Backup
	BackupEnabled   bool   `gorm:"default:false"`
	BackupFrequency string `gorm:"size:20;default:'daily'"` // daily, weekly, monthly
	BackupRetention int    `gorm:"default:30"`              // dias

	// Logs
	LogRetentionDays int  `gorm:"default:90"`
	AuditLogEnabled  bool `gorm:"default:true"`
}
