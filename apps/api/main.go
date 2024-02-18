package main

import (
	"go-rest-api/controller"
	// "go-rest-api/db"
	"go-rest-api/repository"
	"go-rest-api/router"
	"go-rest-api/usecase"
	"go-rest-api/validator"
)

func main() {
	// db := db.NewDB()
	// userRepository := repository.NewUserRepository(db)
	userRepository := repository.NewMemUserRepository()
	userValidator := validator.NewUserValidator()
	userUsecase := usecase.NewUserUsecase(userRepository, userValidator)
	userController := controller.NewUserController(userUsecase)
	// taskRepository := repository.NewTaskRepository(db)
	taskRepository := repository.NewMemTaskRepository()
	taskValidator := validator.NewTaskValidator()
	taskUsecase := usecase.NewTaskUsecase(taskRepository, taskValidator)
	taskController := controller.NewTaskController(taskUsecase)
	e := router.NewRouter(userController, taskController)
	e.Logger.Fatal(e.Start(":8080"))
}
