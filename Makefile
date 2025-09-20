.PHONY: frontend-install backend-install agent-install install-all lint-all test-all dev-frontend dev-backend agent-smoke

frontend-install:
`tcd frontend && npm install

backend-install:
`tcd backend && npm install

agent-install:
`tcd enterprise-agent && pip install -e .

install-all: frontend-install backend-install agent-install

lint-all:
`tcd frontend && npm run lint

test-all:
`tcd frontend && npm test

dev-frontend:
`tcd frontend && npm run dev

dev-backend:
`tcd backend && wrangler dev

agent-smoke:
`tcd enterprise-agent && python smoke_test.py

