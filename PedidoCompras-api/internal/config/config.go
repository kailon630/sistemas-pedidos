package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBSSLMode    string
	JWTSecretKey string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: .env não encontrado")
	}

	return &Config{
		Port:         os.Getenv("PORT"),
		DBHost:       os.Getenv("DB_HOST"),
		DBPort:       os.Getenv("DB_PORT"),
		DBUser:       os.Getenv("DB_USER"),
		DBPassword:   os.Getenv("DB_PASSWORD"),
		DBName:       os.Getenv("DB_NAME"),
		DBSSLMode:    os.Getenv("DB_SSL"),
		JWTSecretKey: os.Getenv("JWT_ACCESS_SECRET_KEY"),
	}
}
