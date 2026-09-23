# SmartExam AI — Deployment Guide

## Production Deployment Targets

- **Frontend**: Deployable to Vercel, Cloud Run, or AWS S3 + CloudFront.
- **Backend**: Deployable to Render, Railway, or Google Cloud Run via Docker.
- **Database**: PostgreSQL (Supabase, Neon, AWS RDS, or GCP Cloud SQL).

---

## Docker Compose (Full Stack Local / Cloud)

Run all services with a single command:
```bash
docker-compose up --build
```
This boots:
1. `backend`: FastAPI Python service on port 8000
2. `frontend`: React Vite SPA on port 3000
3. `postgres`: PostgreSQL 16 database on port 5432
