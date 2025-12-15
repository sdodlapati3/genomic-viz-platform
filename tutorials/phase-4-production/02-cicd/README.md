[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.2: CI/CD Pipeline

## Overview

Learn how to set up a **Continuous Integration/Continuous Deployment (CI/CD)**
pipeline using GitHub Actions for genomic visualization projects. This tutorial
covers automated testing, linting, building, security scanning, and deployment
workflows.

## Learning Objectives

By the end of this tutorial, you will:

1. ✅ Understand CI/CD principles and benefits
2. ✅ Configure GitHub Actions workflows
3. ✅ Set up automated testing and linting
4. ✅ Implement security scanning
5. ✅ Create deployment pipelines for staging and production
6. ✅ Configure PR-specific checks and previews

## Prerequisites

- Completed Tutorial 4.1 (Testing)
- GitHub account with repository access
- Basic understanding of YAML syntax
- Node.js 18+ installed

## Project Structure

```
02-cicd/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Main CI pipeline
│       ├── deploy.yml          # Deployment workflow
│       └── pr-check.yml        # PR-specific checks
├── scripts/
│   ├── pre-commit.sh           # Local pre-commit hook
│   ├── version-bump.sh         # Version management
│   └── verify-build.sh         # Build verification
├── src/
│   ├── components/
│   │   └── BarChart.ts         # Sample component
│   ├── data/
│   │   └── sampleData.ts       # Test data
│   ├── styles/
│   │   └── main.css            # Application styles
│   └── utils/
│       ├── dataTransform.ts    # Data utilities
│       ├── dataTransform.test.ts
│       ├── scales.ts           # D3 scale utilities
│       └── scales.test.ts
├── .eslintrc.cjs               # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── index.html                  # Application entry
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite build config
└── vitest.config.ts            # Vitest test config
```

## Getting Started

### 1. Install Dependencies

```bash
cd tutorials/phase-4-production/02-cicd
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Run All Checks

```bash
npm run validate  # Runs lint, typecheck, test, build
```

## CI/CD Pipeline Architecture

### Main CI Pipeline (ci.yml)

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────┐    ┌───────────────────┐    ┌─────────┐         │
│  │ Lint  │───▶│  Test (Matrix)    │───▶│  Build  │         │
│  └───────┘    │  Node 18, 20, 22  │    └────┬────┘         │
│               └───────────────────┘         │               │
│                                             ▼               │
│  ┌────────────┐                       ┌──────────┐         │
│  │ TypeCheck  │                       │ Security │         │
│  └────────────┘                       │  Audit   │         │
│                                       └──────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Pipeline (deploy.yml)

```
┌─────────────────────────────────────────────────────────────┐
│                   Deployment Workflow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tag Push (v*)         Release Published                    │
│       │                       │                              │
│       ▼                       ▼                              │
│  ┌─────────┐            ┌─────────────┐                     │
│  │  Build  │            │   Build     │                     │
│  └────┬────┘            └──────┬──────┘                     │
│       │                        │                             │
│       ▼                        ▼                             │
│  ┌─────────────┐        ┌─────────────────┐                 │
│  │   Staging   │        │   Production    │                 │
│  │   Deploy    │        │    Deploy       │                 │
│  └──────┬──────┘        └───────┬─────────┘                 │
│         │                       │                            │
│         ▼                       ▼                            │
│  ┌─────────────┐        ┌─────────────────┐                 │
│  │   Verify    │        │    Verify       │                 │
│  │   Staging   │        │   Production    │                 │
│  └─────────────┘        └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## GitHub Actions Workflows

### 1. Main CI Workflow

**File:** `.github/workflows/ci.yml`

This workflow runs on every push and pull request:

| Job           | Purpose            | Key Steps                            |
| ------------- | ------------------ | ------------------------------------ |
| **lint**      | Code quality       | ESLint + Prettier check              |
| **test**      | Test suite         | Vitest with coverage, matrix testing |
| **build**     | Production build   | Vite build + artifact upload         |
| **security**  | Vulnerability scan | npm audit                            |
| **typecheck** | Type validation    | tsc --noEmit                         |

#### Key Features:

- **Matrix Testing**: Tests against Node.js 18, 20, and 22
- **Caching**: npm dependencies cached for faster runs
- **Coverage Reports**: Uploaded to Codecov
- **Artifacts**: Build outputs preserved for 7 days

### 2. Deployment Workflow

**File:** `.github/workflows/deploy.yml`

| Trigger           | Environment | Action                |
| ----------------- | ----------- | --------------------- |
| Tag push (v\*)    | Staging     | Deploy to staging URL |
| Release published | Production  | Deploy to production  |

#### Features:

- **Environment Secrets**: Separate secrets for staging/production
- **Health Checks**: Post-deployment verification
- **Rollback Support**: GitHub Deployments API integration

### 3. PR Check Workflow

**File:** `.github/workflows/pr-check.yml`

| Check                 | Purpose                           |
| --------------------- | --------------------------------- |
| **PR Info**           | Labels, size summary              |
| **Bundle Size**       | Size comparison with main         |
| **Preview**           | Netlify/Vercel preview deployment |
| **Dependency Review** | Security review of new deps       |
| **Auto Labeler**      | Automatic PR labeling             |

## Configuration Files

### ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  // ... additional rules
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Scripts Reference

| Script          | Command                 | Purpose          |
| --------------- | ----------------------- | ---------------- |
| `dev`           | `vite`                  | Start dev server |
| `build`         | `vite build`            | Production build |
| `test`          | `vitest run`            | Run tests once   |
| `test:watch`    | `vitest`                | Watch mode       |
| `test:coverage` | `vitest run --coverage` | With coverage    |
| `lint`          | `eslint src/`           | Check linting    |
| `lint:fix`      | `eslint src/ --fix`     | Auto-fix issues  |
| `format`        | `prettier --write src/` | Format code      |
| `format:check`  | `prettier --check src/` | Check formatting |
| `typecheck`     | `tsc --noEmit`          | Type checking    |
| `validate`      | All checks              | Full validation  |

## Exercises

### Exercise 1: Add Workflow Status Badge

Add a CI status badge to your README:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
```

### Exercise 2: Implement Branch Protection

Configure branch protection rules:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require status checks before merging
   - Require pull request reviews
   - Require conversation resolution

### Exercise 3: Add Custom Lint Rule

Add a custom ESLint rule for genomic data:

```javascript
// Add to .eslintrc.cjs
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'Literal[value=/chromosome/i]',
      message: 'Use "chr" abbreviation for chromosome references',
    },
  ],
}
```

### Exercise 4: Set Up Secrets

Configure repository secrets for deployment:

1. Go to Settings → Secrets
2. Add secrets:
   - `STAGING_DEPLOY_URL`
   - `PRODUCTION_DEPLOY_URL`
   - `CODECOV_TOKEN`

### Exercise 5: Create Release Workflow

Automate releases with semantic versioning:

```bash
# Bump version
./scripts/version-bump.sh minor

# Create tag
git tag v1.1.0
git push origin v1.1.0
```

## Best Practices

### 1. Fast Feedback Loop

```yaml
# Fail fast on lint errors
- name: Lint
  run: npm run lint
  continue-on-error: false
```

### 2. Caching Dependencies

```yaml
- name: Cache npm
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 3. Parallel Jobs

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
  test:
    runs-on: ubuntu-latest
    # Both run in parallel
```

### 4. Matrix Testing

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, macos-latest]
```

### 5. Environment Separation

```yaml
environment:
  name: production
  url: ${{ steps.deploy.outputs.url }}
```

## Troubleshooting

### Common Issues

| Issue             | Solution                              |
| ----------------- | ------------------------------------- |
| npm ci fails      | Check package-lock.json is committed  |
| Tests timeout     | Increase timeout in vitest.config.ts  |
| TypeScript errors | Run `npm run typecheck` locally first |
| Build fails       | Check Vite config and imports         |
| Coverage drops    | Add tests before merging              |

### Debug Workflow

```yaml
- name: Debug
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
```

## Next Steps

After completing this tutorial:

1. **Tutorial 4.3**: AI Integration - Add intelligent features
2. **Tutorial 4.4**: Performance - Optimize with Rust/WebAssembly
3. **Capstone Project**: Apply CI/CD to your genomic visualization

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Summary

In this tutorial, you learned to:

✅ Configure GitHub Actions CI/CD pipelines ✅ Set up automated testing with
matrix strategies ✅ Implement code quality checks (lint, format, typecheck) ✅
Create deployment workflows for staging and production ✅ Configure PR-specific
checks and preview deployments ✅ Use helper scripts for local development

Your genomic visualization projects now have production-grade CI/CD! 🚀

---

## 🎯 Interview Preparation Q&A

### Q1: How would you set up CI/CD for a genomic visualization platform?

**Answer:**

```yaml
# .github/workflows/ci.yml
name: Genomic Viz CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

---

### Q2: How do you handle large genomic datasets in Docker images?

**Answer:** **Multi-stage builds:**

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production (minimal image)
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Don't include reference data in image!
VOLUME ["/data"]

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Data handling strategy:**

1. **Don't bake data into images** - Mount as volumes
2. **Use separate data container** for reference genomes
3. **Cloud storage** for large files (S3, GCS)
4. **CDN** for static reference data

---

### Q3: How do you implement zero-downtime deployments?

**Answer:**

```yaml
# Blue-Green Deployment
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to staging (green)
      run: |
        docker tag app:${{ github.sha }} app:green
        docker-compose -f docker-compose.green.yml up -d

    - name: Health check
      run: |
        for i in {1..30}; do
          if curl -f http://localhost:3001/health; then
            echo "Green is healthy"
            exit 0
          fi
          sleep 2
        done
        exit 1

    - name: Switch traffic
      run: ./scripts/switch-traffic.sh green
```

**Strategies:**

1. **Blue-Green**: Two identical environments, switch traffic
2. **Rolling**: Update instances one at a time
3. **Canary**: Route % of traffic to new version

---

### Q4: What checks should run before merging visualization code?

**Answer:**

```yaml
pr-checks:
  runs-on: ubuntu-latest
  steps:
    - name: Unit tests
      run: npm run test:unit

    - name: TypeScript check
      run: npm run typecheck

    - name: ESLint
      run: npm run lint

    - name: Visual regression tests
      run: npm run test:visual

    - name: Bundle size check
      uses: preactjs/compressed-size-action@v2

    - name: Performance check
      run: npm run lighthouse -- --threshold=90
```

**Critical for genomic viz:**

- Type safety (complex data structures)
- Bundle size (large dependency risk)
- Performance (rendering speed)

---

### Q5: How does ProteinPaint handle deployment and releases?

**Answer:** **ProteinPaint deployment considerations:**

1. **Monorepo structure:** Server, client, Rust parsers, shared types
2. **Build pipeline:** Rust compilation → TypeScript → Bundling

3. **Health checks:**

```javascript
app.get('/health', (req, res) => {
  const checks = {
    database: checkDbConnection(),
    referenceData: checkReferenceFiles(),
    memory: process.memoryUsage().heapUsed < threshold,
  };

  const healthy = Object.values(checks).every(Boolean);
  res.status(healthy ? 200 : 503).json(checks);
});
```

4. **Environment configs:** Development vs production data paths, caching

---

[← Back to Tutorials Index](../../README.md)
