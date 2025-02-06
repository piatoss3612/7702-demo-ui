.PHONY: dev up upbuild down

# 변수 선언: 필요한 커맨드와 URL 등을 설정
DOCKER_COMPOSE := docker compose
URL := http://localhost:3000

# 공통 메시지를 출력하기 위한 매크로 정의
define server_started
	@echo "Local test node and web server started"
	@echo "> $(URL)"
endef

# 프론트엔드 개발 서버 실행
dev:
	@echo "Starting frontend..."
	cd frontend && yarn dev

# docker-compose를 이용해 백엔드 서버 실행
up:
	@echo "Starting Local test node and web server..."
	$(DOCKER_COMPOSE) up -d
	$(call server_started)

# 빌드 옵션과 함께 docker-compose를 이용해 백엔드 서버 실행
upbuild:
	@echo "Starting Local test node and web server with build..."
	$(DOCKER_COMPOSE) up -d --build
	$(call server_started)

# docker-compose를 통해 모든 컨테이너를 종료
down:
	@echo "Stopping Local test node and web server..."
	$(DOCKER_COMPOSE) down
	@echo "Local test node and web server stopped"
