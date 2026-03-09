#!/bin/bash
# Setup script for Alibaba Cloud ECS instance (Ubuntu/Debian or CentOS/Alinux)
# Run this once on your ECS instance to prepare it for M360 deployment
set -e

echo "=== M360 ECS Setup ==="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt-get update
        apt-get install -y ca-certificates curl gnupg
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif [[ "$OS" == "centos" || "$OS" == "alinux" || "$OS" == "rhel" ]]; then
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Create app directory
echo "Creating app directory..."
mkdir -p /opt/m360/nginx/certs

# Create production .env if it doesn't exist
if [ ! -f /opt/m360/.env ]; then
    echo "Creating .env file (EDIT THIS with real values)..."
    cat > /opt/m360/.env << 'EOF'
# Database
DB_USER=m360
DB_PASSWORD=CHANGE_ME_USE_STRONG_PASSWORD
DB_NAME=m360

# Redis
REDIS_PASSWORD=CHANGE_ME_USE_STRONG_PASSWORD

# JWT
JWT_SECRET=CHANGE_ME_USE_openssl_rand_base64_32

# App
API_URL=http://YOUR_ECS_PUBLIC_IP
IMAGE_TAG=latest
EOF
    echo ""
    echo "*** IMPORTANT: Edit /opt/m360/.env with real passwords! ***"
    echo "  Generate secrets with: openssl rand -base64 32"
    echo ""
fi

# Copy docker-compose and nginx config
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit /opt/m360/.env with real passwords"
echo "  2. Copy docker-compose.prod.yml to /opt/m360/"
echo "  3. Copy nginx/ directory to /opt/m360/nginx/"
echo "  4. Set up GitHub secrets (see README)"
echo "  5. Push to main branch to trigger deployment"
