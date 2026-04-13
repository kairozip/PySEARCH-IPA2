(function() {
    if (window.dark_mode_injected) return;
    window.dark_mode_injected = true;

    const css = `
        html, body {
            filter: invert(1) hue-rotate(180deg) !important;
            background-color: #000 !important;
        }
        /* RE-INVERT MEDIA: Restores original colors for images/videos */
        img, video, iframe, canvas, [style*="background-image"], .gb_A {
            filter: invert(1) hue-rotate(180deg) !important;
        }
    `;
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
})();
