import { Depth, IListRequestOptions, IListResponse } from "..";
import { RestClient } from "../rest-client";
import { IEmail } from "./emails-interfaces";
export declare class EmailClient {
    private client;
    constructor(client: RestClient);
    getEmails(options: IListRequestOptions): Promise<IListResponse<IEmail>>;
    getEmail(id: number, depth?: Depth): Promise<IEmail>;
}
//# sourceMappingURL=emails-client.d.ts.map