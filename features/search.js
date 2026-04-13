/**
 * Search Service for PySearch Browser (2026 Edition)
 * Handles URL normalization and search engine routing
 */

const SearchService = {
    process(input, engine = 'duckduckgo') {
        const raw = (input || '').trim();
        if (!raw) return '';

        // Check for Bangs (!)
        const BangsService = require('./bangs');
        const bangUrl = BangsService.parse(raw);
        if (bangUrl) return bangUrl;

        if (/^(about:|file:|data:|chrome:|pysearch:|doublep:)/i.test(raw)) return raw;
        if (/^https?:\/\//i.test(raw)) return raw;

        const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
        const localhostPattern = /^localhost(:\d+)?(\/.*)?$/;
        
        if ((domainPattern.test(raw) || localhostPattern.test(raw)) && !raw.includes(' ')) {
            return 'https://' + raw;
        }

        return this.getSearchUrl(raw, engine);
    },

    getSearchUrl(query, engine) {
        const encoded = encodeURIComponent(query);
        switch (engine) {
            case 'google': return `https://www.google.com/search?q=${encoded}`;
            case 'bing':   return `https://www.bing.com/search?q=${encoded}`;
            case 'lucky':  return `https://duckduckgo.com/?q=%5C${encoded}`;
            default:       return `https://duckduckgo.com/?q=${encoded}`;
        }
    }
};

if (typeof module !== 'undefined') module.exports = SearchService;
