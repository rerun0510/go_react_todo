package repository

import (
	"fmt"
	domrepo "go-rest-api/domain/repository"
	"go-rest-api/model"
	"sync"
)

type memUserRepository struct {
	idSeq uint
	users []*model.User
	mu    sync.RWMutex
}

func NewMemUserRepository() domrepo.IUserRepository {
	return &memUserRepository{
		idSeq: 1,
		users: make([]*model.User, 0),
	}
}

// GetUserByEmail implements IUserRepository.
func (ur *memUserRepository) GetUserByEmail(user *model.User, email string) error {
	ur.mu.RLock()
	defer ur.mu.RUnlock()

	for _, u := range ur.users {
		if u.Email == email {
			*user = *u
		}
	}
	return nil
}

// CreateUser implements IUserRepository.
func (ur *memUserRepository) CreateUser(user *model.User) error {
	ur.mu.RLock()
	defer ur.mu.RUnlock()

	for _, u := range ur.users {
		if u.Email == user.Email {
			return fmt.Errorf("user already exists")
		}
	}
	user.ID = ur.idSeq
	ur.idSeq++
	ur.users = append(ur.users, user)
	return nil
}
