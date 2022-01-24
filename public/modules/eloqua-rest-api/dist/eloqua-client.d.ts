import { EmailClient } from "./emails/emails-client";
import { LandingPageClient } from "./landing-pages/landing-pages-client";
export declare class EloquaClient {
    private credentials;
    private baseUrls;
    static login(siteName: string, userName: string, password: string): Promise<EloquaClient>;
    private static getBaseUrls;
    private restClient;
    private landingPages;
    private emails;
    get LandingPages(): LandingPageClient;
    get Emails(): EmailClient;
    private constructor();
}
//# sourceMappingURL=eloqua-client.d.ts.map