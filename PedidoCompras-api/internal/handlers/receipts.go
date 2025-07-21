package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/notifications"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type createReceiptInput struct {
	QuantityReceived int        `json:"quantityReceived" binding:"required,min=1"`
	InvoiceNumber    string     `json:"invoiceNumber" binding:"required"`
	InvoiceDate      *time.Time `json:"invoiceDate"`
	LotNumber        string     `json:"lotNumber"`
	ExpirationDate   *time.Time `json:"expirationDate"`
	SupplierID       *uint      `json:"supplierId"`
	Notes            string     `json:"notes"`
	ReceiptCondition string     `json:"receiptCondition" binding:"omitempty,oneof=good damaged partial_damage"`
	QualityChecked   bool       `json:"qualityChecked"`
	QualityNotes     string     `json:"qualityNotes"`
	RejectedQuantity int        `json:"rejectedQuantity"`
}

// CreateReceipt registra o recebimento de um item
// CreateReceipt registra o recebimento de um item
func CreateReceipt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 🔍 DEBUG: Log da requisição
		fmt.Printf("🔍 DEBUG CreateReceipt:\n")
		fmt.Printf("  - Method: %s\n", c.Request.Method)
		fmt.Printf("  - URL: %s\n", c.Request.URL.Path)
		fmt.Printf("  - User Role: %s\n", c.GetString("role"))
		fmt.Printf("  - User ID: %s\n", c.GetString("userID"))

		// Apenas admin pode registrar recebimentos
		if c.GetString("role") != "admin" {
			fmt.Printf("  - ❌ Acesso negado: usuário não é admin\n")
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		itemID := c.Param("itemId")
		userID := c.GetString("userID")

		fmt.Printf("  - ItemID: %s\n", itemID)
		fmt.Printf("  - UserID: %s\n", userID)

		var input createReceiptInput
		if err := c.ShouldBindJSON(&input); err != nil {
			fmt.Printf("  - ❌ Erro no binding JSON: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
			return
		}

		fmt.Printf("  - ✅ Input recebido: %+v\n", input)

		// Busca o item com a requisição
		var item models.RequestItem
		if err := db.Preload("PurchaseRequest").Preload("Product").First(&item, itemID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar item"})
			}
			return
		}

		// ✅ Validação de status permitido para recebimentos
		allowedStatuses := []string{"approved", "partial", "completed"}
		requestStatus := item.PurchaseRequest.Status
		isAllowed := false

		for _, status := range allowedStatuses {
			if requestStatus == status {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf(
					"Não é possível receber itens de requisições com status '%s'. Status permitidos: %s",
					requestStatus,
					strings.Join(allowedStatuses, ", "),
				),
			})
			return
		}

		// Verifica se o item foi aprovado
		if item.Status != "approved" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Este item não foi aprovado para compra",
			})
			return
		}

		// Calcula quantidade já recebida
		var totalReceived int64
		db.Model(&models.ItemReceipt{}).
			Where("request_item_id = ?", itemID).
			Select("COALESCE(SUM(quantity_received - rejected_quantity), 0)").
			Scan(&totalReceived)

		// Verifica se não está recebendo mais do que foi pedido
		if int(totalReceived)+input.QuantityReceived-input.RejectedQuantity > item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Quantidade excede o pedido. Pedido: %d, Já recebido: %d, Tentando receber: %d",
					item.Quantity, totalReceived, input.QuantityReceived),
			})
			return
		}

		// Define condição padrão se não especificada
		if input.ReceiptCondition == "" {
			input.ReceiptCondition = "good"
		}

		// Converte userID para uint
		receiverID, _ := strconv.ParseUint(userID, 10, 64)

		// Cria o registro de recebimento
		receipt := models.ItemReceipt{
			RequestItemID:    uint(item.ID),
			QuantityReceived: input.QuantityReceived,
			ReceivedBy:       uint(receiverID),
			InvoiceNumber:    input.InvoiceNumber,
			InvoiceDate:      input.InvoiceDate,
			LotNumber:        input.LotNumber,
			ExpirationDate:   input.ExpirationDate,
			SupplierID:       input.SupplierID,
			Notes:            input.Notes,
			ReceiptCondition: input.ReceiptCondition,
			QualityChecked:   input.QualityChecked,
			QualityNotes:     input.QualityNotes,
			RejectedQuantity: input.RejectedQuantity,
		}

		if err := db.Create(&receipt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao registrar recebimento"})
			return
		}

		// Carrega o recebimento completo
		if err := db.Preload("RequestItem.Product").
			Preload("Receiver").
			Preload("Supplier").
			First(&receipt, receipt.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao carregar recebimento"})
			return
		}

		// Emite notificação
		notifications.Publish(fmt.Sprintf("item-received:%d", item.ID))

		c.JSON(http.StatusCreated, receipt)
	}
}

// ListItemReceipts lista todos os recebimentos de um item
func ListItemReceipts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID := c.Param("itemId")

		// Verifica se o item existe
		var item models.RequestItem
		if err := db.Preload("PurchaseRequest").First(&item, itemID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar item"})
			}
			return
		}

		// Verifica permissões
		userRole := c.GetString("role")
		userID := c.GetString("userID")
		if userRole != "admin" && strconv.FormatUint(uint64(item.PurchaseRequest.RequesterID), 10) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		var receipts []models.ItemReceipt
		if err := db.Where("request_item_id = ?", itemID).
			Preload("Receiver").
			Preload("Supplier").
			Order("created_at DESC").
			Find(&receipts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar recebimentos"})
			return
		}

		c.JSON(http.StatusOK, receipts)
	}
}

// GetReceivingStatus retorna o status de recebimento de todos os itens de uma requisição
func GetReceivingStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")

		// Verifica se a requisição existe
		var request models.PurchaseRequest
		if err := db.First(&request, requestID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Requisição não encontrada"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar requisição"})
			}
			return
		}

		// Verifica permissões
		userRole := c.GetString("role")
		userID := c.GetString("userID")
		if userRole != "admin" && strconv.FormatUint(uint64(request.RequesterID), 10) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		// Query otimizada para buscar status de recebimento
		var statuses []models.ReceivingStatus
		err := db.Table("request_items ri").
			Select(`
				ri.id as item_id,
				p.name as product_name,
				ri.quantity as quantity_ordered,
				COALESCE(SUM(ir.quantity_received - ir.rejected_quantity), 0) as quantity_received,
				ri.quantity - COALESCE(SUM(ir.quantity_received - ir.rejected_quantity), 0) as quantity_pending,
				CASE 
					WHEN COALESCE(SUM(ir.quantity_received - ir.rejected_quantity), 0) = 0 THEN 'pending'
					WHEN COALESCE(SUM(ir.quantity_received - ir.rejected_quantity), 0) < ri.quantity THEN 'partial'
					WHEN COALESCE(SUM(ir.quantity_received - ir.rejected_quantity), 0) = ri.quantity THEN 'complete'
					ELSE 'over_delivered'
				END as status,
				MAX(ir.created_at) as last_received_at
			`).
			Joins("LEFT JOIN products p ON p.id = ri.product_id").
			Joins("LEFT JOIN item_receipts ir ON ir.request_item_id = ri.id").
			Where("ri.purchase_request_id = ? AND ri.status = ?", requestID, "approved").
			Group("ri.id, p.name, ri.quantity").
			Scan(&statuses).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao calcular status de recebimento"})
			return
		}

		// Calcula resumo geral
		var totalItems, completeItems, partialItems, pendingItems int
		for _, status := range statuses {
			totalItems++
			switch status.Status {
			case "complete":
				completeItems++
			case "partial":
				partialItems++
			case "pending":
				pendingItems++
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"summary": gin.H{
				"totalItems":    totalItems,
				"completeItems": completeItems,
				"partialItems":  partialItems,
				"pendingItems":  pendingItems,
			},
			"items": statuses,
		})
	}
}

// UploadReceiptAttachment faz upload da nota fiscal digitalizada
func UploadReceiptAttachment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode fazer upload
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		receiptID := c.Param("receiptId")

		// Verifica se o recebimento existe
		var receipt models.ItemReceipt
		if err := db.First(&receipt, receiptID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Recebimento não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar recebimento"})
			}
			return
		}

		// Processa o arquivo
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao ler arquivo: " + err.Error()})
			return
		}

		// Cria diretório específico para notas fiscais
		uploadDir := filepath.Join("uploads", "invoices")
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar diretório"})
			return
		}

		// Gera nome único
		timestamp := time.Now().UnixNano()
		filename := fmt.Sprintf("%d_receipt_%s_%s", timestamp, receiptID, filepath.Base(file.Filename))
		fullpath := filepath.Join(uploadDir, filename)

		// Salva o arquivo
		if err := c.SaveUploadedFile(file, fullpath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar arquivo"})
			return
		}

		// Atualiza o caminho no registro
		receipt.AttachmentPath = fullpath
		if err := db.Save(&receipt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar registro"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Arquivo enviado com sucesso",
			"filePath": fullpath,
		})
	}
}

// GetRequestReceiptsSummary retorna um resumo de todos os recebimentos de uma requisição
func GetRequestReceiptsSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.Param("id")

		// Query para buscar resumo
		type Summary struct {
			TotalReceipts    int        `json:"totalReceipts"`
			TotalQuantity    int        `json:"totalQuantity"`
			TotalRejected    int        `json:"totalRejected"`
			UniqueSuppliers  int        `json:"uniqueSuppliers"`
			FirstReceiptDate *time.Time `json:"firstReceiptDate"`
			LastReceiptDate  *time.Time `json:"lastReceiptDate"`
		}

		var summary Summary
		err := db.Table("item_receipts ir").
			Select(`
				COUNT(DISTINCT ir.id) as total_receipts,
				COALESCE(SUM(ir.quantity_received), 0) as total_quantity,
				COALESCE(SUM(ir.rejected_quantity), 0) as total_rejected,
				COUNT(DISTINCT ir.supplier_id) as unique_suppliers,
				MIN(ir.created_at) as first_receipt_date,
				MAX(ir.created_at) as last_receipt_date
			`).
			Joins("JOIN request_items ri ON ri.id = ir.request_item_id").
			Where("ri.purchase_request_id = ?", requestID).
			Scan(&summary).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar resumo"})
			return
		}

		c.JSON(http.StatusOK, summary)
	}
}

// DownloadReceiptInvoice faz o download da nota fiscal anexada
func DownloadReceiptInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		receiptID := c.Param("receiptId")

		// Busca o recebimento
		var receipt models.ItemReceipt
		if err := db.Preload("RequestItem.PurchaseRequest").First(&receipt, receiptID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Recebimento não encontrado"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar recebimento"})
			}
			return
		}

		// Verifica permissões
		userRole := c.GetString("role")
		userID := c.GetString("userID")
		if userRole != "admin" &&
			strconv.FormatUint(uint64(receipt.RequestItem.PurchaseRequest.RequesterID), 10) != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
			return
		}

		// Verifica se existe arquivo anexado
		if receipt.AttachmentPath == "" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Nenhuma nota fiscal anexada"})
			return
		}

		// Verifica se o arquivo existe
		if _, err := os.Stat(receipt.AttachmentPath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Arquivo não encontrado no servidor"})
			return
		}

		// Define o nome do arquivo para download
		downloadName := fmt.Sprintf("NF_%s_%s.pdf", receipt.InvoiceNumber,
			receipt.CreatedAt.Format("20060102"))

		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", downloadName))
		c.File(receipt.AttachmentPath)
	}
}

// ExportReceiptsExcel gera relatório Excel de recebimentos
func ExportReceiptsExcel(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Apenas admin pode gerar relatórios
		if c.GetString("role") != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}

		// Filtros opcionais
		startDate := c.Query("startDate") // formato: 2024-01-01
		endDate := c.Query("endDate")
		supplierID := c.Query("supplierId")
		requestID := c.Query("requestId")

		// Query base
		query := db.Model(&models.ItemReceipt{}).
			Preload("RequestItem.Product").
			Preload("RequestItem.PurchaseRequest.Requester").
			Preload("Receiver").
			Preload("Supplier")

		// Aplica filtros
		if startDate != "" {
			query = query.Where("item_receipts.created_at >= ?", startDate)
		}
		if endDate != "" {
			query = query.Where("item_receipts.created_at <= ?", endDate+" 23:59:59")
		}
		if supplierID != "" {
			query = query.Where("supplier_id = ?", supplierID)
		}
		if requestID != "" {
			query = query.Joins("JOIN request_items ON request_items.id = item_receipts.request_item_id").
				Where("request_items.purchase_request_id = ?", requestID)
		}

		var receipts []models.ItemReceipt
		if err := query.Order("item_receipts.created_at DESC").Find(&receipts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar recebimentos"})
			return
		}

		// Cria arquivo Excel
		f := excelize.NewFile()
		sheet := "Recebimentos"
		idx, _ := f.NewSheet(sheet)

		// Cabeçalhos
		headers := []string{
			"ID", "Data Recebimento", "Requisição", "Produto", "Quantidade Pedida",
			"Quantidade Recebida", "Quantidade Rejeitada", "Fornecedor", "NF Número",
			"Data NF", "Lote", "Validade", "Condição", "Recebido Por", "Observações",
		}

		for i, h := range headers {
			cell, _ := excelize.CoordinatesToCellName(i+1, 1)
			f.SetCellValue(sheet, cell, h)
		}

		// Dados
		for r, receipt := range receipts {
			row := r + 2

			f.SetCellValue(sheet, fmt.Sprintf("A%d", row), receipt.ID)
			f.SetCellValue(sheet, fmt.Sprintf("B%d", row), receipt.CreatedAt.Format("02/01/2006 15:04"))
			f.SetCellValue(sheet, fmt.Sprintf("C%d", row), receipt.RequestItem.PurchaseRequestID)
			f.SetCellValue(sheet, fmt.Sprintf("D%d", row), receipt.RequestItem.Product.Name)
			f.SetCellValue(sheet, fmt.Sprintf("E%d", row), receipt.RequestItem.Quantity)
			f.SetCellValue(sheet, fmt.Sprintf("F%d", row), receipt.QuantityReceived)
			f.SetCellValue(sheet, fmt.Sprintf("G%d", row), receipt.RejectedQuantity)

			supplierName := "-"
			if receipt.Supplier != nil {
				supplierName = receipt.Supplier.Name
			}
			f.SetCellValue(sheet, fmt.Sprintf("H%d", row), supplierName)

			f.SetCellValue(sheet, fmt.Sprintf("I%d", row), receipt.InvoiceNumber)

			invoiceDate := "-"
			if receipt.InvoiceDate != nil {
				invoiceDate = receipt.InvoiceDate.Format("02/01/2006")
			}
			f.SetCellValue(sheet, fmt.Sprintf("J%d", row), invoiceDate)

			f.SetCellValue(sheet, fmt.Sprintf("K%d", row), receipt.LotNumber)

			expirationDate := "-"
			if receipt.ExpirationDate != nil {
				expirationDate = receipt.ExpirationDate.Format("02/01/2006")
			}
			f.SetCellValue(sheet, fmt.Sprintf("L%d", row), expirationDate)

			f.SetCellValue(sheet, fmt.Sprintf("M%d", row), receipt.ReceiptCondition)
			f.SetCellValue(sheet, fmt.Sprintf("N%d", row), receipt.Receiver.Name)
			f.SetCellValue(sheet, fmt.Sprintf("O%d", row), receipt.Notes)
		}

		// Adiciona aba de resumo
		summarySheet := "Resumo"
		f.NewSheet(summarySheet)

		// Calcula estatísticas
		totalReceived := 0
		totalRejected := 0
		supplierMap := make(map[string]int)

		for _, r := range receipts {
			totalReceived += r.QuantityReceived
			totalRejected += r.RejectedQuantity
			if r.Supplier != nil {
				supplierMap[r.Supplier.Name]++
			}
		}

		// Escreve resumo
		f.SetCellValue(summarySheet, "A1", "RESUMO DE RECEBIMENTOS")
		f.SetCellValue(summarySheet, "A3", "Total de Recebimentos:")
		f.SetCellValue(summarySheet, "B3", len(receipts))
		f.SetCellValue(summarySheet, "A4", "Quantidade Total Recebida:")
		f.SetCellValue(summarySheet, "B4", totalReceived)
		f.SetCellValue(summarySheet, "A5", "Quantidade Total Rejeitada:")
		f.SetCellValue(summarySheet, "B5", totalRejected)
		f.SetCellValue(summarySheet, "A6", "Taxa de Rejeição:")
		if totalReceived > 0 {
			f.SetCellValue(summarySheet, "B6", fmt.Sprintf("%.2f%%", float64(totalRejected)/float64(totalReceived)*100))
		}

		// Fornecedores
		f.SetCellValue(summarySheet, "A8", "RECEBIMENTOS POR FORNECEDOR")
		row := 9
		for supplier, count := range supplierMap {
			f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), supplier)
			f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), count)
			row++
		}

		f.SetActiveSheet(idx)

		// Envia arquivo
		filename := fmt.Sprintf("recebimentos_%s.xlsx", time.Now().Format("20060102_150405"))
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
		_ = f.Write(c.Writer)
	}
}
