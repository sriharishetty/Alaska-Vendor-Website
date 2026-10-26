/* Shared navigation motion. Loaded once per static page. */
(() => {
    if (window.productionOperationsMotionReady) return;
    window.productionOperationsMotionReady = true;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");
        if (!link || reducedMotion.matches || event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute("download")) return;

        const destination = new URL(link.href, window.location.href);
        const current = new URL(window.location.href);
        const sameDocument = destination.origin === current.origin && destination.pathname === current.pathname;

        if (destination.origin !== current.origin || sameDocument || destination.protocol !== current.protocol) return;

        event.preventDefault();
        document.body.classList.add("page-is-leaving");
        window.setTimeout(() => { window.location.href = destination.href; }, 240);
    });
})();
