"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getArguments() {
    const allArgs = parseArguments();
    return {
        password: allArgs["--elq-password"],
        siteName: allArgs["--elq-site-name"],
        userName: allArgs["--elq-user-name"],
    };
}
exports.default = getArguments;
function parseArguments() {
    const result = {};
    process.argv.forEach((value) => {
        const keyValue = value.split("=");
        result[keyValue[0]] = keyValue.length > 1 ? keyValue[1] : keyValue[0];
    });
    return result;
}
//# sourceMappingURL=get-arguments.js.map