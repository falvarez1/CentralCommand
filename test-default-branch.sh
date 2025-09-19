#!/bin/bash

# Script to verify master is set as default branch
# This script can be run to test the branch configuration

echo "=== Central Command - Branch Configuration Test ==="
echo

# Check current branch
echo "1. Current branch:"
git branch --show-current
echo

# Check remote HEAD
echo "2. Remote HEAD configuration:"
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo "Remote HEAD not set locally"
echo

# Check if master branch exists
echo "3. Master branch availability:"
if git show-ref --verify --quiet refs/heads/master; then
    echo "✓ Master branch exists locally"
else
    echo "✗ Master branch not found locally"
fi

if git show-ref --verify --quiet refs/remotes/origin/master; then
    echo "✓ Master branch exists on remote"
else
    echo "✗ Master branch not found on remote"
fi
echo

# Show all branches
echo "4. All available branches:"
git branch -a
echo

# Test checkout to master
echo "5. Testing checkout to master:"
if git checkout master 2>/dev/null; then
    echo "✓ Successfully switched to master branch"
    echo "Current HEAD commit:"
    git log --oneline -1
    
    # Switch back to original branch
    git checkout - >/dev/null 2>&1
else
    echo "✗ Failed to checkout master branch"
fi
echo

echo "=== Test Complete ==="