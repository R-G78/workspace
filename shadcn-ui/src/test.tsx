import React from 'react';
import { createRoot } from 'react-dom/client';

const Test = () => (
  <div className="p-8">
    <h1 className="text-2xl">React is working!</h1>
  </div>
);

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Test />);
} else {
  console.error('Root element not found');
}
