# Visual Regression E2E Testing

This system provides automated visual regression testing with GitHub PR integration, allowing you to review and approve visual changes directly within the pull request interface.

## How It Works

### 1. **Automatic Testing**
- When a PR is created, E2E tests run against the deployed preview
- Visual snapshots are captured and compared against baseline images
- Any differences are detected and processed automatically

### 2. **PR Integration**
- If visual differences are detected, a comment is posted on the PR with:
  - Summary of test results (pass/fail)
  - Count of visual differences detected  
  - Links to downloadable artifacts containing visual comparisons
  - Instructions for approval

### 3. **Review Process**
- Download the visual diff artifacts from the PR comment
- Review the side-by-side comparisons:
  - **Expected**: Current baseline image
  - **Actual**: New image from your changes
  - **Difference**: Highlighted pixel differences
- Decide whether changes are intentional and acceptable

### 4. **Approval**
- If changes look correct, comment: `@scalar-bot approve-visuals`
- The bot will automatically:
  - Download the new images
  - Update the baseline snapshots
  - Commit the changes to your PR branch
  - Add a success comment

## Commands

### PR Comments
- `@scalar-bot approve-visuals` - Approve and apply visual changes

### Local Development
```bash
# Run visual regression tests locally
pnpm test:e2e themes

# Update snapshots manually (after reviewing changes)
pnpm test:e2e themes --update-snapshots

# Process visual diffs (generate comparison artifacts)
pnpm process-visual-diffs
```