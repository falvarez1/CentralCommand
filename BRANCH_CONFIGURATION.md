# Branch Configuration

## Default Branch

This repository uses **`master`** as the default branch for all development and deployment activities.

### Key Information

- **Primary Branch**: `master`
- **Purpose**: Main development branch where all features are integrated
- **Status**: Production-ready code
- **Protection**: All commits to master should be thoroughly tested

### Clone Instructions

When cloning this repository, you will automatically be on the master branch:

```bash
git clone https://github.com/falvarez1/CentralCommand.git
cd CentralCommand

# Verify you're on master (should be automatic)
git branch --show-current
# Output: master
```

### Branch Strategy

1. **`master`** - Main production branch (default)
2. **Feature branches** - For new development
3. **Release branches** - For release preparation
4. **Hotfix branches** - For critical fixes

### For Developers

Always ensure you're working from the latest master branch:

```bash
# Make sure you're on master
git checkout master

# Pull latest changes
git pull origin master

# Create your feature branch
git checkout -b feature/your-feature-name
```

---

**Note**: This configuration establishes `master` as the primary development branch for the Central Command project.