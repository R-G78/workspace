require('@testing-library/jest-dom');

require('@testing-library/jest-dom');

// Mock ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.ResizeObserver = ResizeObserver;

// Mock pointer capture methods
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};
