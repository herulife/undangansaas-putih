package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"undangan-saas-modern/apps/api/internal/auth"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user auth.User) error {
	_, err := r.db.Exec(ctx, `
		insert into users (id, name, email, password_hash)
		values ($1, $2, $3, $4)
	`, user.ID, user.Name, user.Email, user.PasswordHash)
	return err
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (auth.User, error) {
	var user auth.User
	err := r.db.QueryRow(ctx, `
		select id, name, email, password_hash
		from users
		where email = $1
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash)
	return user, err
}
