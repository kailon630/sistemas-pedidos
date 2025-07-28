package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/notifications"
	"gorm.io/gorm"
)

type setPriorityInput struct {
	Priority string `json:"priority" binding:"required,oneof=urgent high normal low"`
	Notes    string `json:"notes"`
}

// SetRequestPriority permite ao admin definir prioridade de uma requisição
func SetRequestPriority(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode definir prioridade
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")
		userID := c.GetString("userID")

		var input setPriorityInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Busca a requisição
		var requisicao models.PurchaseRequest
		if err := db.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Atualiza a prioridade
		adminID, _ := strconv.ParseUint(userID, 10, 64)
		adminIDUint := uint(adminID)
		now := time.Now()

		requisicao.Priority = input.Priority
		requisicao.PriorityBy = &adminIDUint
		requisicao.PriorityAt = &now
		requisicao.PriorityNotes = input.Notes

		if err := db.Save(&requisicao).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar prioridade"})
			return
		}

		// Carrega requisição completa para retornar
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição"})
			return
		}

		c.JSON(http.StatusOK, requisicao)

		// Emite notificação sobre mudança de prioridade
		notifications.Publish(
			fmt.Sprintf("priority-updated:%d:%s", requisicao.ID, requisicao.Priority),
		)
	}
}

// RemoveRequestPriority volta uma requisição para prioridade normal
func RemoveRequestPriority(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode remover prioridade
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")

		// Busca a requisição
		var requisicao models.PurchaseRequest
		if err := db.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Remove a priorização
		requisicao.Priority = models.PriorityNormal
		requisicao.PriorityBy = nil
		requisicao.PriorityAt = nil
		requisicao.PriorityNotes = ""

		if err := db.Save(&requisicao).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover prioridade"})
			return
		}

		// Carrega requisição completa
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição"})
			return
		}

		c.JSON(http.StatusOK, requisicao)

		// Emite notificação
		notifications.Publish(
			fmt.Sprintf("priority-removed:%d", requisicao.ID),
		)
	}
}

// ToggleUrgentPriority alterna entre urgente e normal (ação rápida)
func ToggleUrgentPriority(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode alterar prioridade
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		requestID := c.Param("id")
		userID := c.GetString("userID")

		// Busca a requisição
		var requisicao models.PurchaseRequest
		if err := db.First(&requisicao, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Alterna entre urgente e normal
		adminID, _ := strconv.ParseUint(userID, 10, 64)
		adminIDUint := uint(adminID)
		now := time.Now()

		if requisicao.Priority == models.PriorityUrgent {
			// Remove urgência
			requisicao.Priority = models.PriorityNormal
			requisicao.PriorityBy = nil
			requisicao.PriorityAt = nil
			requisicao.PriorityNotes = ""
		} else {
			// Marca como urgente
			requisicao.Priority = models.PriorityUrgent
			requisicao.PriorityBy = &adminIDUint
			requisicao.PriorityAt = &now
			if requisicao.PriorityNotes == "" {
				requisicao.PriorityNotes = "Marcada como urgente"
			}
		}

		if err := db.Save(&requisicao).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar prioridade"})
			return
		}

		// Carrega requisição completa
		if err := db.Preload("Requester").
			Preload("Sector").
			Preload("Items.Product").
			First(&requisicao, requestID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar requisição"})
			return
		}

		c.JSON(http.StatusOK, requisicao)

		// Emite notificação
		action := "priority-urgent"
		if requisicao.Priority == models.PriorityNormal {
			action = "priority-normal"
		}
		notifications.Publish(
			fmt.Sprintf("%s:%d", action, requisicao.ID),
		)
	}
}
