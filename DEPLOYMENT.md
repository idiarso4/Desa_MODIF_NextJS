# OpenSID Next.js Production Deployment Guide

This guide covers the deployment of OpenSID Next.js to production environments using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- SSL certificates (for HTTPS)
- Domain name configured
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ storage space

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/opensid-nextjs.git
   cd opensid-nextjs
   ```

2. **Configure environment variables**
   ```bash
   cp .env.production .env.local
   # Edit .env.local with your actual values
   nano .env.local
   ```

3. **Set up SSL certificates**
   ```bash
   mkdir -p ssl
   # Copy your SSL certificates to ssl/cert.pem and ssl/key.pem
   cp /path/to/your/cert.pem ssl/
   cp /path/to/your/key.pem ssl/
   ```

4. **Deploy the application**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Run database migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
   ```

6. **Create initial admin user**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app npm run seed:admin
   ```

## Detailed Configuration

### Environment Variables

Key environment variables that must be configured:

```bash
# Database
DATABASE_URL="postgresql://opensid:your_password@postgres:5432/opensid_prod"

# Redis
REDIS_PASSWORD=your_redis_password

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_very_long_random_secret

# Security
CSRF_SECRET=your_csrf_secret
ENCRYPTION_KEY=your_32_char_encryption_key
```

### SSL Configuration

For production, you need valid SSL certificates:

1. **Using Let's Encrypt (Recommended)**
   ```bash
   # Install certbot
   sudo apt install certbot

   # Generate certificates
   sudo certbot certonly --standalone -d your-domain.com

   # Copy certificates
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
   ```

2. **Using custom certificates**
   ```bash
   # Copy your certificates
   cp your-certificate.crt ssl/cert.pem
   cp your-private-key.key ssl/key.pem
   ```

### Database Setup

The PostgreSQL database is automatically configured with Docker Compose. For external database:

```bash
# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://user:password@external-host:5432/opensid_prod"

# Remove postgres service from docker-compose.prod.yml
```

### Backup Configuration

Automated backups are configured by default:

```bash
# Backup schedule (cron format)
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM

# Retention period
BACKUP_RETENTION_DAYS=30

# Manual backup
docker-compose -f docker-compose.prod.yml exec backup /backup.sh
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n opensid

# View logs
kubectl logs -f deployment/opensid-app -n opensid
```

### Option 3: Manual Docker

```bash
# Build image
docker build -f Dockerfile.prod -t opensid-nextjs .

# Run container
docker run -d \
  --name opensid-app \
  -p 3000:3000 \
  --env-file .env.local \
  opensid-nextjs
```

## Monitoring and Maintenance

### Health Checks

The application includes built-in health checks:

```bash
# Check application health
curl https://your-domain.com/api/health

# Check all services
docker-compose -f docker-compose.prod.yml ps
```

### Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs app

# View nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# View database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Performance Monitoring

Enable monitoring services in docker-compose.prod.yml:

```yaml
# Uncomment monitoring services
grafana:
  image: grafana/grafana:10.0.0
  # ... configuration

loki:
  image: grafana/loki:2.9.0
  # ... configuration
```

### Database Maintenance

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Reset database (DANGER!)
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate reset

# Backup database
docker-compose -f docker-compose.prod.yml exec backup /backup.sh

# Restore database
docker-compose -f docker-compose.prod.yml exec postgres psql -U opensid -d opensid_prod < backup.sql
```

## Security Considerations

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build app
docker-compose -f docker-compose.prod.yml up -d app
```

### Security Headers

Nginx is configured with security headers:
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs app
   
   # Check environment variables
   docker-compose -f docker-compose.prod.yml exec app env
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   
   # Test connection
   docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
   ```

3. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout
   
   # Test SSL configuration
   curl -I https://your-domain.com
   ```

4. **Performance issues**
   ```bash
   # Check resource usage
   docker stats
   
   # Check application metrics
   curl https://your-domain.com/api/health
   ```

### Getting Help

- Check the [GitHub Issues](https://github.com/your-org/opensid-nextjs/issues)
- Review application logs
- Contact support team

## Scaling

### Horizontal Scaling

```bash
# Scale application containers
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Use load balancer (nginx upstream)
# Configure multiple app instances in nginx.conf
```

### Vertical Scaling

```bash
# Increase container resources
# Update docker-compose.prod.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

## Backup and Recovery

### Automated Backups

Backups run automatically based on BACKUP_SCHEDULE:

```bash
# Check backup status
ls -la backups/

# Restore from backup
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U opensid -d opensid_prod < backups/opensid_backup_20240101_020000.sql
```

### Manual Backup

```bash
# Create manual backup
docker-compose -f docker-compose.prod.yml exec backup /backup.sh

# Backup uploaded files
tar -czf uploads_backup.tar.gz uploads/
```

## Migration from OpenSID Legacy

See [MIGRATION.md](MIGRATION.md) for detailed migration instructions from OpenSID PHP version.

---

For additional support, please refer to the [documentation](https://docs.opensid.or.id) or contact the development team.
