import React from 'react';
import { Button, Card, GradientText } from '../components/ComponentLibrary';

export default function TestDesign() {
  return (
    <div style={{ padding: '40px', background: 'var(--gray-50)' }}>
      <h1>Design System Test Page</h1>
      <p>Testing if design system CSS is loaded</p>

      <div style={{ marginTop: '32px' }}>
        <h2><GradientText>Gradient Text Test</GradientText></h2>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>

      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <Card>
          <h3>Card 1</h3>
          <p>Regular card</p>
        </Card>
        <Card glow>
          <h3>Card 2</h3>
          <p>Card with glow effect</p>
        </Card>
        <Card>
          <h3>Card 3</h3>
          <p>Another card</p>
        </Card>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2>CSS Variables Test</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: 100, height: 100, background: 'var(--primary-500)', borderRadius: '8px' }} />
          <div style={{ width: 100, height: 100, background: 'var(--gradient-primary)', borderRadius: '8px' }} />
          <div style={{ width: 100, height: 100, background: 'var(--gradient-secondary)', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}
