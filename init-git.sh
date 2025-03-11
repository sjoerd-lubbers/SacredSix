#!/bin/bash

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit of Sacred Six application"

# Instructions for setting up remote repository
echo ""
echo "Git repository initialized with initial commit."
echo ""
echo "To connect to a remote repository, run the following commands:"
echo "  git remote add origin <your-repository-url>"
echo "  git push -u origin main"
echo ""
echo "Replace <your-repository-url> with your GitHub/GitLab/Bitbucket repository URL."
