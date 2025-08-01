package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"gorm.io/gorm"
)

// RequestsReportFilters - Input para filtros do relatório
type RequestsReportFilters struct {
	StartDate    string `form:"startDate"`
	EndDate      string `form:"endDate"`
	SectorID     string `form:"sectorId"`
	RequesterID  string `form:"requesterId"`
	Status       string `form:"status"`
	Priority     string `form:"priority"`
	IncludeItems string `form:"includeItems"`
	Page         string `form:"page"`
	PageSize     string `form:"pageSize"`
}

// GetRequestsReport - Gera relatório de requisições
func GetRequestsReport(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin (relatórios só para admins)
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		// Parse dos filtros
		var filters RequestsReportFilters
		if err := c.ShouldBindQuery(&filters); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Converter filtros
		reportFilters, err := parseReportFilters(filters)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Filtros inválidos: %v", err)})
			return
		}

		// Configurar paginação
		page := 1
		pageSize := 50
		if filters.Page != "" {
			if p, err := strconv.Atoi(filters.Page); err == nil && p > 0 {
				page = p
			}
		}
		if filters.PageSize != "" {
			if ps, err := strconv.Atoi(filters.PageSize); err == nil && ps > 0 && ps <= 100 {
				pageSize = ps
			}
		}

		// Gerar relatório
		reportData, err := generateRequestsReport(db, reportFilters, page, pageSize)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Erro ao gerar relatório: %v", err)})
			return
		}

		c.JSON(http.StatusOK, reportData)
	}
}

// parseReportFilters - Converte filtros string para estrutura
func parseReportFilters(input RequestsReportFilters) (models.ReportFilters, error) {
	filters := models.ReportFilters{}

	// Parse datas
	if input.StartDate != "" {
		if startDate, err := time.Parse("2006-01-02", input.StartDate); err == nil {
			filters.StartDate = &startDate
		} else {
			return filters, fmt.Errorf("data de início inválida")
		}
	}

	if input.EndDate != "" {
		if endDate, err := time.Parse("2006-01-02", input.EndDate); err == nil {
			// Adicionar 23:59:59 para incluir todo o dia
			endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			filters.EndDate = &endDate
		} else {
			return filters, fmt.Errorf("data de fim inválida")
		}
	}

	// Parse IDs
	if input.SectorID != "" {
		if sectorID, err := strconv.ParseUint(input.SectorID, 10, 32); err == nil {
			id := uint(sectorID)
			filters.SectorID = &id
		}
	}

	if input.RequesterID != "" {
		if requesterID, err := strconv.ParseUint(input.RequesterID, 10, 32); err == nil {
			id := uint(requesterID)
			filters.RequesterID = &id
		}
	}

	// Parse strings
	if input.Status != "" {
		filters.Status = &input.Status
	}

	if input.Priority != "" {
		filters.Priority = &input.Priority
	}

	// Parse boolean
	filters.IncludeItems = input.IncludeItems == "true"

	return filters, nil
}

// generateRequestsReport - Gera o relatório completo
func generateRequestsReport(db *gorm.DB, filters models.ReportFilters, page, pageSize int) (*models.RequestsReportData, error) {
	// Query base
	query := db.Model(&models.PurchaseRequest{}).
		Preload("Requester").
		Preload("Sector")

	if filters.IncludeItems {
		query = query.Preload("Items").Preload("Items.Product")
	}

	// Aplicar filtros
	query = applyFilters(query, filters)

	// Contagem total
	var totalCount int64
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, err
	}

	// Buscar requisições com paginação
	var requests []models.PurchaseRequest
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&requests).Error; err != nil {
		return nil, err
	}

	// Gerar dados do relatório
	reportData := &models.RequestsReportData{}

	// Summary
	summary, err := generateSummary(db, filters)
	if err != nil {
		return nil, err
	}
	reportData.Summary = *summary

	// Converter requisições
	reportData.Requests = convertRequestsToReport(requests)

	// Gráficos
	charts, err := generateCharts(db, filters)
	if err != nil {
		return nil, err
	}
	reportData.Charts = *charts

	// Paginação
	totalPages := int((totalCount + int64(pageSize) - 1) / int64(pageSize))
	reportData.Pagination = models.PaginationInfo{
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
		TotalItems: int(totalCount),
	}

	return reportData, nil
}

// applyFilters - Aplica filtros na query
func applyFilters(query *gorm.DB, filters models.ReportFilters) *gorm.DB {
	if filters.StartDate != nil {
		query = query.Where("created_at >= ?", *filters.StartDate)
	}

	if filters.EndDate != nil {
		query = query.Where("created_at <= ?", *filters.EndDate)
	}

	if filters.SectorID != nil {
		query = query.Where("sector_id = ?", *filters.SectorID)
	}

	if filters.RequesterID != nil {
		query = query.Where("requester_id = ?", *filters.RequesterID)
	}

	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}

	if filters.Priority != nil {
		query = query.Where("priority = ?", *filters.Priority)
	}

	return query
}

// generateSummary - Gera resumo do relatório
func generateSummary(db *gorm.DB, filters models.ReportFilters) (*models.RequestsReportSummary, error) {
	summary := &models.RequestsReportSummary{}

	// Query base para contagens
	baseQuery := db.Model(&models.PurchaseRequest{})
	baseQuery = applyFilters(baseQuery, filters)

	// Total geral
	if res := baseQuery.Count(&summary.TotalRequests); res.Error != nil {
		return nil, res.Error
	}
	// Por status
	statusCounts := []struct {
		Status string
		Count  int
	}{}

	if err := applyFilters(db.Model(&models.PurchaseRequest{}), filters).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusCounts).Error; err != nil {
		return nil, err
	}

	for _, sc := range statusCounts {
		switch sc.Status {
		case "pending":
			summary.PendingRequests = sc.Count
		case "approved":
			summary.ApprovedRequests = sc.Count
		case "rejected":
			summary.RejectedRequests = sc.Count
		case "completed":
			summary.CompletedRequests = sc.Count
		}
	}

	// Requisições urgentes
	urgentCount := int64(0)
	urgentQuery := applyFilters(db.Model(&models.PurchaseRequest{}), filters)
	urgentQuery.Where("priority = ?", "urgent").Count(&urgentCount)
	summary.UrgentRequests = int(urgentCount)

	// Tempo médio de processamento
	var avgDays float64
	db.Raw(`
		SELECT AVG(DATEDIFF(COALESCE(reviewed_at, NOW()), created_at)) 
		FROM purchase_requests 
		WHERE reviewed_at IS NOT NULL
	`).Scan(&avgDays)
	summary.AverageProcessDays = avgDays

	// Total de itens
	var totalItems int64
	db.Raw(`
		SELECT COUNT(*) 
		FROM request_items ri 
		INNER JOIN purchase_requests pr ON ri.purchase_request_id = pr.id
		WHERE pr.deleted_at IS NULL
	`).Scan(&totalItems)
	summary.TotalItems = int(totalItems)

	// Setor mais ativo
	var mostActiveSector string
	db.Raw(`
		SELECT s.name 
		FROM sectors s 
		INNER JOIN purchase_requests pr ON pr.sector_id = s.id 
		WHERE pr.deleted_at IS NULL 
		GROUP BY s.id, s.name 
		ORDER BY COUNT(*) DESC 
		LIMIT 1
	`).Scan(&mostActiveSector)
	summary.MostActiveSector = mostActiveSector

	// Solicitante mais ativo
	var mostActiveRequester string
	db.Raw(`
		SELECT u.name 
		FROM users u 
		INNER JOIN purchase_requests pr ON pr.requester_id = u.id 
		WHERE pr.deleted_at IS NULL 
		GROUP BY u.id, u.name 
		ORDER BY COUNT(*) DESC 
		LIMIT 1
	`).Scan(&mostActiveRequester)
	summary.MostActiveRequester = mostActiveRequester

	return summary, nil
}

// convertRequestsToReport - Converte requisições para formato de relatório
func convertRequestsToReport(requests []models.PurchaseRequest) []models.RequestReportItem {
	var reportItems []models.RequestReportItem

	for _, req := range requests {
		item := models.RequestReportItem{
			ID:             req.ID,
			RequesterName:  req.Requester.Name,
			RequesterEmail: req.Requester.Email,
			SectorName:     req.Sector.Name,
			Status:         req.Status,
			Priority:       req.Priority,
			CreatedAt:      req.CreatedAt,
			ReviewedAt:     req.ReviewedAt,
			CompletedAt:    req.CompletedAt,
			TotalItems:     len(req.Items),
			Observations:   req.Observations,
			AdminNotes:     req.AdminNotes,
		}

		// Calcular dias de processamento
		if req.ReviewedAt != nil {
			days := int(req.ReviewedAt.Sub(req.CreatedAt).Hours() / 24)
			item.ProcessDays = &days
		}

		// Incluir itens se solicitado
		if len(req.Items) > 0 {
			for _, reqItem := range req.Items {
				detail := models.RequestReportItemDetail{
					ProductName: reqItem.Product.Name,
					Quantity:    reqItem.Quantity,
					Unit:        reqItem.Product.Unit,
					Status:      reqItem.Status,
					Deadline:    reqItem.Deadline,
				}
				item.Items = append(item.Items, detail)
			}
		}

		reportItems = append(reportItems, item)
	}

	return reportItems
}

// generateCharts - Gera dados para gráficos
func generateCharts(db *gorm.DB, filters models.ReportFilters) (*models.RequestsReportCharts, error) {
	charts := &models.RequestsReportCharts{}

	// Distribuição por status
	var statusData []models.ChartDataPoint
	err := applyFilters(db.Model(&models.PurchaseRequest{}), filters).
		Select("status as label, COUNT(*) as value").
		Group("status").
		Scan(&statusData).Error
	if err != nil {
		return nil, err
	}
	charts.StatusDistribution = statusData

	// Timeline por dias (últimos 30 dias)
	var timelineData []models.ChartDataPoint
	db.Raw(`
		SELECT DATE(created_at) as label, COUNT(*) as value 
		FROM purchase_requests 
		WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
		AND deleted_at IS NULL
		GROUP BY DATE(created_at) 
		ORDER BY DATE(created_at)
	`).Scan(&timelineData)
	charts.TimelineDays = timelineData

	// Ranking por setor
	var sectorData []models.ChartDataPoint
	err = applyFilters(db.Model(&models.PurchaseRequest{}), filters).
		Select("sectors.name as label, COUNT(*) as value").
		Joins("INNER JOIN sectors ON sectors.id = purchase_requests.sector_id").
		Group("sectors.id, sectors.name").
		Order("COUNT(*) DESC").
		Limit(10).
		Scan(&sectorData).Error
	if err != nil {
		return nil, err
	}
	charts.SectorRanking = sectorData

	// Distribuição por prioridade
	var priorityData []models.ChartDataPoint
	err = applyFilters(db.Model(&models.PurchaseRequest{}), filters).
		Select("COALESCE(priority, 'normal') as label, COUNT(*) as value").
		Group("priority").
		Scan(&priorityData).Error
	if err != nil {
		return nil, err
	}
	charts.PriorityBreakdown = priorityData

	return charts, nil
}

// ExportRequestsReport - Exporta relatório em Excel
func ExportRequestsReport(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é admin
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		// Parse dos filtros
		var filters RequestsReportFilters
		if err := c.ShouldBindQuery(&filters); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		reportFilters, err := parseReportFilters(filters)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Filtros inválidos: %v", err)})
			return
		}

		// Gerar relatório completo (sem paginação para export)
		reportData, err := generateRequestsReport(db, reportFilters, 1, 10000)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Erro ao gerar relatório: %v", err)})
			return
		}

		// TODO: Implementar geração de Excel usando uma lib como excelize
		// Por agora, retorna JSON para download
		filename := fmt.Sprintf("relatorio_requisicoes_%s.json", time.Now().Format("2006-01-02"))

		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusOK, reportData)
	}
}
