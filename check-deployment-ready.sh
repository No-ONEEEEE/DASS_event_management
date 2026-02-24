#!/bin/bash

echo "========================================="
echo "   Event Management System"
echo "   Pre-Deployment Checklist"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "1. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

# Check npm
echo "2. Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check dependencies
echo "3. Checking dependencies..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json found${NC}"
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠ Dependencies not installed. Run: npm install${NC}"
    fi
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

# Check .env file
echo "4. Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠ .env file not found. Copy from .env.example${NC}"
fi

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example exists${NC}"
else
    echo -e "${YELLOW}⚠ .env.example not found${NC}"
fi

# Check gitignore
echo "5. Checking .gitignore..."
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✓ .gitignore exists${NC}"
    
    if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
        echo -e "${GREEN}✓ .gitignore properly configured${NC}"
    else
        echo -e "${YELLOW}⚠ .gitignore may need updating${NC}"
    fi
else
    echo -e "${RED}✗ .gitignore not found${NC}"
fi

# Check deployment files
echo "6. Checking deployment configuration..."
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓ vercel.json exists${NC}"
else
    echo -e "${YELLOW}⚠ vercel.json not found${NC}"
fi

if [ -f "deployment.txt" ]; then
    echo -e "${GREEN}✓ deployment.txt exists${NC}"
else
    echo -e "${RED}✗ deployment.txt not found${NC}"
fi

# Check config.js
echo "7. Checking frontend configuration..."
if [ -f "public/config.js" ]; then
    echo -e "${GREEN}✓ public/config.js exists${NC}"
    
    if grep -q "your-backend-api.onrender.com" public/config.js; then
        echo -e "${YELLOW}⚠ Update backend URL in public/config.js${NC}"
    fi
else
    echo -e "${RED}✗ public/config.js not found${NC}"
fi

# Check Git
echo "8. Checking Git status..."
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git installed${NC}"
    
    if [ -d ".git" ]; then
        echo -e "${GREEN}✓ Git repository initialized${NC}"
    else
        echo -e "${YELLOW}⚠ Not a git repository. Run: git init${NC}"
    fi
else
    echo -e "${RED}✗ Git not installed${NC}"
fi

# Check directory structure
echo "9. Checking project structure..."
REQUIRED_DIRS=("server" "views" "public" "server/models" "server/routes")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ $dir/ exists${NC}"
    else
        echo -e "${RED}✗ $dir/ not found${NC}"
    fi
done

# Summary
echo ""
echo "========================================="
echo "   Summary"
echo "========================================="
echo ""
echo "Next steps for deployment:"
echo ""
echo "1. Update public/config.js with your backend URL"
echo "2. Commit code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "3. Deploy backend to Render:"
echo "   https://render.com"
echo ""
echo "4. Deploy frontend to Vercel:"
echo "   https://vercel.com"
echo ""
echo "5. Update deployment.txt with URLs"
echo ""
echo "📖 See DEPLOYMENT_QUICK_START.md for details"
echo ""
echo "========================================="
