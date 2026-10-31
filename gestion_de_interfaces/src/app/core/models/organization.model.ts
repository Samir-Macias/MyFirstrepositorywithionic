export interface Organization {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly createdByUserId: string;
    readonly createdAt: string;
    readonly corpAdminEmail?: string;
    readonly corpAdminName?: string;
    readonly members?: readonly OrganizationMember[];
    readonly memberCount?: number;
  }

  export interface OrganizationMember {
    readonly id: string;
    readonly email: string;
    readonly fullName: string;
    readonly role: 'CORP_ADMIN' | 'STANDARD_USER';
  }

  export interface UpdateOrganizationInput {
    readonly name: string;
    readonly slug: string;
  }
  
  export interface CreateOrganizationInput {
    readonly name: string;
    readonly slug: string;
    readonly corpAdminEmail: string;
    readonly corpAdminName: string;
  }