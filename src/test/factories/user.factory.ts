import { faker } from '@faker-js/faker'

export interface TestUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  is_admin?: boolean
  created_at?: string
  updated_at?: string
}

export class UserFactory {
  static create(overrides?: Partial<TestUser>): TestUser {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      full_name: faker.person.fullName(),
      avatar_url: faker.image.avatar(),
      is_admin: false,
      created_at: faker.date.past().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }
  }
  
  static createMany(count: number, overrides?: Partial<TestUser>): TestUser[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createAdmin(overrides?: Partial<TestUser>): TestUser {
    return this.create({
      is_admin: true,
      email: `admin-${faker.string.alphanumeric(6)}@test.com`,
      ...overrides
    })
  }

  static createWithProfile(overrides?: Partial<TestUser>) {
    const user = this.create(overrides)
    return {
      ...user,
      profile: {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    }
  }
}