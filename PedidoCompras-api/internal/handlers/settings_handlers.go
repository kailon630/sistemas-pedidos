package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/gorm"
)

// Estruturas para requests
type companySettingsInput struct {
	CompanyName string `json:"companyName" binding:"required"`
	CNPJ        string `json:"cnpj"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Website     string `json:"website"`
}

type systemSettingsInput struct {
	MinPasswordLength      int    `json:"minPasswordLength" binding:"min=4,max=50"`
	RequireUppercase       bool   `json:"requireUppercase"`
	RequireLowercase       bool   `json:"requireLowercase"`
	RequireNumbers         bool   `json:"requireNumbers"`
	RequireSpecialChars    bool   `json:"requireSpecialChars"`
	PasswordExpirationDays int    `json:"passwordExpirationDays" binding:"min=0"`
	SessionTimeoutMinutes  int    `json:"sessionTimeoutMinutes" binding:"min=5,max=1440"`
	BackupEnabled          bool   `json:"backupEnabled"`
	BackupFrequency        string `json:"backupFrequency" binding:"oneof=daily weekly monthly"`
	BackupRetention        int    `json:"backupRetention" binding:"min=1"`
	LogRetentionDays       int    `json:"logRetentionDays" binding:"min=1"`
	AuditLogEnabled        bool   `json:"auditLogEnabled"`
}

// GetCompanySettings - Busca configurações da empresa
func GetCompanySettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		var settings models.CompanySettings
		// Busca a primeira configuração ou cria uma padrão
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Cria configuração padrão
				settings = models.CompanySettings{
					CompanyName: "PedidoCompras",
					CNPJ:        "",
					Address:     "",
					Phone:       "",
					Email:       "",
					Website:     "",
				}
				db.Create(&settings)
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar configurações"})
				return
			}
		}

		c.JSON(http.StatusOK, settings)
	}
}

// UpdateCompanySettings - Atualiza configurações da empresa
func UpdateCompanySettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		var input companySettingsInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var settings models.CompanySettings
		// Busca ou cria
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				settings = models.CompanySettings{}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar configurações"})
				return
			}
		}

		// Atualiza campos
		settings.CompanyName = input.CompanyName
		settings.CNPJ = input.CNPJ
		settings.Address = input.Address
		settings.Phone = input.Phone
		settings.Email = input.Email
		settings.Website = input.Website

		if err := db.Save(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar configurações"})
			return
		}

		c.JSON(http.StatusOK, settings)
	}
}

// UploadCompanyLogo - Upload do logo da empresa
func UploadCompanyLogo(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		// Parse do multipart form
		file, header, err := c.Request.FormFile("logo")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não encontrado"})
			return
		}
		defer file.Close()

		// ✅ VALIDAÇÕES MELHORADAS
		allowedTypes := map[string]string{
			".jpg":  "image/jpeg",
			".jpeg": "image/jpeg",
			".png":  "image/png",
			".gif":  "image/gif",
			".webp": "image/webp",
		}

		ext := strings.ToLower(filepath.Ext(header.Filename))
		if _, isValid := allowedTypes[ext]; !isValid {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP",
			})
			return
		}

		// Validar tamanho (max 5MB)
		if header.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Arquivo muito grande. Máximo 5MB",
			})
			return
		}

		// ✅ VALIDAR DIMENSÕES DA IMAGEM (opcional)
		// Reset file pointer
		file.Seek(0, 0)

		// Criar diretório se não existir
		uploadDir := "./uploads/logos"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar diretório"})
			return
		}

		// Gerar nome único para o arquivo
		filename := fmt.Sprintf("logo_%d%s", time.Now().Unix(), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Salvar arquivo
		out, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar arquivo"})
			return
		}
		defer out.Close()

		// Reset file pointer antes de copiar
		file.Seek(0, 0)
		_, err = io.Copy(out, file)
		if err != nil {
			// Limpar arquivo parcialmente criado
			os.Remove(filePath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao copiar arquivo"})
			return
		}

		// Buscar ou criar configurações
		var settings models.CompanySettings
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				settings = models.CompanySettings{CompanyName: "PedidoCompras"}
			} else {
				// Limpar arquivo se erro na DB
				os.Remove(filePath)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar configurações"})
				return
			}
		}

		// ✅ REMOVER LOGO ANTERIOR se existir (cleanup)
		if settings.LogoPath != "" {
			oldPath := settings.LogoPath
			if _, err := os.Stat(oldPath); err == nil {
				if removeErr := os.Remove(oldPath); removeErr != nil {
					// Log mas não falha - arquivo antigo pode estar em uso
					fmt.Printf("Aviso: Não foi possível remover logo anterior: %v\n", removeErr)
				}
			}
		}

		// Atualizar configurações
		settings.LogoPath = filePath
		settings.LogoFilename = header.Filename

		if err := db.Save(&settings).Error; err != nil {
			// Limpar arquivo se erro ao salvar
			os.Remove(filePath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar configurações"})
			return
		}

		// ✅ RESPOSTA MELHORADA
		c.JSON(http.StatusOK, gin.H{
			"message":      "Logo enviado com sucesso",
			"filename":     filename,
			"originalName": header.Filename,
			"size":         header.Size,
			"url":          fmt.Sprintf("/api/v1/settings/company/logo"),
			"settings":     settings, // Retorna settings atualizados
		})
	}
}

// GetCompanyLogo - Serve o logo da empresa
func GetCompanyLogo(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings models.CompanySettings
		if err := db.First(&settings).Error; err != nil || settings.LogoPath == "" {
			// Retorna um placeholder ou erro 404
			c.JSON(http.StatusNotFound, gin.H{"error": "Logo não encontrado"})
			return
		}

		// Verificar se arquivo existe
		if _, err := os.Stat(settings.LogoPath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo de logo não encontrado"})
			return
		}

		// ✅ HEADERS PARA CACHE (importante para performance)
		c.Header("Cache-Control", "public, max-age=3600") // Cache por 1 hora
		c.Header("Content-Type", getContentType(settings.LogoPath))

		// Servir arquivo
		c.File(settings.LogoPath)
	}
}

// ✅ HELPER para determinar content-type baseado na extensão
func getContentType(filePath string) string {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

// GetSystemSettings - Busca configurações do sistema
func GetSystemSettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		var settings models.SystemSettings
		// Busca a primeira configuração ou cria uma padrão
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				settings = models.SystemSettings{
					MinPasswordLength:      6,
					RequireUppercase:       false,
					RequireLowercase:       true,
					RequireNumbers:         false,
					RequireSpecialChars:    false,
					PasswordExpirationDays: 0,
					SessionTimeoutMinutes:  60,
					BackupEnabled:          false,
					BackupFrequency:        "daily",
					BackupRetention:        30,
					LogRetentionDays:       90,
					AuditLogEnabled:        true,
				}
				db.Create(&settings)
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar configurações"})
				return
			}
		}

		c.JSON(http.StatusOK, settings)
	}
}

// UpdateSystemSettings - Atualiza configurações do sistema
func UpdateSystemSettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		var input systemSettingsInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var settings models.SystemSettings
		// Busca ou cria
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				settings = models.SystemSettings{}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar configurações"})
				return
			}
		}

		// Atualiza campos
		settings.MinPasswordLength = input.MinPasswordLength
		settings.RequireUppercase = input.RequireUppercase
		settings.RequireLowercase = input.RequireLowercase
		settings.RequireNumbers = input.RequireNumbers
		settings.RequireSpecialChars = input.RequireSpecialChars
		settings.PasswordExpirationDays = input.PasswordExpirationDays
		settings.SessionTimeoutMinutes = input.SessionTimeoutMinutes
		settings.BackupEnabled = input.BackupEnabled
		settings.BackupFrequency = input.BackupFrequency
		settings.BackupRetention = input.BackupRetention
		settings.LogRetentionDays = input.LogRetentionDays
		settings.AuditLogEnabled = input.AuditLogEnabled

		if err := db.Save(&settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar configurações"})
			return
		}

		c.JSON(http.StatusOK, settings)
	}
}
