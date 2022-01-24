"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getListPath = "/api/REST/1.0/assets/landingPages";
const getItemPath = "/api/REST/1.0/assets/landingPage";
class LandingPageClient {
    constructor(client) {
        this.client = client;
    }
    getLandingPages(options) {
        return this.client.getList(getListPath, options);
    }
    getLandingPage(id, depth) {
        return this.client.getItem(getItemPath, id, depth);
    }
}
exports.LandingPageClient = LandingPageClient;
//# sourceMappingURL=landing-pages-client.js.map