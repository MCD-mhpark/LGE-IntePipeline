"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios = __importStar(require("axios"));
const loginUrl = "https://login.eloqua.com/id";
class BaseUrlClient {
    static get(credentials) {
        return axios.default.get(loginUrl, {
            auth: {
                password: credentials.password,
                username: `${credentials.siteName}\\${credentials.userName}`,
            },
        }).then((response) => {
            if (response.status === 200 && typeof response.data === "object") {
                return response.data;
            }
            else {
                throw Error(response.statusText);
            }
        });
    }
    constructor() { }
}
exports.BaseUrlClient = BaseUrlClient;
//# sourceMappingURL=base-url-client.js.map