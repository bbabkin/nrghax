const { PrismaClient } = require('@prisma/client');

// Production seed data script
// Run this after migrations are applied to production

async function seedProduction() {
  // Use production DATABASE_URL from environment
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('Starting production seed...\n');

    // Check if we already have hacks with slugs
    const existingHacks = await prisma.hack.findMany({
      select: { id: true, name: true, slug: true }
    });

    if (existingHacks.length > 0 && existingHacks.some(h => h.slug)) {
      console.log('Database already has hacks with slugs. Skipping seed.');
      return;
    }

    // Sample production-ready hacks
    const hacks = [
      {
        name: 'Solar Panel Efficiency Optimization',
        slug: 'solar-panel-efficiency-' + generateId(),
        description: 'Learn techniques to maximize solar panel output through optimal positioning and maintenance',
        imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
        contentType: 'content',
        contentBody: `
          <h2>Maximizing Solar Panel Efficiency</h2>
          <p>Solar panels are a crucial component of renewable energy systems. This guide covers:</p>
          <ul>
            <li>Optimal panel positioning and tilt angles</li>
            <li>Regular maintenance schedules</li>
            <li>Performance monitoring techniques</li>
            <li>Common efficiency issues and solutions</li>
          </ul>
        `,
      },
      {
        name: 'Home Energy Audit DIY Guide',
        slug: 'home-energy-audit-diy-' + generateId(),
        description: 'Conduct your own energy audit to identify waste and save money',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        contentType: 'content',
        contentBody: `
          <h2>DIY Home Energy Audit</h2>
          <p>Discover where your home is losing energy and how to fix it:</p>
          <ul>
            <li>Checking insulation effectiveness</li>
            <li>Finding air leaks</li>
            <li>Evaluating heating and cooling systems</li>
            <li>Analyzing appliance efficiency</li>
          </ul>
        `,
      },
      {
        name: 'Smart Thermostat Programming',
        slug: 'smart-thermostat-programming-' + generateId(),
        description: 'Optimize your HVAC system with intelligent scheduling',
        imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
        contentType: 'content',
        contentBody: `
          <h2>Smart Thermostat Optimization</h2>
          <p>Save energy and money with proper thermostat programming:</p>
          <ul>
            <li>Setting optimal temperature schedules</li>
            <li>Using geofencing and occupancy sensors</li>
            <li>Integrating with weather forecasts</li>
            <li>Analyzing energy usage patterns</li>
          </ul>
        `,
      },
      {
        name: 'LED Lighting Conversion Calculator',
        slug: 'led-lighting-calculator-' + generateId(),
        description: 'Calculate your savings from switching to LED bulbs',
        imageUrl: 'https://images.unsplash.com/photo-1565636192335-e1ae00918fb6?w=800',
        contentType: 'link',
        externalLink: 'https://www.energy.gov/energysaver/lighting-choices-save-you-money',
      },
      {
        name: 'Battery Storage Systems Basics',
        slug: 'battery-storage-basics-' + generateId(),
        description: 'Understanding home battery storage for renewable energy',
        imageUrl: 'https://images.unsplash.com/photo-1620714223084-8e0d8c0c6b56?w=800',
        contentType: 'content',
        contentBody: `
          <h2>Home Battery Storage Systems</h2>
          <p>Learn about battery storage for your renewable energy system:</p>
          <ul>
            <li>Types of battery technologies</li>
            <li>Sizing your battery system</li>
            <li>Installation and safety considerations</li>
            <li>Maintenance and lifespan</li>
          </ul>
        `,
      },
      {
        name: 'Heat Pump Installation Guide',
        slug: 'heat-pump-installation-' + generateId(),
        description: 'Everything you need to know about heat pump systems',
        imageUrl: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800',
        contentType: 'content',
        contentBody: `
          <h2>Heat Pump Systems Guide</h2>
          <p>Comprehensive guide to heat pump technology:</p>
          <ul>
            <li>How heat pumps work</li>
            <li>Types of heat pump systems</li>
            <li>Installation requirements</li>
            <li>Efficiency ratings and savings</li>
          </ul>
        `,
      }
    ];

    console.log('Creating production hacks...\n');

    for (const hack of hacks) {
      const created = await prisma.hack.create({ data: hack });
      console.log(`✓ Created: ${created.name}`);
      console.log(`  URL: /hacks/${created.slug}`);
    }

    console.log('\n✅ Production seed completed successfully!');

  } catch (error) {
    console.error('Error seeding production:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Only run if called directly
if (require.main === module) {
  seedProduction();
}

module.exports = { seedProduction };