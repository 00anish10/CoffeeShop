import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@brew.com',
        passwordHash: await bcrypt.hash('AdminPass123!', 12),
        name: 'Admin Barista',
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'barista@brew.com',
        passwordHash: await bcrypt.hash('BaristaPass1!', 12),
        name: 'Jane Barista',
        role: Role.BARISTA,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer1@brew.com',
        passwordHash: await bcrypt.hash('CustomerPass1!', 12),
        name: 'Alice Customer',
        role: Role.CUSTOMER,
        loyaltyPoints: 250,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer2@brew.com',
        passwordHash: await bcrypt.hash('CustomerPass1!', 12),
        name: 'Bob Customer',
        role: Role.CUSTOMER,
        loyaltyPoints: 520,
      },
    }),
  ])

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Espresso Drinks', slug: 'espresso-drinks', sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Pour Over', slug: 'pour-over', sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Cold Brew', slug: 'cold-brew', sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Pastries', slug: 'pastries', sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Merchandise', slug: 'merchandise', sortOrder: 5 } }),
    prisma.category.create({ data: { name: 'Seasonal', slug: 'seasonal', sortOrder: 6 } }),
  ])

  const [
    espresso,
    pourOver,
    coldBrew,
    pastries,
    _merchandise,
    seasonal,
  ] = categories

  const products = await Promise.all([
    // Espresso Drinks
    prisma.product.create({
      data: {
        name: 'Espresso Shot',
        slug: 'espresso-shot',
        description: 'A single shot of our signature espresso blend, rich and full-bodied.',
        price: 3.50,
        preparationMinutes: 2,
        categoryId: espresso.id,
        variants: {
          create: [
            { name: 'Single', priceModifier: 0 },
            { name: 'Double', priceModifier: 1 },
            { name: 'Triple', priceModifier: 2 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cappuccino',
        slug: 'cappuccino',
        description: 'Espresso topped with velvety steamed milk and a thick layer of foam.',
        price: 5.00,
        preparationMinutes: 4,
        categoryId: espresso.id,
        variants: {
          create: [
            { name: 'Small', priceModifier: 0 },
            { name: 'Medium', priceModifier: 1 },
            { name: 'Large', priceModifier: 2 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Flat White',
        slug: 'flat-white',
        description: 'Double espresso with micro-foamed milk for a smooth, velvety texture.',
        price: 5.50,
        preparationMinutes: 4,
        categoryId: espresso.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Oat Milk Latte',
        slug: 'oat-milk-latte',
        description: 'Our signature latte made with creamy oat milk.',
        price: 6.00,
        preparationMinutes: 5,
        categoryId: espresso.id,
        variants: {
          create: [
            { name: 'Medium', priceModifier: 0 },
            { name: 'Large', priceModifier: 1.50 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caramel Macchiato',
        slug: 'caramel-macchiato',
        description: 'Vanilla-flavored latte marked with espresso and finished with caramel drizzle.',
        price: 6.50,
        preparationMinutes: 5,
        categoryId: espresso.id,
        variants: {
          create: [
            { name: 'Medium', priceModifier: 0 },
            { name: 'Large', priceModifier: 1.50 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cortado',
        slug: 'cortado',
        description: 'Equal parts espresso and steamed milk for a balanced, bold flavor.',
        price: 4.50,
        preparationMinutes: 3,
        categoryId: espresso.id,
      },
    }),
    // Pour Over
    prisma.product.create({
      data: {
        name: 'Ethiopian Yirgacheffe',
        slug: 'ethiopian-yirgacheffe',
        description: 'Bright and floral with notes of blueberry and jasmine. Single-origin pour over.',
        price: 7.00,
        preparationMinutes: 8,
        categoryId: pourOver.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Colombian Single Origin',
        slug: 'colombian-single-origin',
        description: 'Well-balanced with caramel sweetness and a silky smooth finish.',
        price: 6.50,
        preparationMinutes: 8,
        categoryId: pourOver.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'House Blend Pour Over',
        slug: 'house-blend-pour-over',
        description: 'Our signature house blend, carefully crafted for the perfect pour over experience.',
        price: 5.50,
        preparationMinutes: 7,
        categoryId: pourOver.id,
      },
    }),
    // Cold Brew
    prisma.product.create({
      data: {
        name: 'Classic Cold Brew',
        slug: 'classic-cold-brew',
        description: 'Slow-steeped for 20 hours for a smooth, naturally sweet cold brew.',
        price: 5.50,
        preparationMinutes: 1,
        categoryId: coldBrew.id,
        variants: {
          create: [
            { name: '12oz', priceModifier: 0 },
            { name: '16oz', priceModifier: 1.50 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Nitro Cold Brew',
        slug: 'nitro-cold-brew',
        description: 'Our cold brew infused with nitrogen for a creamy, velvety texture.',
        price: 6.50,
        preparationMinutes: 1,
        categoryId: coldBrew.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cold Brew Tonic',
        slug: 'cold-brew-tonic',
        description: 'Cold brew meets tonic water with a twist of citrus for a refreshing sparkler.',
        price: 7.00,
        preparationMinutes: 2,
        categoryId: coldBrew.id,
      },
    }),
    // Pastries
    prisma.product.create({
      data: {
        name: 'Almond Croissant',
        slug: 'almond-croissant',
        description: 'Flaky, buttery croissant filled with almond cream and topped with sliced almonds.',
        price: 4.50,
        preparationMinutes: 0,
        categoryId: pastries.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Banana Bread',
        slug: 'banana-bread',
        description: 'Moist, house-made banana bread with walnuts and a honey glaze.',
        price: 4.00,
        preparationMinutes: 0,
        categoryId: pastries.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cardamom Knot',
        slug: 'cardamom-knot',
        description: 'Scandinavian-inspired cardamom-spiced pastry with pearl sugar topping.',
        price: 3.50,
        preparationMinutes: 0,
        categoryId: pastries.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Avocado Toast',
        slug: 'avocado-toast',
        description: 'Smashed avocado on sourdough with chili flakes, lime, and sea salt.',
        price: 8.00,
        preparationMinutes: 5,
        categoryId: pastries.id,
      },
    }),
    // Seasonal
    prisma.product.create({
      data: {
        name: 'Pumpkin Spice Latte',
        slug: 'pumpkin-spice-latte',
        description: 'Espresso with pumpkin-spiced milk and whipped cream.',
        price: 7.00,
        preparationMinutes: 5,
        isAvailable: false,
        categoryId: seasonal.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lavender Honey Latte',
        slug: 'lavender-honey-latte',
        description: 'Espresso with steamed milk, lavender syrup, and local honey.',
        price: 7.50,
        preparationMinutes: 5,
        categoryId: seasonal.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Peppermint Mocha',
        slug: 'peppermint-mocha',
        description: 'Rich chocolate espresso with peppermint and whipped cream.',
        price: 6.50,
        preparationMinutes: 5,
        isAvailable: false,
        categoryId: seasonal.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Yuzu Fizz Cold Brew',
        slug: 'yuzu-fizz-cold-brew',
        description: 'Cold brew with yuzu citrus and sparkling water for a bright, effervescent drink.',
        price: 8.00,
        preparationMinutes: 2,
        categoryId: seasonal.id,
      },
    }),
  ])

  const tables = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.table.create({
        data: {
          number: i + 1,
          qrCode: `TABLE-${i + 1}-${randomUUID()}`,
        },
      })
    )
  )

  const inventoryData = [
    { slug: 'espresso-shot', stockLevel: 85 },
    { slug: 'cappuccino', stockLevel: 70 },
    { slug: 'flat-white', stockLevel: 60 },
    { slug: 'oat-milk-latte', stockLevel: 45 },
    { slug: 'caramel-macchiato', stockLevel: 50 },
    { slug: 'cortado', stockLevel: 40 },
    { slug: 'ethiopian-yirgacheffe', stockLevel: 25 },
    { slug: 'colombian-single-origin', stockLevel: 30 },
    { slug: 'house-blend-pour-over', stockLevel: 35 },
    { slug: 'classic-cold-brew', stockLevel: 5 },
    { slug: 'nitro-cold-brew', stockLevel: 5 },
    { slug: 'cold-brew-tonic', stockLevel: 20 },
    { slug: 'almond-croissant', stockLevel: 30 },
    { slug: 'banana-bread', stockLevel: 20 },
    { slug: 'cardamom-knot', stockLevel: 25 },
    { slug: 'avocado-toast', stockLevel: 15 },
    { slug: 'pumpkin-spice-latte', stockLevel: 100 },
    { slug: 'lavender-honey-latte', stockLevel: 40 },
    { slug: 'peppermint-mocha', stockLevel: 100 },
    { slug: 'yuzu-fizz-cold-brew', stockLevel: 30 },
  ]

  for (const item of inventoryData) {
    const product = products.find(p => p.slug === item.slug)
    if (product) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          stockLevel: item.stockLevel,
          lowStockThreshold: 10,
        },
      })
    }
  }

  console.log('Seed completed successfully!')
  console.log(`  Users: ${users.length}`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Products: ${products.length}`)
  console.log(`  Tables: ${tables.length}`)
  console.log(`  Inventory: ${inventoryData.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
