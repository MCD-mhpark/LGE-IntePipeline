import { IBaseUrl } from "./base-urls/base-url-interfaces";
import { IEloquaCredentials } from "./eloqua-credentials";
import { Depth, IListRequestOptions, IListResponse } from "./rest-api-interfaces";
export declare class RestClient {
    private credentials;
    private baseUrls;
    constructor(credentials: IEloquaCredentials, baseUrls: IBaseUrl);
    getList<T>(endpointPath: string, options?: IListRequestOptions): Promise<IListResponse<T>>;
    getItem<T>(endpointPath: string, id: number, depth?: Depth): Promise<T>;
    private getRestConfig;
    private makeStandardAbsoluteUrl;
    private readResponse;
}
//# sourceMappingURL=rest-client.d.ts.map