.PHONY: dev up upbuild down

dev:
	cd frontend && yarn dev

up:
	docker compose up -d

upbuild:
	docker compose up -d --build

down:
	docker compose down
