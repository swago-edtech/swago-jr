#!/bin/bash
# =============================================================================
# deploy.sh — Swago Jr. EC2 Deployment Script
#
# Usage:
#   First time : bash deploy.sh --setup
#   Deploy/update: bash deploy.sh
#
# What it does:
#   --setup : installs Node, pnpm, PM2, Nginx, Certbot, copies nginx config
#   (default): pulls latest code, installs deps, builds, restarts PM2 apps
# =============================================================================

set -e  # exit on any error

# ── Config ─────────────────────────────────────────────────────────────────
APP_DIR="/home/ec2-user/swago-jr"
REPO_URL="https://github.com/swago-edtech/swago-jr.git"   # update if needed
BRANCH="main"
DOMAIN="swagojr.com"
ADMIN_DOMAIN="admin.swagojr.com"
NODE_VERSION="20"
PM2_WEB_NAME="swago-web"
PM2_ADMIN_NAME="swago-admin"
NGINX_CONF_SRC="$APP_DIR/nginx.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/swagojr"

# ── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✘] $1${NC}"; exit 1; }

# ── Setup mode: run once on a fresh EC2 instance ────────────────────────────
setup() {
    log "Starting one-time server setup..."

    # System update
    sudo yum update -y 2>/dev/null || sudo apt-get update -y

    # Install Node.js via nvm
    if ! command -v node &>/dev/null; then
        log "Installing Node.js $NODE_VERSION..."
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash - 2>/dev/null \
            || curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs 2>/dev/null || sudo apt-get install -y nodejs
    else
        log "Node.js already installed: $(node -v)"
    fi

    # Install pnpm
    if ! command -v pnpm &>/dev/null; then
        log "Installing pnpm..."
        npm install -g pnpm
    else
        log "pnpm already installed: $(pnpm -v)"
    fi

    # Install PM2
    if ! command -v pm2 &>/dev/null; then
        log "Installing PM2..."
        npm install -g pm2
        pm2 startup | tail -1 | sudo bash  # enable PM2 on reboot
    else
        log "PM2 already installed: $(pm2 -v)"
    fi

    # Install Nginx
    if ! command -v nginx &>/dev/null; then
        log "Installing Nginx..."
        sudo yum install -y nginx 2>/dev/null || sudo apt-get install -y nginx
        sudo systemctl enable nginx
    else
        log "Nginx already installed"
    fi

    # Install Certbot
    if ! command -v certbot &>/dev/null; then
        log "Installing Certbot..."
        sudo yum install -y certbot python3-certbot-nginx 2>/dev/null \
            || sudo apt-get install -y certbot python3-certbot-nginx
    else
        log "Certbot already installed"
    fi

    # Clone repo if not present
    if [ ! -d "$APP_DIR" ]; then
        log "Cloning repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    else
        log "Repository already exists at $APP_DIR"
    fi

    # Create .env.local if it doesn't exist
    if [ ! -f "$APP_DIR/.env.local" ]; then
        warn ".env.local not found. Creating empty template — fill it in before deploying!"
        cat > "$APP_DIR/.env.local" <<'EOF'
# ── Database ──────────────────────────────────────────────────────────────
MONGODB_URI=
MONGODB_ADMIN_URI=

# ── Auth ──────────────────────────────────────────────────────────────────
JWT_SECRET=
ADMIN_JWT_SECRET=

# ── Razorpay ──────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# ── MSG91 ─────────────────────────────────────────────────────────────────
MSG91_AUTH_KEY=
NEXT_PUBLIC_MSG91_WIDGET_ID=
NEXT_PUBLIC_MSG91_TOKEN_AUTH=
NEXT_PUBLIC_MSG91_EMAIL_WIDGET_ID=

# ── Twilio ────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SID=

# ── SendGrid ──────────────────────────────────────────────────────────────
SENDGRID_API_KEY=
SENDER_EMAIL=

# ── Gmail channel inventory sync + storefront Google sign-in ──────────────
# Same client ID/secret. Register BOTH redirect URIs in Google Cloud Console:
#   Admin Gmail:     {admin origin}/api/channel-email/google/callback
#   Storefront auth: {web origin}/api/auth/google/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
# Production only for HTTP cron route auth. Local admin "Check mail now" needs no secret.
# Channel email worker starts automatically with `pnpm start:web` / `pnpm start` (same PM2 restart).
CRON_SECRET=
CHANNEL_EMAIL_SYNC_INTERVAL_MS=300000
CHANNEL_EMAIL_SYNC_URL=http://127.0.0.1:3000/api/cron/channel-email-sync
# Email extraction + review sentiment: Gemini only
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite

# ── Cloudinary ────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=

# ── Firebase ──────────────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

# ── Analytics ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# ── URLs ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=https://$DOMAIN
EOF
        warn "Fill in $APP_DIR/.env.local before running deploy!"
    fi

    # Symlink root .env.local into both apps (so Next.js picks it up)
    log "Symlinking .env.local into apps..."
    ln -sf "$APP_DIR/.env.local" "$APP_DIR/apps/web/.env.local"
    ln -sf "$APP_DIR/.env.local" "$APP_DIR/apps/admin/.env.local"

    # Setup Nginx config
    setup_nginx

    # Issue SSL cert (requires DNS to be pointed at this server already)
    warn "Make sure DNS for $DOMAIN and $ADMIN_DOMAIN point to this server before running certbot."
    read -p "Issue SSL certificate now? (y/N): " issue_ssl
    if [[ "$issue_ssl" =~ ^[Yy]$ ]]; then
        sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$ADMIN_DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"
        sudo systemctl reload nginx
    else
        warn "Skipping SSL. Run manually: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $ADMIN_DOMAIN"
    fi

    log "Setup complete. Now run: bash deploy.sh"
}

# ── Nginx config setup ──────────────────────────────────────────────────────
setup_nginx() {
    log "Configuring Nginx..."
    sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
    sudo ln -sf "$NGINX_CONF_DEST" /etc/nginx/sites-enabled/swagojr 2>/dev/null || true

    # Remove default site if present
    sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx configured and reloaded"
}

# ── Deploy ──────────────────────────────────────────────────────────────────
deploy() {
    log "Starting deployment..."

    # Ensure we're in the app directory
    cd "$APP_DIR"

    # Pull latest code
    log "Pulling latest code from $BRANCH..."
    git fetch origin
    git reset --hard "origin/$BRANCH"

    # Re-symlink .env in case it was wiped by git reset
    ln -sf "$APP_DIR/.env.local" "$APP_DIR/apps/web/.env.local"
    ln -sf "$APP_DIR/.env.local" "$APP_DIR/apps/admin/.env.local"

    # Validate .env.local exists and has content
    if [ ! -s "$APP_DIR/.env.local" ]; then
        err ".env.local is missing or empty. Aborting."
    fi

    # Install dependencies
    log "Installing dependencies..."
    pnpm install --frozen-lockfile

    # Build both apps
    log "Building web app..."
    pnpm build:web

    log "Building admin app..."
    pnpm build:admin

    # Start or restart PM2 processes
    log "Starting/restarting PM2 processes..."

    # Web app
    if pm2 describe "$PM2_WEB_NAME" &>/dev/null; then
        pm2 restart "$PM2_WEB_NAME"
        log "Restarted $PM2_WEB_NAME"
    else
        pm2 start "pnpm" --name "$PM2_WEB_NAME" \
            --cwd "$APP_DIR" \
            -- start:web
        log "Started $PM2_WEB_NAME"
    fi

    # Admin app
    if pm2 describe "$PM2_ADMIN_NAME" &>/dev/null; then
        pm2 restart "$PM2_ADMIN_NAME"
        log "Restarted $PM2_ADMIN_NAME"
    else
        pm2 start "pnpm" --name "$PM2_ADMIN_NAME" \
            --cwd "$APP_DIR" \
            -- start:admin
        log "Started $PM2_ADMIN_NAME"
    fi

    # Save PM2 process list (survives reboots)
    pm2 save

    # Reload Nginx (picks up any config changes)
    if [ -f "$NGINX_CONF_SRC" ]; then
        sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
        sudo nginx -t && sudo systemctl reload nginx
        log "Nginx reloaded"
    fi

    # Show status
    echo ""
    pm2 list
    echo ""
    log "Deployment complete!"
    log "Web   → https://$DOMAIN"
    log "Admin → https://$ADMIN_DOMAIN"
}

# ── Entrypoint ──────────────────────────────────────────────────────────────
case "${1:-}" in
    --setup) setup ;;
    *)       deploy ;;
esac
