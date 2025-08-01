package models

import "time"

// ReportFilters - Filtros para relatórios
type ReportFilters struct {
	StartDate    *time.Time `json:"startDate"`
	EndDate      *time.Time `json:"endDate"`
	SectorID     *uint      `json:"sectorId"`
	RequesterID  *uint      `json:"requesterId"`
	Status       *string    `json:"status"`
	Priority     *string    `json:"priority"`
	IncludeItems bool       `json:"includeItems"`
}

// RequestsReportData - Dados do relatório de requisições
type RequestsReportData struct {
	Summary    RequestsReportSummary `json:"summary"`
	Requests   []RequestReportItem   `json:"requests"`
	Charts     RequestsReportCharts  `json:"charts"`
	Pagination PaginationInfo        `json:"pagination"`
}

// RequestsReportSummary - Resumo geral do relatório
type RequestsReportSummary struct {
	TotalRequests       int64   `json:"totalRequests"`
	PendingRequests     int     `json:"pendingRequests"`
	ApprovedRequests    int     `json:"approvedRequests"`
	RejectedRequests    int     `json:"rejectedRequests"`
	CompletedRequests   int     `json:"completedRequests"`
	UrgentRequests      int     `json:"urgentRequests"`
	AverageProcessDays  float64 `json:"averageProcessDays"`
	TotalItems          int     `json:"totalItems"`
	MostActiveSector    string  `json:"mostActiveSector"`
	MostActiveRequester string  `json:"mostActiveRequester"`
}

// RequestReportItem - Item individual do relatório
type RequestReportItem struct {
	ID             uint                      `json:"id"`
	RequesterName  string                    `json:"requesterName"`
	RequesterEmail string                    `json:"requesterEmail"`
	SectorName     string                    `json:"sectorName"`
	Status         string                    `json:"status"`
	Priority       string                    `json:"priority"`
	CreatedAt      time.Time                 `json:"createdAt"`
	ReviewedAt     *time.Time                `json:"reviewedAt"`
	CompletedAt    *time.Time                `json:"completedAt"`
	ProcessDays    *int                      `json:"processDays"`
	TotalItems     int                       `json:"totalItems"`
	Observations   string                    `json:"observations"`
	AdminNotes     string                    `json:"adminNotes"`
	Items          []RequestReportItemDetail `json:"items,omitempty"`
}

// RequestReportItemDetail - Detalhes dos itens da requisição
type RequestReportItemDetail struct {
	ProductName string     `json:"productName"`
	Quantity    int        `json:"quantity"`
	Unit        string     `json:"unit"`
	Status      string     `json:"status"`
	Deadline    *time.Time `json:"deadline"`
}

// RequestsReportCharts - Dados para gráficos
type RequestsReportCharts struct {
	StatusDistribution []ChartDataPoint `json:"statusDistribution"`
	TimelineDays       []ChartDataPoint `json:"timelineDays"`
	SectorRanking      []ChartDataPoint `json:"sectorRanking"`
	PriorityBreakdown  []ChartDataPoint `json:"priorityBreakdown"`
}

// ChartDataPoint - Ponto de dados para gráficos
type ChartDataPoint struct {
	Label string  `json:"label"`
	Value int     `json:"value"`
	Extra *string `json:"extra,omitempty"`
}

// PaginationInfo - Informações de paginação
type PaginationInfo struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalPages int `json:"totalPages"`
	TotalItems int `json:"totalItems"`
}
