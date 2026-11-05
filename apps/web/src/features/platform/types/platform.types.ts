export interface PlatformRole {
  id: string
  code: string
  name: string
}

export interface PlatformOrganization {
  id: string
  code: string
  name: string
  active: boolean
  owner: {
    id: string
    displayName: string
    email: string
    role: PlatformRole
  } | null
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface PlatformOrganizationFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface PlatformOrganizationsResponse {
  data: PlatformOrganization[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CreatePlatformOrganizationInput {
  code: string
  name: string
  owner: {
    displayName: string
    email: string
    username: string
    password: string
    roleId: string
  }
}

export interface UpdatePlatformOrganizationInput {
  code: string
  name: string
  ownerRoleId: string
  ownerName?: string
  ownerEmail?: string
}

export interface PlatformOrganizationMember {
  id: string
  username: string
  displayName: string
  email: string
  active: boolean
  joinedAt: string
  role: PlatformRole
}

export interface CreatePlatformOrganizationMemberInput {
  displayName: string
  email: string
  username: string
  password: string
  roleId: string
}
