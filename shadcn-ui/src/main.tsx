import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug logging
console.log('main.tsx: Starting app mount');

// Add component logger
const logRender = (Comp: any) => {
  return (props: any) => {
    console.log(`Rendering component: ${Comp.name}`);
    try {
      return <Comp {...props} />;
    } catch (error) {
      console.error(`Error rendering ${Comp.name}:`, error);
      throw error;
    }
  };
};

// Add error tracking
const originalError = console.error;
console.error = (...args) => {
  originalError.apply(console, args);
  console.trace('Error stack trace:');
};

// Check if React is loaded
console.log('React version:', React.version);
console.log('React available:', !!React);
console.log('ReactDOM available:', !!createRoot);

function showErrorOverlay(title: string, details?: any) {
	// Remove existing overlay if present
	const existing = document.getElementById('app-error-overlay');
	if (existing) existing.remove();

	const overlay = document.createElement('div');
	overlay.id = 'app-error-overlay';
	overlay.style.position = 'fixed';
	overlay.style.left = '0';
	overlay.style.top = '0';
	overlay.style.width = '100%';
	overlay.style.height = '100%';
	overlay.style.zIndex = '9999';
	overlay.style.background = 'rgba(17,24,39,0.95)';
	overlay.style.color = '#fff';
	overlay.style.padding = '24px';
	overlay.style.overflow = 'auto';
	overlay.innerHTML = `
		<div style="max-width:1200px;margin:40px auto;font-family:Inter, Arial, sans-serif">
			<h1 style="color:#ff6b6b;margin:0 0 12px 0">${title}</h1>
			<pre style="white-space:pre-wrap;background:#111827;padding:12px;border-radius:8px;color:#f8f8f2">${String(
				details instanceof Error ? details.stack || details.message : details
			)}</pre>
			<p style="margin-top:12px;opacity:0.85">Open DevTools (Cmd+Opt+I) → Console for more details.</p>
		</div>
	`;
	document.body.appendChild(overlay);
}

window.addEventListener('error', (ev) => {
	try {
		console.error('Unhandled error', ev.error || ev.message, ev);
		showErrorOverlay('Unhandled error', ev.error || ev.message || ev);
	} catch (e) {
		// ignore
	}
});

window.addEventListener('unhandledrejection', (ev) => {
	try {
		console.error('Unhandled promise rejection', ev.reason);
		showErrorOverlay('Unhandled promise rejection', ev.reason);
	} catch (e) {
		// ignore
	}
});

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');
  
  console.log('main.tsx: Creating root');
  const reactRoot = createRoot(root);
  
  console.log('main.tsx: Rendering App');
  reactRoot.render(
    <React.StrictMode>
      {logRender(App)({})}  {/* Pass empty props object */}
    </React.StrictMode>
  );
  
  console.log('main.tsx: Render complete');
} catch (error) {
  console.error('Fatal error during app initialization:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: system-ui;">
      <h1 style="color: red;">App Failed to Start</h1>
      <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error?.stack || error}</pre>
    </div>
  `;
}