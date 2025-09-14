#!/bin/bash

# Script to remove secrets from git history
# WARNING: This will rewrite git history!

echo "🔒 Removing secrets from git history..."
echo "WARNING: This will rewrite git history!"
echo ""

# The commit with the secret
PROBLEM_COMMIT="5519e8a93b57e1f21954b89fdf454ffb5f511e0e"

# Option 1: Interactive rebase to edit the specific commit
echo "Option 1: Interactive Rebase (Recommended for recent commits)"
echo "Run these commands:"
echo ""
echo "# 1. Start interactive rebase from the commit before the problem"
echo "git rebase -i ${PROBLEM_COMMIT}^"
echo ""
echo "# 2. In the editor, change 'pick' to 'edit' for the problem commit"
echo "# 3. Save and exit the editor"
echo ""
echo "# 4. Edit the file to remove the secret"
echo "nano docs/RASPBERRY_PI_BOT_DEPLOYMENT.md"
echo ""
echo "# 5. Stage the changes"
echo "git add docs/RASPBERRY_PI_BOT_DEPLOYMENT.md"
echo ""
echo "# 6. Amend the commit"
echo "git commit --amend --no-edit"
echo ""
echo "# 7. Continue the rebase"
echo "git rebase --continue"
echo ""
echo "# 8. Force push (CAREFUL!)"
echo "git push --force-with-lease origin master"
echo ""
echo "---"
echo ""

# Option 2: Using filter-branch (more aggressive)
echo "Option 2: Filter-branch (For deeper cleaning)"
echo "Run this command:"
echo ""
cat << 'EOF'
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/RASPBERRY_PI_BOT_DEPLOYMENT.md" \
  --prune-empty --tag-name-filter cat -- --all

# Then add the file back with secrets removed
git add docs/RASPBERRY_PI_BOT_DEPLOYMENT.md
git commit -m "Re-add deployment docs without secrets"
git push --force-with-lease origin master
EOF

echo ""
echo "---"
echo ""

# Option 3: Using BFG Repo-Cleaner (easiest but needs tool)
echo "Option 3: BFG Repo-Cleaner (Easiest)"
echo "1. Install BFG: brew install bfg (Mac) or download from https://rtyley.github.io/bfg-repo-cleaner/"
echo "2. Create a file 'secrets.txt' with the token to remove:"
echo "   echo 'YOUR-DISCORD-TOKEN-HERE' > secrets.txt"
echo "3. Run BFG:"
echo "   bfg --replace-text secrets.txt"
echo "4. Clean up:"
echo "   git reflog expire --expire=now --all && git gc --prune=now --aggressive"
echo "5. Force push:"
echo "   git push --force-with-lease origin master"
echo ""
echo "---"
echo ""

# Option 4: Simple solution - if you haven't pushed many commits after
echo "Option 4: Reset and Recommit (If secret is in recent commits)"
echo "Run these commands:"
echo ""
echo "# 1. Reset to before the problem commit"
echo "git reset --soft ${PROBLEM_COMMIT}^"
echo ""
echo "# 2. Fix the file"
echo "# (Already done - file is fixed)"
echo ""
echo "# 3. Recommit everything"
echo "git add ."
echo "git commit -m 'Add deployment docs and auto-update system'"
echo ""
echo "# 4. Cherry-pick any commits that came after (if any)"
echo "# git cherry-pick <commit-hash>"
echo ""
echo "# 5. Force push"
echo "git push --force-with-lease origin master"
echo ""
echo "---"
echo ""

echo "⚠️  IMPORTANT NOTES:"
echo "1. These commands will rewrite history"
echo "2. If others have pulled, they'll need to re-clone or reset"
echo "3. The secret is already compromised - regenerate the Discord token!"
echo "4. Add .env to .gitignore to prevent future leaks"
echo ""
echo "🔑 After cleaning, regenerate your Discord bot token at:"
echo "https://discord.com/developers/applications"