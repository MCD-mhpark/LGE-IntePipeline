"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class RestClient {
    constructor(credentials, baseUrls) {
        this.credentials = credentials;
        this.baseUrls = baseUrls;
    }
    getList(endpointPath, options) {
        return axios_1.default.get(this.makeStandardAbsoluteUrl(endpointPath), this.getRestConfig(options)).then((response) => {
            return this.readResponse(response);
        }).catch((error) => {
            throw error;
        });
    }
    getItem(endpointPath, id, depth) {
        const options = depth ? { depth } : null;
        return axios_1.default.get(this.makeStandardAbsoluteUrl(endpointPath, id), this.getRestConfig(options)).then((response) => {
            return this.readResponse(response);
        }).catch((error) => {
            throw error;
        });
    }
    getRestConfig(options) {
        const config = {
            auth: {
                password: this.credentials.password,
                username: `${this.credentials.siteName}\\${this.credentials.userName}`,
            },
        };
        if (options) {
            config.params = options;
        }
        return config;
    }
    makeStandardAbsoluteUrl(apiPath, id) {
        if (id) {
            return `${this.baseUrls.urls.base}${apiPath}/${id}`;
        }
        else {
            return `${this.baseUrls.urls.base}${apiPath}`;
        }
    }
    readResponse(response) {
        if (response.status === 200 && typeof response.data !== "undefined") {
            return response.data;
        }
        else {
            throw new Error(response.statusText);
        }
    }
}
exports.RestClient = RestClient;
//# sourceMappingURL=rest-client.js.map