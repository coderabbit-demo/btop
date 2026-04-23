#!/bin/bash

# Script to create a branch, commit changes, push to all remotes, and create PRs
# Usage: ./create-pr.sh <branch-name> <commit-message> <pr-title> [pr-description]
#
# Prerequisites:
# - Bitbucket: API key at ~/.bitbucket-api-key (required for BB PRs)
# - GitHub: gh CLI (preferred) or token at ~/.github-token
# - GitLab: glab CLI (required for GL PRs)

# Don't exit on error - we want to continue even if some remotes fail
set +e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required arguments are provided
if [ $# -lt 3 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <branch-name> <commit-message> <pr-title> [pr-description]"
    echo ""
    echo "Example:"
    echo "  $0 feature/new-ui 'Add new UI components' 'Add New UI Components' 'This PR adds new UI components for better UX'"
    exit 1
fi

BRANCH_NAME="$1"
COMMIT_MESSAGE="$2"
PR_TITLE="$3"
PR_DESCRIPTION="${4:-$COMMIT_MESSAGE}"

# Add Claude Code signature to commit message and PR description
COMMIT_MESSAGE_FULL="$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

PR_DESCRIPTION_FULL="$PR_DESCRIPTION

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

echo -e "${GREEN}Starting automated PR creation workflow...${NC}"
echo ""

# Step 1: Create and checkout new branch
echo -e "${YELLOW}Step 1: Creating branch '$BRANCH_NAME'...${NC}"
# Delete branch if it already exists
git branch -D "$BRANCH_NAME" 2>/dev/null
git checkout -b "$BRANCH_NAME"
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to create branch '$BRANCH_NAME'${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Branch created and checked out${NC}"
echo ""

# Step 2: Stage all changes
echo -e "${YELLOW}Step 2: Staging changes...${NC}"
git add .
echo -e "${GREEN}✓ Changes staged${NC}"
echo ""

# Step 3: Commit changes
echo -e "${YELLOW}Step 3: Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE_FULL"
echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

# Step 4: Push to all remotes
echo -e "${YELLOW}Step 4: Pushing to all remotes...${NC}"

# Get base branch (default to main)
BASE_BRANCH="${BASE_BRANCH:-main}"

# Track successful pushes (bash 3.2 compatible)
PUSHED_BB=0
PUSHED_GH=0
PUSHED_GL=0

# Push to each remote
for remote in bb gh gl; do
    echo -e "  Pushing to ${YELLOW}$remote${NC}..."
    if git push -u "$remote" "$BRANCH_NAME" 2>/dev/null; then
        echo -e "  ${GREEN}✓ Pushed to $remote${NC}"
        case $remote in
            bb) PUSHED_BB=1 ;;
            gh) PUSHED_GH=1 ;;
            gl) PUSHED_GL=1 ;;
        esac
    else
        echo -e "  ${RED}✗ Failed to push to $remote (server may be unavailable)${NC}"
    fi
done
echo ""

# Step 5: Create PRs
echo -e "${YELLOW}Step 5: Creating pull requests...${NC}"
echo ""

# Load Bitbucket API key
if [ -f ~/.bitbucket-api-key ]; then
    BB_API_KEY=$(cat ~/.bitbucket-api-key)
else
    echo -e "${RED}Warning: Bitbucket API key not found at ~/.bitbucket-api-key${NC}"
    BB_API_KEY=""
fi

# Load GitHub token
if [ -f ~/.github-token ]; then
    GH_TOKEN=$(cat ~/.github-token)
else
    echo -e "${YELLOW}Info: GitHub token not found at ~/.github-token. Attempting to use gh CLI...${NC}"
    GH_TOKEN=""
fi

# Create PR on Bitbucket
if [ "$PUSHED_BB" = "1" ]; then
    if [ -n "$BB_API_KEY" ]; then
        echo -e "  Creating PR on ${YELLOW}Bitbucket${NC}..."
        # Escape special characters in description for JSON
        PR_DESC_ESCAPED=$(echo "$PR_DESCRIPTION_FULL" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed '$ s/\\n$//')
        PR_TITLE_ESCAPED=$(echo "$PR_TITLE" | sed 's/"/\\"/g')

        BB_RESPONSE=$(curl -s -X POST \
          -u "jbingham@coderabbit.ai:$BB_API_KEY" \
          -H "Content-Type: application/json" \
          https://api.bitbucket.org/2.0/repositories/demo-coderabbit/btop/pullrequests \
          -d "{\"title\":\"$PR_TITLE_ESCAPED\",\"source\":{\"branch\":{\"name\":\"$BRANCH_NAME\"}},\"destination\":{\"branch\":{\"name\":\"$BASE_BRANCH\"}},\"description\":\"$PR_DESC_ESCAPED\"}")

        BB_PR_URL=$(echo "$BB_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('links', {}).get('html', {}).get('href', ''))" 2>/dev/null)
        if [ -n "$BB_PR_URL" ]; then
            echo -e "  ${GREEN}✓ Bitbucket PR created: $BB_PR_URL${NC}"
        else
            echo -e "  ${RED}✗ Failed to create Bitbucket PR${NC}"
            echo -e "  ${RED}Response: $BB_RESPONSE${NC}"
        fi
    else
        echo -e "  ${YELLOW}⊘ Skipping Bitbucket PR (no API key)${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping Bitbucket PR (push failed)${NC}"
fi

# Create PR on GitHub
if [ "$PUSHED_GH" = "1" ]; then
    echo -e "  Creating PR on ${YELLOW}GitHub${NC}..."
    if command -v gh &> /dev/null; then
        GH_PR_URL=$(gh pr create --repo coderabbit-demo/btop \
          --title "$PR_TITLE" \
          --body "$PR_DESCRIPTION_FULL" \
          --base "$BASE_BRANCH" \
          --head "$BRANCH_NAME" 2>&1)

        if [[ $GH_PR_URL == http* ]]; then
            echo -e "  ${GREEN}✓ GitHub PR created: $GH_PR_URL${NC}"
        else
            echo -e "  ${RED}✗ Failed to create GitHub PR: $GH_PR_URL${NC}"
        fi
    elif [ -n "$GH_TOKEN" ]; then
        GH_RESPONSE=$(curl -s -X POST \
          -H "Authorization: token $GH_TOKEN" \
          -H "Content-Type: application/json" \
          https://api.github.com/repos/coderabbit-demo/btop/pulls \
          -d "{
            \"title\": \"$PR_TITLE\",
            \"body\": \"$PR_DESCRIPTION_FULL\",
            \"head\": \"$BRANCH_NAME\",
            \"base\": \"$BASE_BRANCH\"
          }")

        GH_PR_URL=$(echo "$GH_RESPONSE" | grep -o '"html_url":"[^"]*"' | head -1 | sed 's/"html_url":"//;s/"$//')
        if [ -n "$GH_PR_URL" ]; then
            echo -e "  ${GREEN}✓ GitHub PR created: $GH_PR_URL${NC}"
        else
            echo -e "  ${RED}✗ Failed to create GitHub PR${NC}"
        fi
    else
        echo -e "  ${YELLOW}⊘ Skipping GitHub PR (no gh CLI or token found)${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping GitHub PR (push failed)${NC}"
fi

# Create PR on GitLab (gitlab.com)
if [ "$PUSHED_GL" = "1" ]; then
    echo -e "  Creating PR on ${YELLOW}GitLab (gitlab.com)${NC}..."
    if command -v glab &> /dev/null; then
        GLAB_PR_URL=$(glab mr create --repo demo-coderabbit/btop \
          --title "$PR_TITLE" \
          --description "$PR_DESCRIPTION_FULL" \
          --source-branch "$BRANCH_NAME" \
          --target-branch "$BASE_BRANCH" 2>&1 | grep -o 'https://[^ ]*')

        if [ -n "$GLAB_PR_URL" ]; then
            echo -e "  ${GREEN}✓ GitLab MR created: $GLAB_PR_URL${NC}"
        else
            echo -e "  ${RED}✗ Failed to create GitLab MR${NC}"
        fi
    else
        echo -e "  ${YELLOW}⊘ Skipping GitLab MR (glab CLI not found)${NC}"
    fi
else
    echo -e "  ${YELLOW}⊘ Skipping GitLab MR (push failed)${NC}"
fi

echo ""
echo -e "${GREEN}Workflow completed!${NC}"
echo ""

# Build list of successful pushes
SUCCESSFUL_REMOTES=""
for remote in bb gh gl; do
    case $remote in
        bb) PUSHED=$PUSHED_BB ;;
        gh) PUSHED=$PUSHED_GH ;;
        gl) PUSHED=$PUSHED_GL ;;
    esac

    if [ "$PUSHED" = "1" ]; then
        if [ -z "$SUCCESSFUL_REMOTES" ]; then
            SUCCESSFUL_REMOTES="$remote"
        else
            SUCCESSFUL_REMOTES="$SUCCESSFUL_REMOTES, $remote"
        fi
    fi
done

# Build list of failed pushes
FAILED_REMOTES=""
for remote in bb gh gl; do
    case $remote in
        bb) PUSHED=$PUSHED_BB ;;
        gh) PUSHED=$PUSHED_GH ;;
        gl) PUSHED=$PUSHED_GL ;;
    esac

    if [ "$PUSHED" = "0" ]; then
        if [ -z "$FAILED_REMOTES" ]; then
            FAILED_REMOTES="$remote"
        else
            FAILED_REMOTES="$FAILED_REMOTES, $remote"
        fi
    fi
done

echo "Summary:"
echo "  Branch: $BRANCH_NAME"
if [ -n "$SUCCESSFUL_REMOTES" ]; then
    echo -e "  ${GREEN}✓ Pushed to: $SUCCESSFUL_REMOTES${NC}"
fi
if [ -n "$FAILED_REMOTES" ]; then
    echo -e "  ${RED}✗ Failed to push to: $FAILED_REMOTES${NC}"
fi
echo "  PRs created on available platforms"
