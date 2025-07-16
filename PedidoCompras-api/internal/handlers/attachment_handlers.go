package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
)

// UploadAttachment recebe multipart/form-data e salva o arquivo no disco + DB.
func UploadAttachment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) ID da requisição
		requestIDParam := c.Param("id")
		requestID, err := strconv.ParseUint(requestIDParam, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID de requisição inválido"})
			return
		}

		// 2) arquivo do form
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao ler arquivo: " + err.Error()})
			return
		}

		// 3) cria pasta uploads se não existir
		uploadDir := "uploads"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível criar diretório de upload"})
			return
		}

		// 4) gera nome único e salva
		timestamp := time.Now().UnixNano()
		filename := fmt.Sprintf("%d_%s", timestamp, filepath.Base(file.Filename))
		fullpath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, fullpath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao salvar arquivo"})
			return
		}

		// 5) persiste no DB
		attachment := models.Attachment{
			PurchaseRequestID: uint(requestID),
			FileName:          file.Filename,
			FilePath:          fullpath,
		}
		if err := db.Create(&attachment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar registro de anexo"})
			return
		}

		// 6) retorna metadados
		c.JSON(http.StatusCreated, gin.H{
			"id":        attachment.ID,
			"fileName":  attachment.FileName,
			"createdAt": attachment.CreatedAt,
		})
	}
}

// ListAttachments retorna todos os anexos de uma requisição.
func ListAttachments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestIDParam := c.Param("id")
		requestID, err := strconv.ParseUint(requestIDParam, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID de requisição inválido"})
			return
		}

		var attachments []models.Attachment
		if err := db.
			Where("purchase_request_id = ?", requestID).
			Find(&attachments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar anexos"})
			return
		}
		c.JSON(http.StatusOK, attachments)
	}
}

// DownloadAttachment faz stream do arquivo para o cliente.
func DownloadAttachment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		attachIDParam := c.Param("attachmentId")
		attachID, err := strconv.ParseUint(attachIDParam, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID de anexo inválido"})
			return
		}

		var attachment models.Attachment
		if err := db.First(&attachment, attachID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Anexo não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar anexo"})
			}
			return
		}

		// serve o arquivo
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", attachment.FileName))
		c.File(attachment.FilePath)
	}
}
