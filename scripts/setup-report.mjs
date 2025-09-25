#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function printSection(title, content) {
  console.log(`${colors.bright}${colors.green}▶ ${title}${colors.reset}`);
  if (typeof content === 'object') {
    Object.entries(content).forEach(([key, value]) => {
      console.log(`  ${colors.yellow}${key}:${colors.reset} ${value}`);
    });
  } else {
    console.log(`  ${content}`);
  }
  console.log();
}

function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function detectFramework() {
  const frontendPkg = readPackageJson(path.join(projectRoot, 'frontend', 'package.json'));

  if (!frontendPkg) {
    return { framework: 'Unknown', version: 'N/A' };
  }

  const deps = { ...frontendPkg.dependencies, ...frontendPkg.devDependencies };

  if (deps.next) {
    return {
      framework: 'Next.js',
      version: deps.next.replace('^', ''),
      react: deps.react?.replace('^', ''),
      typescript: deps.typescript?.replace('^', '')
    };
  }

  if (deps.react) {
    return {
      framework: 'React',
      version: deps.react.replace('^', '')
    };
  }

  if (deps.vue) {
    return {
      framework: 'Vue',
      version: deps.vue.replace('^', '')
    };
  }

  return { framework: 'Unknown', version: 'N/A' };
}

function detectStyling() {
  const frontendPkg = readPackageJson(path.join(projectRoot, 'frontend', 'package.json'));
  const methods = [];

  if (!frontendPkg) return methods;

  const deps = { ...frontendPkg.dependencies, ...frontendPkg.devDependencies };

  // Check for Tailwind
  if (deps.tailwindcss) {
    methods.push(`Tailwind CSS ${deps.tailwindcss.replace('^', '')}`);

    // Check for Tailwind config
    const configPath = path.join(projectRoot, 'frontend', 'tailwind.config.js');
    if (fs.existsSync(configPath)) {
      methods.push('✓ tailwind.config.js found');
    }
  }

  // Check for CSS-in-JS libraries
  if (deps['styled-components']) methods.push('Styled Components');
  if (deps['@emotion/react']) methods.push('Emotion');
  if (deps['@stitches/react']) methods.push('Stitches');

  // Check for component libraries
  if (deps['@mui/material']) methods.push('Material-UI');
  if (deps['@chakra-ui/react']) methods.push('Chakra UI');
  if (deps.antd) methods.push('Ant Design');

  // Check for PostCSS
  if (deps.postcss) {
    methods.push(`PostCSS ${deps.postcss.replace('^', '')}`);
  }

  return methods;
}

function detectRouting() {
  const pagesDir = path.join(projectRoot, 'frontend', 'src', 'pages');
  const appDir = path.join(projectRoot, 'frontend', 'src', 'app');

  if (fs.existsSync(appDir)) {
    return 'Next.js App Router';
  }

  if (fs.existsSync(pagesDir)) {
    // Count pages
    const pages = fs.readdirSync(pagesDir)
      .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'))
      .filter(f => !f.startsWith('_'));

    return `Next.js Pages Router (${pages.length} pages)`;
  }

  return 'Custom/Unknown';
}

function detectUILibraries() {
  const frontendPkg = readPackageJson(path.join(projectRoot, 'frontend', 'package.json'));
  const libraries = [];

  if (!frontendPkg) return libraries;

  const deps = { ...frontendPkg.dependencies };

  const uiLibs = {
    '@heroicons/react': 'Heroicons',
    'lucide-react': 'Lucide Icons',
    'framer-motion': 'Framer Motion',
    'reactflow': 'React Flow',
    '@splinetool/react-spline': 'Spline 3D',
    '@clerk/nextjs': 'Clerk Auth',
    'react-hook-form': 'React Hook Form',
    'react-query': 'React Query',
    '@tanstack/react-query': 'TanStack Query',
    'swr': 'SWR',
    'zustand': 'Zustand',
    'redux': 'Redux',
    'mobx': 'MobX',
    'recoil': 'Recoil',
    'jotai': 'Jotai'
  };

  Object.entries(uiLibs).forEach(([pkg, name]) => {
    if (deps[pkg]) {
      libraries.push(`${name} (${deps[pkg].replace('^', '')})`);
    }
  });

  return libraries;
}

function detectDesignTokens() {
  const globalsPath = path.join(projectRoot, 'frontend', 'src', 'styles', 'globals.css');
  const tailwindPath = path.join(projectRoot, 'frontend', 'tailwind.config.js');

  const tokens = {
    cssVariables: false,
    tailwindTheme: false,
    customColors: 0,
    animations: 0
  };

  // Check globals.css for CSS variables
  if (fs.existsSync(globalsPath)) {
    const content = fs.readFileSync(globalsPath, 'utf-8');
    const varMatches = content.match(/--[\w-]+:/g);
    if (varMatches) {
      tokens.cssVariables = true;
      tokens.customColors = varMatches.length;
    }
  }

  // Check tailwind config
  if (fs.existsSync(tailwindPath)) {
    tokens.tailwindTheme = true;
    const content = fs.readFileSync(tailwindPath, 'utf-8');
    const animMatches = content.match(/animation:\s*{/g);
    if (animMatches) {
      tokens.animations = animMatches.length;
    }
  }

  return tokens;
}

function generateReport() {
  printHeader('ProtoThrive2 Stack Metadata Report');

  // Framework Detection
  const framework = detectFramework();
  printSection('Framework & Versions', framework);

  // Routing Method
  const routing = detectRouting();
  printSection('Routing Method', routing);

  // Styling Methods
  const styling = detectStyling();
  printSection('Styling Methods', styling.length > 0 ? styling.join('\n  ') : 'None detected');

  // UI Libraries
  const uiLibs = detectUILibraries();
  printSection('UI Libraries', uiLibs.length > 0 ? uiLibs.join('\n  ') : 'None detected');

  // Design Tokens
  const tokens = detectDesignTokens();
  printSection('Design Tokens', {
    'CSS Variables': tokens.cssVariables ? `Yes (${tokens.customColors} custom properties)` : 'No',
    'Tailwind Theme': tokens.tailwindTheme ? 'Yes' : 'No',
    'Animations': tokens.animations > 0 ? `${tokens.animations} custom` : 'None'
  });

  // Project Structure
  const structure = {
    'Frontend': fs.existsSync(path.join(projectRoot, 'frontend')) ? '✓' : '✗',
    'Backend': fs.existsSync(path.join(projectRoot, 'backend')) ? '✓' : '✗',
    'Tests': fs.existsSync(path.join(projectRoot, 'frontend', 'src', '__tests__')) ? '✓' : '✗',
    'E2E Tests': fs.existsSync(path.join(projectRoot, 'frontend', 'e2e')) ? '✓' : '✗',
    'CI/CD': fs.existsSync(path.join(projectRoot, '.github', 'workflows')) ? '✓' : '✗'
  };
  printSection('Project Structure', structure);

  // Testing Setup
  const frontendPkg = readPackageJson(path.join(projectRoot, 'frontend', 'package.json'));
  const testing = [];
  if (frontendPkg?.devDependencies?.jest) testing.push('Jest');
  if (frontendPkg?.devDependencies?.['@playwright/test']) testing.push('Playwright');
  if (frontendPkg?.devDependencies?.cypress) testing.push('Cypress');
  if (frontendPkg?.devDependencies?.artillery) testing.push('Artillery (Load Testing)');
  if (frontendPkg?.devDependencies?.['@testing-library/react']) testing.push('React Testing Library');

  printSection('Testing Tools', testing.length > 0 ? testing.join('\n  ') : 'None detected');

  // Summary
  console.log(`${colors.bright}${colors.magenta}${'─'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}Report generated: ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.dim}Run 'npm run lint' and 'npm run test:ui' for UI/UX auditing${colors.reset}\n`);
}

// Run the report
generateReport();