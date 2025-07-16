package main

import (
	"github.com/gin-gonic/gin"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/config"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/database"
	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/routes"
)

func main() {
	//carregar .env
	appConfig := config.LoadConfig()
	// conectar ao banco
	databaseConnection := database.Connect(appConfig)

	//criar router
	router := gin.Default()

	//registrar todas as rotas
	routes.Setup(router, databaseConnection, appConfig)

	//iniciar o servidor
	router.Run(":" + appConfig.Port)
}
