#!/bin/bash

echo "Testing NRGHax Pages..."
echo "========================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Function to test a page
test_page() {
    local url=$1
    local name=$2

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓${NC} $name ($url) - Status: $response"

        # Check for specific issues
        content=$(curl -s "$url")

        # Check for database errors
        if echo "$content" | grep -q "PGRST"; then
            echo -e "  ${YELLOW}⚠${NC} Database connection issue detected"
        fi

        # Check for React errors
        if echo "$content" | grep -q "Error"; then
            echo -e "  ${YELLOW}⚠${NC} Possible error on page"
        fi

    elif [ "$response" = "307" ] || [ "$response" = "302" ]; then
        echo -e "${YELLOW}↪${NC} $name ($url) - Redirect: $response"
    else
        echo -e "${RED}✗${NC} $name ($url) - Status: $response"
    fi
}

# Test public pages
echo ""
echo "Testing Public Pages:"
test_page "$BASE_URL/" "Homepage"
test_page "$BASE_URL/auth" "Auth Page"
test_page "$BASE_URL/hacks" "Hacks Page"

# Test protected pages (will redirect if not logged in)
echo ""
echo "Testing Protected Pages:"
test_page "$BASE_URL/dashboard" "Dashboard"
test_page "$BASE_URL/onboarding" "Onboarding"
test_page "$BASE_URL/profile" "Profile"

# Test admin pages
echo ""
echo "Testing Admin Pages:"
test_page "$BASE_URL/admin/tags" "Admin Tags"
test_page "$BASE_URL/admin/hacks/new" "New Hack"
test_page "$BASE_URL/admin/users" "Admin Users"

# Check API endpoints
echo ""
echo "Testing API Endpoints:"
test_page "$BASE_URL/api/admin/tags" "Tags API"

echo ""
echo "========================"
echo "Test Complete!"