
export class Provider {
    protected provider_id: number;
    protected provider_name: string;
    protected logo_path: string;

    constructor(provider_id: number, logo_path: string, provider_name: string) {
        this.provider_id = provider_id;
        this.provider_name = provider_name;
        this.logo_path = logo_path;
    }
    static fromJSON (data: any) : Provider {
        return new Provider(data.provider_id, data.provider_name, data.logo_path );
    }
}