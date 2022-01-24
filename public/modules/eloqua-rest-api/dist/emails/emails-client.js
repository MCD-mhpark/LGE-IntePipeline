"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getListPath = "/api/REST/1.0/assets/emails";
const getItemPath = "/api/REST/1.0/assets/email";
class EmailClient {
    constructor(client) {
        this.client = client;
    }
    getEmails(options) {
        return this.client.getList(getListPath, options);
    }
    getEmail(id, depth) {
        return this.client.getItem(getItemPath, id, depth);
    }
}
exports.EmailClient = EmailClient;
//# sourceMappingURL=emails-client.js.map