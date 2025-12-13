# Deployment Guide

This guide covers deploying the Genomic Visualization Platform to various cloud providers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [AWS Deployment](#aws-deployment)
4. [Google Cloud Platform](#google-cloud-platform)
5. [Heroku Deployment](#heroku-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Database Setup](#database-setup)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

Before deploying, ensure you have:

- Docker and Docker Compose installed
- Access to a PostgreSQL database
- Domain name (for production)
- SSL certificate (or use Let's Encrypt)

### Required Environment Variables

```bash
# Core
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/genomics

# Security
JWT_SECRET=<strong-random-string-64-chars>
JWT_REFRESH_SECRET=<strong-random-string-64-chars>
CORS_ORIGIN=https://yourdomain.com

# Optional
SENTRY_DSN=<your-sentry-dsn>
OPENAI_API_KEY=<your-openai-key>
```

---

## Docker Deployment

### Production Docker Build

Create `Dockerfile.prod` for optimized production builds:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build client
WORKDIR /app/capstone/client
RUN npm ci && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/capstone/server ./capstone/server
COPY --from=builder /app/capstone/client/dist ./capstone/client/dist

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

CMD ["node", "capstone/server/src/index.js"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=genomics
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app

volumes:
  pgdata:
  redisdata:
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # Auth routes with stricter limits
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/json application/javascript text/xml;
        gzip_min_length 1000;
    }
}
```

---

## AWS Deployment

### Option 1: AWS ECS with Fargate

#### 1. Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name genomic-viz-platform

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t genomic-viz-platform -f Dockerfile.prod .
docker tag genomic-viz-platform:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/genomic-viz-platform:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/genomic-viz-platform:latest
```

#### 2. ECS Task Definition

```json
{
  "family": "genomic-viz-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/genomic-viz-platform:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:genomic-db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:genomic-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/genomic-viz-platform",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -q --spider http://localhost:3001/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### 3. Terraform Configuration

```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 4.0"

  name = "genomic-viz-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "genomic-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "genomics"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "genomic-viz-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ALB
resource "aws_lb" "main" {
  name               = "genomic-viz-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets
}

# Target Group
resource "aws_lb_target_group" "app" {
  name        = "genomic-viz-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    interval            = 30
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "genomic-viz-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3001
  }
}
```

### Option 2: AWS Elastic Beanstalk

```yaml
# .ebextensions/01-environment.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
  aws:elasticbeanstalk:container:nodejs:
    NodeVersion: 20
    NodeCommand: "node capstone/server/src/index.js"
```

```yaml
# .ebextensions/02-nginx.config
files:
  "/etc/nginx/conf.d/proxy.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      upstream nodejs {
        server 127.0.0.1:8080;
        keepalive 256;
      }

      server {
        listen 80;
        
        location / {
          proxy_pass http://nodejs;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
        }
      }
```

---

## Google Cloud Platform

### Cloud Run Deployment

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/genomic-viz-platform:$COMMIT_SHA', '-f', 'Dockerfile.prod', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/genomic-viz-platform:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'genomic-viz-platform'
      - '--image'
      - 'gcr.io/$PROJECT_ID/genomic-viz-platform:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NODE_ENV=production'
      - '--set-secrets'
      - 'DATABASE_URL=genomic-db-url:latest,JWT_SECRET=genomic-jwt-secret:latest'
      - '--memory'
      - '1Gi'
      - '--cpu'
      - '1'
      - '--max-instances'
      - '10'

images:
  - 'gcr.io/$PROJECT_ID/genomic-viz-platform:$COMMIT_SHA'
```

### Cloud SQL Setup

```bash
# Create Cloud SQL instance
gcloud sql instances create genomic-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create genomics --instance=genomic-db

# Create user
gcloud sql users create genomic-user \
  --instance=genomic-db \
  --password=<secure-password>
```

---

## Heroku Deployment

### Procfile

```
web: node capstone/server/src/index.js
release: npx knex migrate:latest --knexfile capstone/server/knexfile.js
```

### app.json

```json
{
  "name": "Genomic Visualization Platform",
  "description": "Interactive platform for genomic data visualization",
  "repository": "https://github.com/yourusername/genomic-viz-platform",
  "keywords": ["genomics", "visualization", "bioinformatics"],
  "stack": "heroku-22",
  "addons": [
    {
      "plan": "heroku-postgresql:mini"
    },
    {
      "plan": "heroku-redis:mini"
    }
  ],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "JWT_SECRET": {
      "generator": "secret"
    },
    "JWT_REFRESH_SECRET": {
      "generator": "secret"
    }
  },
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "scripts": {
    "postdeploy": "npx knex migrate:latest --knexfile capstone/server/knexfile.js && npx knex seed:run --knexfile capstone/server/knexfile.js"
  }
}
```

### Deploy Commands

```bash
# Login
heroku login

# Create app
heroku create genomic-viz-platform

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set config vars
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Deploy
git push heroku main

# Run migrations
heroku run npx knex migrate:latest --knexfile capstone/server/knexfile.js

# View logs
heroku logs --tail
```

---

## Kubernetes Deployment

### Helm Chart

```yaml
# charts/genomic-viz-platform/values.yaml
replicaCount: 2

image:
  repository: ghcr.io/yourusername/genomic-viz-platform
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3001

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: genomics.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: genomic-viz-tls
      hosts:
        - genomics.yourdomain.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

postgresql:
  enabled: true
  auth:
    postgresPassword: ""
    username: genomic
    password: ""
    database: genomics
  primary:
    persistence:
      size: 10Gi

redis:
  enabled: true
  auth:
    enabled: false
```

### Kubernetes Manifests

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: genomic-viz-platform
  labels:
    app: genomic-viz-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: genomic-viz-platform
  template:
    metadata:
      labels:
        app: genomic-viz-platform
    spec:
      containers:
        - name: app
          image: ghcr.io/yourusername/genomic-viz-platform:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: genomic-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: genomic-secrets
                  key: jwt-secret
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
            requests:
              cpu: "250m"
              memory: "256Mi"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: genomic-viz-platform
spec:
  selector:
    app: genomic-viz-platform
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: genomic-viz-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - genomics.yourdomain.com
      secretName: genomic-viz-tls
  rules:
    - host: genomics.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: genomic-viz-platform
                port:
                  number: 80
```

---

## Environment Configuration

### Secrets Management

#### AWS Secrets Manager

```bash
# Create secrets
aws secretsmanager create-secret \
  --name genomic-db-url \
  --secret-string "postgresql://user:pass@host:5432/genomics"

aws secretsmanager create-secret \
  --name genomic-jwt-secret \
  --secret-string "$(openssl rand -hex 32)"
```

#### Kubernetes Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: genomic-secrets
type: Opaque
stringData:
  database-url: postgresql://user:pass@host:5432/genomics
  jwt-secret: your-jwt-secret-here
  jwt-refresh-secret: your-refresh-secret-here
```

---

## Database Setup

### Migration Script

```bash
#!/bin/bash
# scripts/db-setup.sh

set -e

echo "Running database migrations..."
npx knex migrate:latest --knexfile capstone/server/knexfile.js

echo "Running database seeds..."
npx knex seed:run --knexfile capstone/server/knexfile.js

echo "Database setup complete!"
```

### Backup Script

```bash
#!/bin/bash
# scripts/db-backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

pg_dump $DATABASE_URL > /backups/$BACKUP_FILE
gzip /backups/$BACKUP_FILE

# Upload to S3
aws s3 cp /backups/${BACKUP_FILE}.gz s3://your-backup-bucket/genomic-db/

# Cleanup old backups (keep last 7 days)
find /backups -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

---

## Monitoring & Logging

### Health Check Endpoint

```javascript
// Already implemented in server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
});
```

### CloudWatch Metrics (AWS)

```javascript
// capstone/server/src/utils/cloudwatch.js
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'us-east-1' });

export async function publishMetric(metricName, value, unit = 'Count') {
  await cloudwatch.putMetricData({
    Namespace: 'GenomicVizPlatform',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
      },
    ],
  });
}
```

### Prometheus Metrics

```javascript
// capstone/server/src/utils/metrics.js
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const activeAnalyses = new client.Gauge({
  name: 'active_analyses',
  help: 'Number of active analysis jobs',
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeAnalyses);

export { register };
```

---

## Checklist Before Production

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] SSL certificate configured
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry)
- [ ] Health checks passing
- [ ] Monitoring dashboards created
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

---

## Support

For deployment issues:
- Check logs: `docker-compose logs -f` or `heroku logs --tail`
- Verify environment variables
- Test database connectivity
- Check health endpoint: `curl /api/health`
