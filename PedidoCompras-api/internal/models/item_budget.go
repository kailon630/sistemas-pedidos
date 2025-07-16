package models

import (
	"gorm.io/gorm"
)

type ItemBudget struct {
	gorm.Model
	PurchaseRequestID uint    `json:"purchaseRequestId" binding:"required"`
	RequestItemID     uint    `json:"requestItemId" binding:"required"`
	SupplierID        uint    `json:"supplierId" binding:"required"`
	UnitPrice         float64 `json:"unitPrice" binding:"required,gt=0"`

	// relações opcionais para preload
	PurchaseRequest PurchaseRequest `gorm:"foreignKey:PurchaseRequestID"`
	RequestItem     RequestItem     `gorm:"foreignKey:RequestItemID"`
	Supplier        Supplier        `gorm:"foreignKey:SupplierID"`
}
