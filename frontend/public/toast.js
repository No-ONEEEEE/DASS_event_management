/**
 * Toast Notification System
 * Replaces native browser alert() with styled pop-ups.
 * Include this script in any page to enable toasts.
 */
(function () {
    // Inject styles once
    const style = document.createElement('style');
    style.textContent = `
    #toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 280px;
      max-width: 400px;
      padding: 14px 18px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #fff;
      pointer-events: all;
      animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
      position: relative;
      overflow: hidden;
    }
    .toast.toast-out {
      animation: toastOut 0.3s ease forwards;
    }
    .toast-success { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .toast-error   { background: linear-gradient(135deg, #c0392b, #e74c3c); }
    .toast-warning { background: linear-gradient(135deg, #f39c12, #f1c40f); color: #333; }
    .toast-info    { background: linear-gradient(135deg, #667eea, #764ba2); }
    .toast-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
    .toast-body { flex: 1; }
    .toast-title { font-weight: 700; margin-bottom: 2px; }
    .toast-msg   { opacity: 0.92; }
    .toast-close {
      background: none; border: none; color: inherit;
      cursor: pointer; font-size: 18px; line-height: 1;
      opacity: 0.7; padding: 0; flex-shrink: 0;
      margin-top: -2px;
    }
    .toast-close:hover { opacity: 1; }
    .toast-progress {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: rgba(255,255,255,0.5); border-radius: 0 0 12px 12px;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(60px) scale(0.9); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(60px) scale(0.9); }
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `;
    document.head.appendChild(style);

    // Create container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const ICONS = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const TITLES = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
    };

    function showToast(message, type = 'info', duration = 4000) {
        // Ensure container exists in DOM
        if (!document.getElementById('toast-container')) {
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || 'ℹ️'}</span>
      <div class="toast-body">
        <div class="toast-title">${TITLES[type] || 'Notice'}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">×</button>
      <div class="toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>
    `;

        container.appendChild(toast);

        const close = () => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        };

        toast.querySelector('.toast-close').addEventListener('click', close);
        setTimeout(close, duration);
    }

    // Public API
    window.showToast = showToast;

    // Override native alert()
    window.alert = function (message) {
        const msg = String(message);
        // Detect type from message content
        let type = 'info';
        const lower = msg.toLowerCase();
        if (lower.startsWith('error') || lower.includes('failed') || lower.includes('incorrect') || lower.includes('invalid') || lower.includes('out of stock') || lower.includes('expired')) {
            type = 'error';
        } else if (lower.includes('success') || lower.includes('successful') || lower.includes('✅')) {
            type = 'success';
        } else if (lower.includes('warning') || lower.includes('please') || lower.includes('must be') || lower.includes('exceeds') || lower.includes('empty') || lower.includes('deadline')) {
            type = 'warning';
        }
        showToast(msg, type);
    };
})();
