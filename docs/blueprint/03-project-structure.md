# 03-project-structure.md - Project Structure

## Root Directory Structure

```
/ (CPAJOBS root)
│
├── docs/
│   └── blueprint/          # All blueprint documentation
│       ├── 00-overview.md
│       ├── 01-scope.md
│       ├── 02-architecture.md
│       ├── 03-project-structure.md
│       ├── 04-database.md
│       ├── 05-api.md
│       ├── 06-tracking-revenue.md
│       ├── 07-automation.md
│       ├── 08-security.md
│       ├── 09-zero-cost.md
│       ├── 10-testing.md
│       ├── 11-deployment.md
│       ├── 12-roadmap.md
│       └── 13-freeze.md
│
├── src/                    # Source code (will be created later)
│   ├── main.js             # Entry point
│   ├── routes/             # API route handlers
│   ├── models/             # Data models
│   ├── controllers/        # Business logic
│   ├── utils/              # Utility functions
│   └── config/             # Configuration management
│
├── static/                 # Static assets
│   ├── css/
│   ├── js/
│   └── images/
│
├── tests/                  # Test files
│   ├── integration/
│   ├── unit/
│   └── e2e/
│
├── .github/                # GitHub workflows
│   └── workflows/
│
├── .devcontainer/          # Container configs (if needed)
│
├── .gitignore              # Git exclusions
├── README.md               # Project documentation
├── package.json            # Dependencies
└── README.md
```

## Key Principles

1. **Clean Root**: No temporary or scratch files
2. **Modular**: Each directory has clear responsibility
3. **Static Assets**: Separated from source code
4. **Tests**: Organized by type and purpose
5. **Docs**: All documentation in docs/blueprint/
6. **No Generated Files**: Avoid build artifacts in repo

## File Responsibilities

- **docs/**: All documentation (this blueprint)
- **src/**: All application code
- **static/**: Static files served by Cloudflare Pages
- **tests/**: All test files
- **.github/**: GitHub Actions workflows
- **README.md**: Project overview and setup instructions