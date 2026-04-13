/**
 * Privacy: expanded ad & tracker blocking (hostname substring match).
 */

const ExtraBlocklist = require('./adblock-domains');

const PrivacyService = {
    blockedCount: 0,

    shouldBlock(url) {
        if (!url) return false;
        try {
            const domain = new URL(url).hostname.toLowerCase();
            const isTracker = ExtraBlocklist.some((t) => domain.includes(t.toLowerCase()));
            if (isTracker) {
                this.blockedCount++;
                return true;
            }
        } catch (e) {}
        return false;
    },

    getBlockedCount() {
        return this.blockedCount;
    },

    reset() {
        this.blockedCount = 0;
    }
};

module.exports = PrivacyService;
