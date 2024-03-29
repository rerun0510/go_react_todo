package repository

import (
	"fmt"
	domrepo "go-rest-api/domain/repository"
	"go-rest-api/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type taskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) domrepo.ITaskRepository {
	return &taskRepository{db}
}

// GetAllTasks implements ITaskRepository.
func (tr *taskRepository) GetAllTasks(tasks *[]model.Task, userId uint) error {
	if err := tr.db.Joins("User").Where("user_id=?", userId).Order("created_at").Find(tasks).Error; err != nil {
		return err
	}
	return nil
}

// GetTaskById implements ITaskRepository.
func (tr *taskRepository) GetTaskById(task *model.Task, userId uint, taskId uint) error {
	if err := tr.db.Joins("User").Where("user_id=?", userId).Order("created_at").First(task, taskId).Error; err != nil {
		return err
	}
	return nil
}

// CreateTask implements ITaskRepository.
func (tr *taskRepository) CreateTask(task *model.Task) error {
	if err := tr.db.Create(task).Error; err != nil {
		return err
	}
	return nil
}

// UpdateTask implements ITaskRepository.
func (tr *taskRepository) UpdateTask(task *model.Task, userId uint, taskId uint) error {
	result := tr.db.Model(task).Clauses(clause.Returning{}).Where("id=? AND user_id=?", taskId, userId).Update("title", task.Title)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected < 1 {
		return fmt.Errorf("object dose not exist")
	}
	return nil
}

// DeleteTask implements ITaskRepository.
func (tr *taskRepository) DeleteTask(userId uint, taskId uint) error {
	result := tr.db.Where("id=? AND user_id=?", taskId, userId).Delete(&model.Task{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected < 1 {
		return fmt.Errorf("object dose not exist")
	}
	return nil
}
