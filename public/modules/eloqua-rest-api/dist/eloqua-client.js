"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_url_client_1 = require("./base-urls/base-url-client");
const emails_client_1 = require("./emails/emails-client");
const landing_pages_client_1 = require("./landing-pages/landing-pages-client");
const rest_client_1 = require("./rest-client");
class EloquaClient {
    constructor(credentials, baseUrls) {
        this.credentials = credentials;
        this.baseUrls = baseUrls;
        this.restClient = new rest_client_1.RestClient(credentials, baseUrls);
        this.landingPages = new landing_pages_client_1.LandingPageClient(this.restClient);
        this.emails = new emails_client_1.EmailClient(this.restClient);
    }
    static login(siteName, userName, password) {
        const credentials = {
            password,
            siteName,
            userName,
        };
        return this.getBaseUrls(credentials)
            .then((baseUrls) => {
            return new EloquaClient(credentials, baseUrls);
        }).catch((error) => {
            throw error;
        });
    }
    static getBaseUrls(credentials) {
        return base_url_client_1.BaseUrlClient.get(credentials);
    }
    get LandingPages() {
        return this.landingPages;
    }
    get Emails() {
        return this.emails;
    }
}
exports.EloquaClient = EloquaClient;
//# sourceMappingURL=eloqua-client.js.map