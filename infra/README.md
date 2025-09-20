# Infrastructure

This directory centralises deployment automation and local orchestration assets.

- `docker-compose.dev.yml` (placeholder) can wire Workers, the Enterprise Agent, and supporting services (Miniflare, D1 emulation).
- Add IaC descriptors (Terraform, Pulumi) to manage Cloudflare resources, secret bindings, and observability sinks.
- Store environment templates and secret rotation guides here.

The existing deployment scripts under `/protothrive-deploy` can migrate here over time for a unified infra surface.
