import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional, comment out if you want to preserve data)
  console.log('Clearing existing data...');
  await prisma.userHack.deleteMany();
  await prisma.userTag.deleteMany();
  await prisma.hackTag.deleteMany();
  await prisma.hackPrerequisite.deleteMany();
  await prisma.hack.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create test users with passwords
  console.log('Creating test users...');

  // Hash passwords for test users
  const testPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const testUser = await prisma.user.create({
    data: {
      email: 'test@test.com',
      name: 'Test User',
      hashedPassword: testPassword,
      emailVerified: new Date(),
      isAdmin: false,
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin User',
      hashedPassword: adminPassword,
      emailVerified: new Date(),
      isAdmin: true,
    }
  });

  console.log('Created test users:');
  console.log('  - test@test.com (password: password123)');
  console.log('  - admin@test.com (password: admin123)');

  // Create tags
  console.log('Creating tags...');
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'JavaScript', slug: 'javascript', tagType: 'hack', category: 'language', color: '#f7df1e' }
    }),
    prisma.tag.create({
      data: { name: 'TypeScript', slug: 'typescript', tagType: 'hack', category: 'language', color: '#3178c6' }
    }),
    prisma.tag.create({
      data: { name: 'React', slug: 'react', tagType: 'hack', category: 'framework', color: '#61dafb' }
    }),
    prisma.tag.create({
      data: { name: 'Node.js', slug: 'nodejs', tagType: 'hack', category: 'runtime', color: '#339933' }
    }),
    prisma.tag.create({
      data: { name: 'Beginner', slug: 'beginner', tagType: 'user_experience', category: 'level', color: '#4caf50' }
    }),
    prisma.tag.create({
      data: { name: 'Intermediate', slug: 'intermediate', tagType: 'user_experience', category: 'level', color: '#ff9800' }
    }),
    prisma.tag.create({
      data: { name: 'Advanced', slug: 'advanced', tagType: 'user_experience', category: 'level', color: '#f44336' }
    }),
    prisma.tag.create({
      data: { name: 'Web Security', slug: 'web-security', tagType: 'user_interest', category: 'topic', color: '#ff5722' }
    }),
  ]);

  // Create hacks
  console.log('Creating hacks...');

  const hacks = await Promise.all([
    prisma.hack.create({
      data: {
        name: 'Learn JavaScript Basics',
        slug: 'learn-javascript-basics',
        description: 'Master the fundamentals of JavaScript programming',
        imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a',
        contentType: 'content',
        contentBody: `<h1>JavaScript Basics</h1>
<h2>Variables</h2>
<p>Learn about let, const, and var</p>
<h2>Functions</h2>
<p>Understanding function declarations and expressions</p>
<h2>Arrays and Objects</h2>
<p>Working with data structures</p>`,
        difficulty: 'Beginner',
        timeMinutes: 30,
        createdBy: adminUser.id
      }
    }),
    prisma.hack.create({
      data: {
        name: 'Build Your First React App',
        slug: 'build-your-first-react-app',
        description: 'Create a todo application with React and hooks',
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
        contentType: 'content',
        contentBody: `<h1>React Todo App</h1>
<h2>Setup</h2>
<ol>
<li>Create React App</li>
<li>Install dependencies</li>
</ol>
<h2>Components</h2>
<ul>
<li>TodoList</li>
<li>TodoItem</li>
<li>AddTodo</li>
</ul>
<h2>State Management</h2>
<p>Using useState and useEffect hooks</p>`,
        difficulty: 'Intermediate',
        timeMinutes: 45,
        createdBy: adminUser.id
      }
    }),
    prisma.hack.create({
      data: {
        name: 'TypeScript Deep Dive',
        slug: 'typescript-deep-dive',
        description: 'Advanced TypeScript patterns and best practices',
        imageUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
        contentType: 'link',
        externalLink: 'https://basarat.gitbook.io/typescript/',
        difficulty: 'Advanced',
        timeMinutes: 60,
        createdBy: adminUser.id
      }
    }),
    prisma.hack.create({
      data: {
        name: 'Node.js REST API',
        slug: 'nodejs-rest-api',
        description: 'Build a RESTful API with Express and PostgreSQL',
        imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
        contentType: 'content',
        contentBody: `<h1>Building a REST API</h1>
<h2>Setup Express</h2>
<pre><code>const express = require('express')
const app = express()</code></pre>
<h2>Routes</h2>
<ul>
<li>GET /users</li>
<li>POST /users</li>
<li>PUT /users/:id</li>
<li>DELETE /users/:id</li>
</ul>
<h2>Database Integration</h2>
<p>Using Prisma ORM for PostgreSQL</p>`,
        difficulty: 'Intermediate',
        timeMinutes: 50,
        createdBy: adminUser.id
      }
    }),
    prisma.hack.create({
      data: {
        name: 'CSS Grid Layout',
        slug: 'css-grid-layout',
        description: 'Master modern CSS Grid techniques',
        imageUrl: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19',
        contentType: 'content',
        contentBody: `<h1>CSS Grid Layout</h1>
<h2>Grid Container</h2>
<pre><code>.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
}</code></pre>
<h2>Grid Items</h2>
<p>Positioning and spanning cells</p>`,
        difficulty: 'Beginner',
        timeMinutes: 25,
        createdBy: adminUser.id
      }
    })
  ]);

  // Add hack tags
  console.log('Adding hack tags...');
  await Promise.all([
    // JavaScript basics - JavaScript, Beginner
    prisma.hackTag.create({
      data: { hackId: hacks[0].id, tagId: tags[0].id }
    }),
    prisma.hackTag.create({
      data: { hackId: hacks[0].id, tagId: tags[4].id }
    }),
    // React app - React, Intermediate
    prisma.hackTag.create({
      data: { hackId: hacks[1].id, tagId: tags[2].id }
    }),
    prisma.hackTag.create({
      data: { hackId: hacks[1].id, tagId: tags[5].id }
    }),
    // TypeScript - TypeScript, Advanced
    prisma.hackTag.create({
      data: { hackId: hacks[2].id, tagId: tags[1].id }
    }),
    prisma.hackTag.create({
      data: { hackId: hacks[2].id, tagId: tags[6].id }
    }),
    // Node.js API - Node.js, Intermediate
    prisma.hackTag.create({
      data: { hackId: hacks[3].id, tagId: tags[3].id }
    }),
    prisma.hackTag.create({
      data: { hackId: hacks[3].id, tagId: tags[5].id }
    }),
    // CSS Grid - Beginner
    prisma.hackTag.create({
      data: { hackId: hacks[4].id, tagId: tags[4].id }
    })
  ]);

  // Create hack prerequisites (React requires JavaScript)
  console.log('Creating hack prerequisites...');
  await prisma.hackPrerequisite.create({
    data: {
      hackId: hacks[1].id, // React app
      prerequisiteHackId: hacks[0].id // JavaScript basics
    }
  });

  // Add user interactions
  console.log('Adding user interactions...');

  // Test user interactions
  await prisma.userHack.create({
    data: {
      userId: testUser.id,
      hackId: hacks[0].id,
      liked: true,
      viewed: true,
      viewedAt: new Date()
    }
  });

  await prisma.userHack.create({
    data: {
      userId: testUser.id,
      hackId: hacks[1].id,
      viewed: true,
      viewedAt: new Date()
    }
  });

  // Admin user interactions
  await prisma.userHack.create({
    data: {
      userId: adminUser.id,
      hackId: hacks[0].id,
      viewed: true,
      viewedAt: new Date()
    }
  });

  await prisma.userHack.create({
    data: {
      userId: adminUser.id,
      hackId: hacks[2].id,
      liked: true,
      viewed: true,
      viewedAt: new Date()
    }
  });

  // User tags
  console.log('Adding user tags...');
  await prisma.userTag.create({
    data: {
      userId: testUser.id,
      tagId: tags[4].id, // Beginner
      source: 'onboarding'
    }
  });

  await prisma.userTag.create({
    data: {
      userId: testUser.id,
      tagId: tags[7].id, // Web Security
      source: 'onboarding'
    }
  });

  await prisma.userTag.create({
    data: {
      userId: adminUser.id,
      tagId: tags[6].id, // Advanced
      source: 'onboarding'
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log('\nTest accounts created (for Auth.js):');
  console.log('  User: test@test.com');
  console.log('  Admin: admin@test.com');
  console.log('\nNote: Use OAuth or magic links to sign in');
  console.log(`  - Created ${await prisma.user.count()} users`);
  console.log(`  - Created ${await prisma.tag.count()} tags`);
  console.log(`  - Created ${await prisma.hack.count()} hacks`);
  console.log(`  - Created ${await prisma.userHack.count()} user interactions`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });