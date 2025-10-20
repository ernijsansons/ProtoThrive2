#!/usr/bin/env node

// Script to fix all ESLint errors in ProtoThrive frontend
const fs = require('fs');
const path = require('path');

const fixes = [
  // EmailCaptureModal.tsx
  {
    file: 'frontend/src/components/EmailCaptureModal.tsx',
    replacements: [
      {
        from: '<a href="/terms"',
        to: '<Link href="/terms"'
      },
      {
        from: '<a href="/privacy"',
        to: '<Link href="/privacy"'
      },
      {
        from: "We'll send you",
        to: "We&apos;ll send you"
      },
      {
        from: "Check your email!",
        to: "Check your email!"
      }
    ]
  },
  // beta-terms.tsx
  {
    file: 'frontend/src/pages/beta-terms.tsx',
    replacements: [
      {
        from: 'PROVIDED "AS IS" WITHOUT',
        to: 'PROVIDED &quot;AS IS&quot; WITHOUT'
      }
    ]
  },
  // dashboard.tsx
  {
    file: 'frontend/src/pages/dashboard.tsx',
    replacements: [
      {
        from: '<a href="/" className="flex items-center',
        to: '<Link href="/" className="flex items-center'
      }
    ]
  },
  // docs.tsx
  {
    file: 'frontend/src/pages/docs.tsx',
    replacements: [
      {
        from: "system that doesn't just",
        to: "system that doesn&apos;t just"
      }
    ]
  },
  // forgot-password.tsx
  {
    file: 'frontend/src/pages/forgot-password.tsx',
    replacements: [
      {
        from: "Don't have an account?",
        to: "Don&apos;t have an account?"
      },
      {
        from: "Didn't receive the email?",
        to: "Didn&apos;t receive the email?"
      }
    ]
  },
  // index-simple.tsx
  {
    file: 'frontend/src/pages/index-simple.tsx',
    replacements: [
      {
        from: "world's most advanced",
        to: "world&apos;s most advanced"
      }
    ]
  },
  // index.tsx
  {
    file: 'frontend/src/pages/index.tsx',
    replacements: [
      {
        from: "world's most advanced",
        to: "world&apos;s most advanced"
      }
    ]
  },
  // login-simple.tsx
  {
    file: 'frontend/src/pages/login-simple.tsx',
    replacements: [
      {
        from: "Don't have an account?",
        to: "Don&apos;t have an account?"
      }
    ]
  },
  // login.tsx
  {
    file: 'frontend/src/pages/login.tsx',
    replacements: [
      {
        from: "Don't have an account?",
        to: "Don&apos;t have an account?"
      }
    ]
  },
  // pricing-simple.tsx
  {
    file: 'frontend/src/pages/pricing-simple.tsx',
    replacements: [
      {
        from: "can't keep up",
        to: "can&apos;t keep up"
      },
      {
        from: "you're building",
        to: "you&apos;re building"
      }
    ]
  },
  // privacy.tsx
  {
    file: 'frontend/src/pages/privacy.tsx',
    replacements: [
      {
        from: '"ProtoThrive"',
        to: '&quot;ProtoThrive&quot;'
      },
      {
        from: '"we"',
        to: '&quot;we&quot;'
      },
      {
        from: '"us"',
        to: '&quot;us&quot;'
      },
      {
        from: '"our"',
        to: '&quot;our&quot;'
      },
      {
        from: '"Company"',
        to: '&quot;Company&quot;'
      },
      {
        from: '"Service"',
        to: '&quot;Service&quot;'
      },
      {
        from: "don't",
        to: "don&apos;t"
      }
    ]
  },
  // terms.tsx
  {
    file: 'frontend/src/pages/terms.tsx',
    replacements: [
      {
        from: "user's access",
        to: "user&apos;s access"
      },
      {
        from: '"Agreement"',
        to: '&quot;Agreement&quot;'
      },
      {
        from: '"Terms"',
        to: '&quot;Terms&quot;'
      },
      {
        from: "user's obligations",
        to: "user&apos;s obligations"
      },
      {
        from: '"Service"',
        to: '&quot;Service&quot;'
      }
    ]
  }
];

console.log('🔧 Starting ESLint error fixes for ProtoThrive...\n');

fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;
  
  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      changesMade++;
    }
  });
  
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${changesMade} issues in ${file}`);
  } else {
    console.log(`ℹ️  No changes needed in ${file}`);
  }
});

console.log('\n🎉 All ESLint fixes completed!');
console.log('Run "npm run lint --prefix frontend" to verify fixes.');