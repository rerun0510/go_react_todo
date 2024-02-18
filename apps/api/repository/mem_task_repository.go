package repository

import (
	"fmt"
	domrepo "go-rest-api/domain/repository"
	"go-rest-api/model"
	"sync"
)

type memTaskRepository struct {
	idSeq uint
	tasks []*model.Task
	mu    sync.RWMutex
}

func NewMemTaskRepository() domrepo.ITaskRepository {
	return &memTaskRepository{
		idSeq: 1,
		tasks: make([]*model.Task, 0),
	}
}

// GetAllTasks implements ITaskRepository.
func (tr *memTaskRepository) GetAllTasks(tasks *[]model.Task, userId uint) error {
	tr.mu.RLock()
	defer tr.mu.RUnlock()

	for _, task := range tr.tasks {
		if task.UserId == userId {
			*tasks = append(*tasks, *task)
		}
	}
	return nil
}

// GetTaskById implements ITaskRepository.
func (tr *memTaskRepository) GetTaskById(task *model.Task, userId uint, taskId uint) error {
	tr.mu.RLock()
	defer tr.mu.RUnlock()

	for _, t := range tr.tasks {
		if t.UserId == userId {
			*task = *t
		}
	}
	return nil
}

// CreateTask implements ITaskRepository.
func (tr *memTaskRepository) CreateTask(task *model.Task) error {
	tr.mu.Lock()
	defer tr.mu.Unlock()

	task.ID = tr.idSeq
	tr.idSeq++
	tr.tasks = append(tr.tasks, task)
	return nil
}

// UpdateTask implements ITaskRepository.
func (tr *memTaskRepository) UpdateTask(task *model.Task, userId uint, taskId uint) error {
	tr.mu.Lock()
	defer tr.mu.Unlock()

	for i, t := range tr.tasks {
		if t.ID == taskId {
			if t.UserId != userId {
				return fmt.Errorf("task does not belong to user")
			}
			tr.tasks[i] = task
			return nil
		}
	}
	return fmt.Errorf("task not found")
}

// DeleteTask implements ITaskRepository.
func (tr *memTaskRepository) DeleteTask(userId uint, taskId uint) error {

	for i, t := range tr.tasks {
		if t.ID == taskId {
			if t.UserId != userId {
				return fmt.Errorf("task does not belong to user")
			}
			tr.tasks = append(tr.tasks[:i], tr.tasks[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("task not found")
}
