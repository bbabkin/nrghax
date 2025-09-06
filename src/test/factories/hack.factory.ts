import { faker } from '@faker-js/faker'

export interface TestHack {
  id: string
  name: string
  description: string
  image_url: string
  content_type: 'content' | 'link'
  content_body?: string | null
  external_link?: string | null
  created_at?: string
  updated_at?: string
  like_count?: number
  completion_count?: number
  is_liked?: boolean
  is_completed?: boolean
}

export class HackFactory {
  static create(overrides?: Partial<TestHack>): TestHack {
    const contentType = overrides?.content_type || faker.helpers.arrayElement(['content', 'link'] as const)
    
    return {
      id: faker.string.uuid(),
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      image_url: faker.image.url(),
      content_type: contentType,
      content_body: contentType === 'content' ? faker.lorem.paragraphs(3) : null,
      external_link: contentType === 'link' ? faker.internet.url() : null,
      created_at: faker.date.past().toISOString(),
      updated_at: new Date().toISOString(),
      like_count: faker.number.int({ min: 0, max: 100 }),
      completion_count: faker.number.int({ min: 0, max: 50 }),
      is_liked: false,
      is_completed: false,
      ...overrides
    }
  }
  
  static createMany(count: number, overrides?: Partial<TestHack>): TestHack[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createContentHack(overrides?: Partial<TestHack>): TestHack {
    return this.create({
      content_type: 'content',
      content_body: faker.lorem.paragraphs(5),
      external_link: null,
      ...overrides
    })
  }

  static createLinkHack(overrides?: Partial<TestHack>): TestHack {
    return this.create({
      content_type: 'link',
      content_body: null,
      external_link: faker.internet.url(),
      ...overrides
    })
  }

  static createCompletedHack(overrides?: Partial<TestHack>): TestHack {
    return this.create({
      is_completed: true,
      completion_count: faker.number.int({ min: 10, max: 100 }),
      ...overrides
    })
  }

  static createLikedHack(overrides?: Partial<TestHack>): TestHack {
    return this.create({
      is_liked: true,
      like_count: faker.number.int({ min: 5, max: 50 }),
      ...overrides
    })
  }

  static createWithPrerequisites(prerequisiteIds: string[], overrides?: Partial<TestHack>): TestHack & { prerequisites: string[] } {
    const hack = this.create(overrides)
    return {
      ...hack,
      prerequisites: prerequisiteIds
    }
  }
}