# 🤝 Contributing to Senju

Thank you for your interest in contributing to Senju! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Bug Reports](#bug-reports)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Any conduct that could be considered inappropriate

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/senju.git
cd senju
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/senju.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Helius API key
```

### 6. Run Development Server

```bash
npm run dev
```

---

## 💻 Development Workflow

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code refactoring
- `test/` — Adding tests
- `chore/` — Maintenance tasks

### Make Your Changes

1. Write clean, readable code
2. Follow existing code style
3. Add comments for complex logic
4. Update documentation if needed

### Test Your Changes

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# Test locally
npm run dev
```

### Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

See [Commit Guidelines](#commit-guidelines) below.

### Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template
5. Submit!

---

## 📝 Coding Standards

### TypeScript

- **Always use TypeScript** — No JavaScript files
- **No `any` types** — Use proper types or `unknown`
- **Export types** — Make types reusable
- **Use interfaces** — For object shapes

```typescript
// ✅ Good
interface TokenData {
  address: string;
  symbol: string;
  price: number;
}

function getToken(address: string): Promise<TokenData> {
  // ...
}

// ❌ Bad
function getToken(address: any): any {
  // ...
}
```

### React Components

- **Use functional components** — No class components
- **Use hooks** — useState, useEffect, etc.
- **Extract logic** — Use custom hooks for complex logic
- **Memoize when needed** — useMemo, useCallback

```typescript
// ✅ Good
export function TokenCard({ address }: { address: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["token", address],
    queryFn: () => fetchToken(address),
  });

  if (isLoading) return <Skeleton />;
  return <div>{data.symbol}</div>;
}

// ❌ Bad
export function TokenCard(props: any) {
  const [data, setData] = useState();
  useEffect(() => {
    fetch(`/api/token/${props.address}`).then(r => r.json()).then(setData);
  }, []);
  return <div>{data?.symbol}</div>;
}
```

### File Organization

- **One component per file** — Except for small helpers
- **Co-locate related files** — Keep components with their styles
- **Use barrel exports** — index.ts for clean imports

```typescript
// src/components/dashboard/index.ts
export { OverviewTab } from "./OverviewTab";
export { LiquidityTab } from "./LiquidityTab";
export { FeeClaimTab } from "./FeeClaimTab";
```

### Naming Conventions

- **Components:** PascalCase (`TokenCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useTokenData.ts`)
- **Utils:** camelCase (`formatters.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_LIMITS`)
- **Types:** PascalCase (`TokenInfo`)

### Comments

```typescript
// ✅ Good — Explain WHY, not WHAT
// Fallback to on-chain data when DexScreener fails
if (!pairs.length) {
  pairs = await getOnChainPools(mint);
}

// ❌ Bad — Obvious comment
// Get pairs
const pairs = await getPairs(mint);
```

---

## 📦 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Code style (formatting, semicolons)
- `refactor` — Code refactoring
- `perf` — Performance improvement
- `test` — Adding tests
- `chore` — Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(fees): add Meteora fee detection"

# Bug fix
git commit -m "fix(api): handle null token metadata"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor(constants): extract magic numbers"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API now returns { data, error } instead of direct data"
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] TypeScript compiles without errors
- [ ] Lint passes without warnings
- [ ] Build succeeds
- [ ] Tested locally
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated Checks** — CI/CD runs tests
2. **Code Review** — Maintainer reviews code
3. **Feedback** — Address review comments
4. **Approval** — Maintainer approves PR
5. **Merge** — PR merged to main

---

## ✨ Adding New Features

### New Platform Detection

1. **Create detector file**
   ```typescript
   // src/lib/platforms/yourplatform.ts
   import type { PlatformDetector } from "./types";

   export const yourPlatformDetector: PlatformDetector = {
     id: "yourplatform",
     name: "Your Platform",
     color: "#ff0000",
     detect: async ({ mint, dexIds, labels }) => {
       // Detection logic
       return true; // or false
     },
     getTokenUrl: (mint) => `https://yourplatform.com/token/${mint}`,
   };
   ```

2. **Register detector**
   ```typescript
   // src/lib/platforms/index.ts
   import { yourPlatformDetector } from "./yourplatform";

   const DETECTORS: PlatformDetector[] = [
     // ... existing detectors
     yourPlatformDetector,
   ];
   ```

3. **Add icon**
   - Place icon at `public/platforms/yourplatform.png`
   - Recommended size: 64x64px or larger
   - Format: PNG with transparency

### New Fee Source

1. **Create source file**
   ```typescript
   // src/lib/fees/sources/yourdex.ts
   import type { FeeSource } from "../types";

   export const yourDexFeeSource: FeeSource = {
     name: "yourdex",
     getFeeClaims: async (mint) => {
       // Fetch fee claims
       return [];
     },
   };
   ```

2. **Register source**
   ```typescript
   // src/lib/fees/index.ts
   import { yourDexFeeSource } from "./sources/yourdex";

   const SOURCES: FeeSource[] = [
     // ... existing sources
     yourDexFeeSource,
   ];
   ```

### New Lock Program

1. **Create detector**
   ```typescript
   // src/lib/locks/yourprogram.ts
   export async function getYourProgramLocks(mint: string): Promise<TokenLock[]> {
     // On-chain detection logic
     return [];
   }
   ```

2. **Register in aggregator**
   ```typescript
   // src/lib/locks/index.ts
   import { getYourProgramLocks } from "./yourprogram";

   export async function getAllLocks(mint: string): Promise<TokenLock[]> {
     const results = await Promise.allSettled([
       // ... existing detectors
       getYourProgramLocks(mint),
     ]);
     // ...
   }
   ```

---

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** — Check if already reported
2. **Reproduce the bug** — Ensure it's consistent
3. **Gather information** — Browser, OS, steps to reproduce

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
Add screenshots if applicable

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Node: 20.10.0
- Next.js: 16.2.3

## Additional Context
Any other relevant information
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem It Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other solutions you've thought about

## Additional Context
Mockups, examples, etc.
```

---

## 📞 Questions?

- **GitHub Discussions** — For general questions
- **GitHub Issues** — For bugs and features
- **Discord** — For real-time chat (if available)

---

## 🙏 Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping make Senju better!

---

**Happy Coding! 🚀**
