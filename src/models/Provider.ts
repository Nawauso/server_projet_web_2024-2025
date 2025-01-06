
export class Provider {
    protected logoUrl: string;
    protected name: string;
    protected id: number;

    constructor(provider_ID: number, provider_Name: string, logo_Path: string) {
        this.logoUrl = logo_Path;
        this.name = provider_Name;
        this.id = provider_ID;
    }
    static fromJSON (data: any) : Provider {
        return new Provider(data.logo_Path, data.provider_Name, data.provider_ID );
    }
}