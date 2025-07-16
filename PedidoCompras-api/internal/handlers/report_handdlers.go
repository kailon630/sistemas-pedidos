package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"

	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
)

func ExportRequestsExcel(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// (Opcional) lê filtros da querystring, ex:
		statusFilter := c.Query("status")
		// dataFrom := c.Query("from")  // yyyy-mm-dd etc

		// Busca dados com preload
		query := db.Preload("Requester").Preload("Sector")
		if statusFilter != "" {
			query = query.Where("status = ?", statusFilter)
		}

		var reqs []models.PurchaseRequest
		if err := query.Find(&reqs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisições"})
			return
		}

		// Cria planilha
		f := excelize.NewFile()
		sheet := "Requests"
		idx, err := f.NewSheet(sheet)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar nova planilha Excel"})
			return
		}
		// Cabeçalho
		headers := []string{"ID", "Solicitante", "Setor", "Status", "Observações", "Criado Em"}
		for i, h := range headers {
			cell, _ := excelize.CoordinatesToCellName(i+1, 1)
			f.SetCellValue(sheet, cell, h)
		}
		// Linhas
		for r, pr := range reqs {
			row := r + 2
			f.SetCellValue(sheet, "A"+strconv.Itoa(row), pr.ID)
			f.SetCellValue(sheet, "B"+strconv.Itoa(row), pr.Requester.Name)
			f.SetCellValue(sheet, "C"+strconv.Itoa(row), pr.Sector.Name)
			f.SetCellValue(sheet, "D"+strconv.Itoa(row), pr.Status)
			f.SetCellValue(sheet, "E"+strconv.Itoa(row), pr.Observations)
			f.SetCellValue(sheet, "F"+strconv.Itoa(row), pr.CreatedAt.Format(time.RFC3339))
		}
		f.SetActiveSheet(idx)

		// Envia como attachment
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", `attachment; filename="requisicoes.xlsx"`)
		_ = f.Write(c.Writer)
	}
}
