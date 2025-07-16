package handlers // Declara que o arquivo pertence ao pacote 'handlers'.

import (
	"net/http" // Importa o pacote 'http' para lidar com códigos de status HTTP.

	"github.com/gin-gonic/gin" // Importa o framework Gin, usado para construir APIs web.
	"gorm.io/gorm"             // Importa o GORM, um ORM (Object-Relational Mapper) para Go, usado para interagir com o banco de dados.

	"github.com/kailon630/sistemas-pedidos/PedidoCompras-api/internal/models" // Importa o pacote 'models' que contém as definições dos modelos de dados, como 'Sector'.
)

// ListSectors retorna todos os setores.
func ListSectors(databaseConnection *gorm.DB) gin.HandlerFunc { // Define a função ListSectors que recebe uma conexão GORM com o banco de dados e retorna um gin.HandlerFunc.
	return func(ctx *gin.Context) { // Retorna uma função anônima que será o manipulador de rota do Gin.
		var sectors []models.Sector // Declara uma variável 'sectors' como um slice (lista) de structs 'Sector'.
		// Tenta encontrar todos os setores no banco de dados e armazena-os na variável 'sectors'.
		// Se ocorrer um erro durante a consulta, ele é capturado.
		if err := databaseConnection.Find(&sectors).Error; err != nil {
			// Se houver um erro, envia uma resposta JSON com o status de erro interno do servidor (500) e uma mensagem de erro.
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao consultar setores"})
			return // Interrompe a execução da função.
		}
		// Se a consulta for bem-sucedida, envia uma resposta JSON com o status OK (200) e a lista de setores.
		ctx.JSON(http.StatusOK, sectors)
	}
}

// CreateSector cadastra um novo setor.
func CreateSector(databaseConnection *gorm.DB) gin.HandlerFunc { // Define a função CreateSector que recebe uma conexão GORM com o banco de dados e retorna um gin.HandlerFunc.
	type createSectorInput struct { // Define uma nova estrutura 'createSectorInput' para representar o corpo da requisição de criação de setor.
		Name string `json:"name" binding:"required"` // Define o campo 'Name' como uma string, que será mapeada do JSON e é um campo obrigatório.
	}

	return func(ctx *gin.Context) { // Retorna uma função anônima que será o manipulador de rota do Gin.
		var input createSectorInput // Declara uma variável 'input' do tipo 'createSectorInput'.
		// Tenta vincular o corpo da requisição JSON à variável 'input'.
		// Se a vinculação falhar (ex: campo obrigatório faltando), ele captura o erro.
		if err := ctx.ShouldBindJSON(&input); err != nil {
			// Se houver um erro na vinculação, envia uma resposta JSON com o status de requisição inválida (400) e a mensagem de erro.
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return // Interrompe a execução da função.
		}

		newSector := models.Sector{Name: input.Name} // Cria uma nova instância de 'models.Sector' com o nome fornecido na entrada.
		// Tenta criar um novo setor no banco de dados usando os dados de 'newSector'.
		// Se ocorrer um erro durante a criação, ele é capturado.
		if err := databaseConnection.Create(&newSector).Error; err != nil {
			// Se houver um erro, envia uma resposta JSON com o status de erro interno do servidor (500) e uma mensagem de erro.
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar setor"})
			return // Interrompe a execução da função.
		}
		// Se o setor for criado com sucesso, envia uma resposta JSON com o status de criado (201) e os dados do novo setor.
		ctx.JSON(http.StatusCreated, newSector)
	}
}

// UpdateSector altera o nome de um setor existente.
func UpdateSector(databaseConnection *gorm.DB) gin.HandlerFunc { // Define a função UpdateSector que recebe uma conexão GORM com o banco de dados e retorna um gin.HandlerFunc.
	type updateSectorInput struct { // Define uma nova estrutura 'updateSectorInput' para representar o corpo da requisição de atualização de setor.
		Name string `json:"name" binding:"required"` // Define o campo 'Name' como uma string, que será mapeada do JSON e é um campo obrigatório.
	}

	return func(ctx *gin.Context) { // Retorna uma função anônima que será o manipulador de rota do Gin.
		sectorID := ctx.Param("id") // Obtém o ID do setor a ser atualizado a partir dos parâmetros da URL.

		var existingSector models.Sector // Declara uma variável 'existingSector' do tipo 'models.Sector'.
		// Tenta encontrar um setor no banco de dados pelo ID fornecido.
		// Se não encontrar ou ocorrer um erro, ele é capturado.
		if err := databaseConnection.First(&existingSector, sectorID).Error; err != nil {
			// Se o setor não for encontrado, envia uma resposta JSON com o status de não encontrado (404) e uma mensagem de erro.
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setor não encontrado"})
			return // Interrompe a execução da função.
		}

		var input updateSectorInput // Declara uma variável 'input' do tipo 'updateSectorInput'.
		// Tenta vincular o corpo da requisição JSON à variável 'input'.
		// Se a vinculação falhar, ele captura o erro.
		if err := ctx.ShouldBindJSON(&input); err != nil {
			// Se houver um erro na vinculação, envia uma resposta JSON com o status de requisição inválida (400) e a mensagem de erro.
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return // Interrompe a execução da função.
		}

		existingSector.Name = input.Name // Atualiza o nome do setor existente com o novo nome fornecido na entrada.
		// Tenta salvar as alterações no setor existente no banco de dados.
		// Se ocorrer um erro durante o salvamento, ele é capturado.
		if err := databaseConnection.Save(&existingSector).Error; err != nil {
			// Se houver um erro, envia uma resposta JSON com o status de erro interno do servidor (500) e uma mensagem de erro.
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar setor"})
			return // Interrompe a execução da função.
		}
		// Se a atualização for bem-sucedida, envia uma resposta JSON com o status OK (200) e os dados do setor atualizado.
		ctx.JSON(http.StatusOK, existingSector)
	}
}

// DeleteSector faz soft-delete de um setor.
func DeleteSector(databaseConnection *gorm.DB) gin.HandlerFunc { // Define a função DeleteSector que recebe uma conexão GORM com o banco de dados e retorna um gin.HandlerFunc.
	return func(ctx *gin.Context) { // Retorna uma função anônima que será o manipulador de rota do Gin.
		sectorID := ctx.Param("id") // Obtém o ID do setor a ser excluído a partir dos parâmetros da URL.

		var sector models.Sector // Declara uma variável 'sector' do tipo 'models.Sector'.
		// Tenta encontrar um setor no banco de dados pelo ID fornecido.
		// Se não encontrar ou ocorrer um erro, ele é capturado.
		if err := databaseConnection.First(&sector, sectorID).Error; err != nil {
			// Se o setor não for encontrado, envia uma resposta JSON com o status de não encontrado (404) e uma mensagem de erro.
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setor não encontrado"})
			return // Interrompe a execução da função.
		}

		// Tenta realizar um soft-delete do setor no banco de dados.
		// Um soft-delete geralmente marca o registro como excluído em vez de removê-lo fisicamente.
		// Se ocorrer um erro durante a exclusão, ele é capturado.
		if err := databaseConnection.Delete(&sector).Error; err != nil {
			// Se houver um erro, envia uma resposta JSON com o status de erro interno do servidor (500) e uma mensagem de erro.
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao excluir setor"})
			return // Interrompe a execução da função.
		}
		// Se o soft-delete for bem-sucedido, envia uma resposta com o status "No Content" (204), indicando sucesso sem corpo de resposta.
		ctx.Status(http.StatusNoContent)
	}
}
