// Ref: CLAUDE.md - Simple Toast Component
export function toast(message: string) {
  console.log(`Toast: ${message}`);
  // Simple toast implementation - in production use sonner/react-toastify
  const toastEl = document.createElement('div');
  toastEl.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg z-50';
  toastEl.textContent = message;
  document.body.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 3000);
}