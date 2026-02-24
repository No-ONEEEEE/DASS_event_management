/**
 * Dark Theme Enforcer
 * Runs after DOM load and auto-darkens any element still using a light background.
 * Works on every page regardless of class names.
 */
(function () {
    const DARK_BG = '#1c2128';
    const DARKER_BG = '#21262d';
    const TEXT_PRIMARY = '#e6edf3';
    const TEXT_SECONDARY = '#8b949e';
    const BORDER = '#30363d';
    const BASE_BG = '#0d1117';

    // Light colors to replace — r,g,b thresholds
    function isLight(r, g, b, a) {
        if (a < 0.05) return false; // transparent — skip
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance > 150; // 0-255 scale; >150 = light
    }

    function parseRgb(str) {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
    }

    function darkenElement(el) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;

        const bgRgb = parseRgb(bg);
        if (bgRgb && isLight(bgRgb.r, bgRgb.g, bgRgb.b, bgRgb.a)) {
            // Keep gradient buttons/headers — skip elements with gradient background-image
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none') return;

            el.style.setProperty('background-color', DARK_BG, 'important');
            el.style.setProperty('border-color', BORDER, 'important');
        }

        const colorRgb = parseRgb(color);
        if (colorRgb && isLight(colorRgb.r, colorRgb.g, colorRgb.b, 1)) {
            // Already white/light text — fine
        } else if (colorRgb && !isLight(colorRgb.r, colorRgb.g, colorRgb.b, 1)) {
            // Dark text on (now) dark bg — make it light
            if (bgRgb && isLight(bgRgb.r, bgRgb.g, bgRgb.b, bgRgb.a)) {
                el.style.setProperty('color', TEXT_PRIMARY, 'important');
            }
        }
    }

    function enforce() {
        // Skip these tags/classes entirely
        const skip = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'SVG', 'PATH']);
        const skipClasses = ['btn-primary', 'btn-register', 'btn-danger', 'logout-btn',
            'status-badge', 'tag', 'badge', 'toast', 'event-header', 'header',
            'progress-fill', 'status-published', 'status-approved'];

        document.querySelectorAll('*').forEach(el => {
            if (skip.has(el.tagName)) return;
            if (skipClasses.some(c => el.classList.contains(c))) return;
            // Skip elements inside gradient headers
            if (el.closest('.event-header, .header, header, .navbar')) return;
            // Skip toasts
            if (el.closest('#toast-container')) return;

            darkenElement(el);
        });

        // Also darken label text that's grey/dark in light-mode
        document.querySelectorAll('label, .info-item label, h1, h2, h3, h4, h5, h6, p, span, td, th, li').forEach(el => {
            const clr = window.getComputedStyle(el).color;
            const rgb = parseRgb(clr);
            if (rgb && !isLight(rgb.r, rgb.g, rgb.b, 1) && rgb.r < 180) {
                el.style.setProperty('color', TEXT_SECONDARY, 'important');
            }
        });
    }

    // Run after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(enforce, 50));
    } else {
        setTimeout(enforce, 50);
    }

    // Re-run after dynamic content loads (AJAX, etc.)
    const observer = new MutationObserver(() => setTimeout(enforce, 100));
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
