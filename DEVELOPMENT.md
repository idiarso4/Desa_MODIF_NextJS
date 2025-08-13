# OpenSID Development Guide

This guide will help you set up and work with the OpenSID Next.js development environment.

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9.0 or later
- **Docker** and Docker Compose
- **Git**

## Quick Start

### Automated Setup

For the fastest setup, use our automated setup scripts:

**Linux/macOS:**
```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

**Windows:**
```cmd
scripts\dev-setup.bat
```

### Manual Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd opensid-nextjs
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start Docker services:**
   ```bash
   npm run docker:dev
   ```

4. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

### Testing
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Docker
- `npm run docker:dev` - Start development Docker services
- `npm run docker:down` - Stop Docker services

## Development Environment

### Services

When you run `npm run docker:dev`, the following services will be available:

- **Next.js App**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO (S3)**: http://localhost:9000 (Console: http://localhost:9001)
- **Adminer**: http://localhost:8080
- **Prisma Studio**: http://localhost:5555 (when running `npm run db:studio`)

### Environment Variables

Key environment variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://opensid:opensid123@localhost:5432/opensid"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"
```

## Project Structure

```
opensid-nextjs/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utility libraries
│   │   ├── repositories/   # Data access layer
│   │   ├── services/       # Business logic layer
│   │   └── validations.ts  # Zod schemas
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── prisma/                 # Database schema and migrations
├── docker/                 # Docker configuration files
├── scripts/                # Development scripts
└── .vscode/                # VS Code configuration
```

## Database Management

### Schema Changes

1. Modify `prisma/schema.prisma`
2. Run `npm run db:push` for development
3. For production, create migrations: `npm run db:migrate`

### Seeding Data

The database is automatically seeded with:
- Default admin user (admin/admin123)
- Sample citizens and families
- Basic configuration data

To re-seed: `npm run db:seed`

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

- **Unit tests**: `src/**/*.test.ts`
- **Component tests**: `src/**/*.test.tsx`
- **Integration tests**: `src/**/*.integration.test.ts`

### Writing Tests

```typescript
// Example component test
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

## Code Style and Quality

### ESLint Configuration

The project uses Next.js ESLint configuration with additional rules for:
- TypeScript strict mode
- React best practices
- Accessibility (a11y)
- Import organization

### Prettier Configuration

Code formatting is handled by Prettier with:
- 2-space indentation
- Single quotes
- Trailing commas
- Semicolons

### Pre-commit Hooks

Husky runs the following checks before each commit:
- ESLint fixes
- Prettier formatting
- TypeScript type checking

## VS Code Setup

### Recommended Extensions

The project includes VS Code extension recommendations:
- Prettier - Code formatter
- ESLint - Linting
- Tailwind CSS IntelliSense
- Prisma - Database schema support
- TypeScript support

### Debugging

Launch configurations are provided for:
- Next.js server-side debugging
- Client-side debugging
- Full-stack debugging
- Jest test debugging

## Troubleshooting

### Common Issues

1. **Docker services not starting:**
   ```bash
   docker system prune
   npm run docker:dev
   ```

2. **Database connection issues:**
   ```bash
   npm run docker:down
   npm run docker:dev
   # Wait 10 seconds
   npm run db:push
   ```

3. **TypeScript errors:**
   ```bash
   npm run type-check
   npm run db:generate
   ```

4. **Port conflicts:**
   - Check if ports 3000, 5432, 6379, 8080, 9000, 9001 are available
   - Modify `docker-compose.dev.yml` if needed

### Getting Help

- Check the [GitHub Issues](link-to-issues)
- Review the [API Documentation](link-to-api-docs)
- Join our [Discord Community](link-to-discord)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.