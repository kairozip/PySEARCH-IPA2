/**
 * Bang Shortcuts Service
 * Maps ! shortcuts to search engine URLs
 */

const BangsMapping = {
    '!w':   'https://en.wikipedia.org/wiki/Special:Search?search=',
    '!y':   'https://www.youtube.com/results?search_query=',
    '!yt':  'https://www.youtube.com/results?search_query=',
    '!g':   'https://www.google.com/search?q=',
    '!r':   'https://www.reddit.com/search/?q=',
    '!gh':  'https://github.com/search?q=',
    '!a':   'https://www.amazon.com/s?k=',
    '!d':   'https://duckduckgo.com/?q=',
    '!tw':  'https://twitter.com/search?q=',
    '!ig':  'https://www.instagram.com/explore/tags/',
    '!priv': 'https://duckduckgo.com/?q=',
    '!stack': 'https://stackoverflow.com/search?q=',
    '!wolf': 'https://www.wolframalpha.com/input/?i=',
    '!map':  'https://www.google.com/maps/search/',
    '!news': 'https://news.google.com/search?q='
};

const BangsService = {
    parse(input) {
        const raw = (input || '').trim();
        if (!raw) return null;

        // Pattern: [query] ![key] OR ![key] [query]
        const bangMatch = raw.match(/!\w+/);
        if (!bangMatch) return null;

        const key = bangMatch[0].toLowerCase();
        const baseQuery = raw.replace(key, '').trim();
        
        if (BangsMapping[key]) {
            return BangsMapping[key] + encodeURIComponent(baseQuery);
        }

        return null;
    }
};

if (typeof module !== 'undefined') module.exports = BangsService;
