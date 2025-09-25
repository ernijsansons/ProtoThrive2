#!/usr/bin/env node

/**
 * Color Contrast Audit Script for ProtoThrive Neon Theme
 * Checks WCAG AA and AAA compliance for all color combinations
 */

// Color definitions from the theme
const colors = {
  // Neon colors
  'neon-blue-primary': '#00D2FF',
  'neon-blue-secondary': '#0099CC',
  'neon-blue-light': '#33DDFF',
  'neon-blue-dark': '#0088BB',
  'neon-green-primary': '#00FF88',
  'neon-green-secondary': '#00CC66',
  'neon-green-light': '#33FF99',
  'neon-green-dark': '#00BB55',
  'neon-purple': '#BB00FF',
  'neon-cyan': '#00FFDD',
  'neon-pink': '#FF0088',
  'neon-orange': '#FF6600',
  
  // Dark backgrounds
  'dark-primary': '#0A0A0B',
  'dark-secondary': '#1A1A1B',
  'dark-tertiary': '#2A2A2B',
  'dark-hover': '#3A3A3B',
  
  // Text colors
  'text-primary': '#FFFFFF',
  'text-secondary': '#CCCCCC',
  'text-muted': '#888888',
  
  // Light theme colors
  'light-bg': '#FFFFFF',
  'light-text': '#111827'
};

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance
function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Check WCAG compliance
function checkWCAGCompliance(ratio) {
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    AALarge: ratio >= 3,
    AAALarge: ratio >= 4.5
  };
}

// Main audit function
function auditColorContrast() {
  console.log('🎨 ProtoThrive Color Contrast Audit\n');
  console.log('=' .repeat(60));
  
  const issues = [];
  const recommendations = [];
  
  // Test combinations
  const testCombinations = [
    // Text on dark backgrounds
    { fg: 'text-primary', bg: 'dark-primary', context: 'Primary text on dark background' },
    { fg: 'text-secondary', bg: 'dark-primary', context: 'Secondary text on dark background' },
    { fg: 'text-muted', bg: 'dark-primary', context: 'Muted text on dark background' },
    { fg: 'neon-blue-primary', bg: 'dark-primary', context: 'Neon blue text on dark background' },
    { fg: 'neon-green-primary', bg: 'dark-primary', context: 'Neon green text on dark background' },
    { fg: 'neon-purple', bg: 'dark-primary', context: 'Neon purple text on dark background' },
    
    // Text on secondary backgrounds
    { fg: 'text-primary', bg: 'dark-secondary', context: 'Primary text on secondary background' },
    { fg: 'text-secondary', bg: 'dark-secondary', context: 'Secondary text on secondary background' },
    { fg: 'neon-blue-primary', bg: 'dark-secondary', context: 'Neon blue text on secondary background' },
    
    // Neon colors on each other
    { fg: 'neon-blue-primary', bg: 'neon-green-primary', context: 'Neon blue on neon green' },
    { fg: 'neon-green-primary', bg: 'neon-blue-primary', context: 'Neon green on neon blue' },
    
    // Light theme combinations
    { fg: 'light-text', bg: 'light-bg', context: 'Light theme text on background' },
    { fg: 'neon-blue-primary', bg: 'light-bg', context: 'Neon blue on light background' },
    { fg: 'neon-green-primary', bg: 'light-bg', context: 'Neon green on light background' }
  ];
  
  testCombinations.forEach(({ fg, bg, context }) => {
    const fgColor = colors[fg];
    const bgColor = colors[bg];
    
    if (!fgColor || !bgColor) {
      console.log(`❌ Missing color definition: ${fg} or ${bg}`);
      return;
    }
    
    const ratio = getContrastRatio(fgColor, bgColor);
    const compliance = checkWCAGCompliance(ratio);
    
    console.log(`\n📋 ${context}`);
    console.log(`   Foreground: ${fg} (${fgColor})`);
    console.log(`   Background: ${bg} (${bgColor})`);
    console.log(`   Contrast Ratio: ${ratio.toFixed(2)}`);
    
    // Check compliance
    if (compliance.AA) {
      console.log(`   ✅ WCAG AA: PASS`);
    } else {
      console.log(`   ❌ WCAG AA: FAIL`);
      issues.push({ context, ratio, fg, bg, fgColor, bgColor });
    }
    
    if (compliance.AAA) {
      console.log(`   ✅ WCAG AAA: PASS`);
    } else {
      console.log(`   ⚠️  WCAG AAA: FAIL`);
    }
    
    if (compliance.AALarge) {
      console.log(`   ✅ WCAG AA Large: PASS`);
    } else {
      console.log(`   ❌ WCAG AA Large: FAIL`);
    }
  });
  
  // Generate recommendations
  console.log('\n' + '=' .repeat(60));
  console.log('🔧 RECOMMENDATIONS\n');
  
  if (issues.length === 0) {
    console.log('✅ All color combinations meet WCAG AA standards!');
  } else {
    console.log(`❌ Found ${issues.length} accessibility issues:\n`);
    
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.context}`);
      console.log(`   Current ratio: ${issue.ratio.toFixed(2)} (needs 4.5+ for AA)`);
      
      // Suggest improvements
      if (issue.ratio < 3) {
        console.log(`   💡 Consider using a darker background or lighter text`);
        console.log(`   💡 Alternative: Use ${issue.fg} on dark-tertiary (#2A2A2B)`);
      } else if (issue.ratio < 4.5) {
        console.log(`   💡 Close to compliance - consider slight adjustments`);
        console.log(`   💡 Try adding a subtle background or border`);
      }
      console.log('');
    });
  }
  
  // Specific recommendations for neon colors
  console.log('🎨 Neon Color Specific Recommendations:\n');
  
  const neonColors = ['neon-blue-primary', 'neon-green-primary', 'neon-purple', 'neon-cyan', 'neon-pink', 'neon-orange'];
  
  neonColors.forEach(color => {
    const colorValue = colors[color];
    const ratioOnDark = getContrastRatio(colorValue, colors['dark-primary']);
    const ratioOnLight = getContrastRatio(colorValue, colors['light-bg']);
    
    console.log(`🔵 ${color} (${colorValue}):`);
    console.log(`   On dark background: ${ratioOnDark.toFixed(2)} ${ratioOnDark >= 4.5 ? '✅' : '❌'}`);
    console.log(`   On light background: ${ratioOnLight.toFixed(2)} ${ratioOnLight >= 4.5 ? '✅' : '❌'}`);
    
    if (ratioOnDark < 4.5 && ratioOnLight < 4.5) {
      console.log(`   💡 Consider using this color only for decorative elements or with sufficient background contrast`);
    }
    console.log('');
  });
  
  // Generate CSS fixes
  console.log('🛠️  SUGGESTED CSS FIXES:\n');
  console.log('/* High contrast alternatives for better accessibility */');
  console.log(':root {');
  console.log('  /* Improved neon colors with better contrast */');
  console.log('  --neon-blue-accessible: #00B8E6; /* Slightly darker for better contrast */');
  console.log('  --neon-green-accessible: #00E677; /* Slightly darker for better contrast */');
  console.log('  --neon-purple-accessible: #A600E6; /* Slightly darker for better contrast */');
  console.log('  ');
  console.log('  /* High contrast text alternatives */');
  console.log('  --text-high-contrast: #FFFFFF; /* Pure white for maximum contrast */');
  console.log('  --text-medium-contrast: #E0E0E0; /* Light gray for secondary text */');
  console.log('  ');
  console.log('  /* Accessible background variations */');
  console.log('  --bg-high-contrast: #000000; /* Pure black for maximum contrast */');
  console.log('  --bg-medium-contrast: #1A1A1A; /* Dark gray for better contrast */');
  console.log('}');
  console.log('');
  console.log('/* Utility classes for accessible text */');
  console.log('.text-accessible {');
  console.log('  color: var(--text-high-contrast);');
  console.log('  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8); /* Add shadow for better readability */');
  console.log('}');
  console.log('');
  console.log('.bg-accessible {');
  console.log('  background: var(--bg-high-contrast);');
  console.log('  border: 1px solid var(--neon-blue-accessible);');
  console.log('}');
  
  return { issues, recommendations };
}

// Run the audit
if (require.main === module) {
  auditColorContrast();
}

module.exports = { auditColorContrast, getContrastRatio, checkWCAGCompliance };
