export interface Organization {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly createdByUserId: string;
    readonly createdAt: string;
    readonly corpAdminEmail?: string;
    readonly corpAdminName?: string;
  }
  
  export interface CreateOrganizationInput {
    readonly name: string;
    readonly slug: string;
    readonly corpAdminEmail: string;
    readonly corpAdminName: string;
  }