import { Depth, IListRequestOptions, IListResponse } from "../rest-api-interfaces";
import { RestClient } from "../rest-client";
import { ILandingPage } from "./landing-page-interfaces";
export declare class LandingPageClient {
    private client;
    constructor(client: RestClient);
    getLandingPages(options: IListRequestOptions): Promise<IListResponse<ILandingPage>>;
    getLandingPage(id: number, depth?: Depth): Promise<ILandingPage>;
}
//# sourceMappingURL=landing-pages-client.d.ts.map