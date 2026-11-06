import 'dotenv/config'
import { Pool } from 'pg'

function getDatabaseUrl() {
  const url = process.env.PRODUCTION_DIRECT_URL || process.env.DIRECT_URL
  if (!url) {
    throw new Error('No se encontró PRODUCTION_DIRECT_URL ni DIRECT_URL.')
  }
  return url
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 5_000,
})

async function runSeed() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    console.info('========================================================')
    console.info('🚀 INICIANDO SEMILLA DE DEMOSTRACIÓN Y MEMBRESÍA ANUAL')
    console.info('========================================================')

    // 1. Obtener o verificar la organización principal Grupo Mecatronic
    const orgQuery = await client.query<{
      id: string
      code: string
      name: string
    }>(
      `SELECT id, code, name FROM organizations WHERE code = 'grupo-mecatronic' LIMIT 1`,
    )

    let organizationId: string

    if (orgQuery.rows.length === 0) {
      // Buscar primera organización o crearla
      const anyOrg = await client.query<{
        id: string
        code: string
        name: string
      }>(
        `SELECT id, code, name FROM organizations ORDER BY created_at ASC LIMIT 1`,
      )
      if (anyOrg.rows.length > 0) {
        organizationId = anyOrg.rows[0].id
        await client.query(
          `UPDATE organizations SET code = 'grupo-mecatronic', name = 'Grupo Mecatronic', active = true WHERE id = $1`,
          [organizationId],
        )
      } else {
        const newOrg = await client.query<{ id: string }>(
          `INSERT INTO organizations (code, name, active, created_at, updated_at)
           VALUES ('grupo-mecatronic', 'Grupo Mecatronic', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
        )
        organizationId = newOrg.rows[0].id
      }
    } else {
      organizationId = orgQuery.rows[0].id
    }

    console.info(
      `✅ Organización objetivo: Grupo Mecatronic (ID: ${organizationId})`,
    )

    // 2. Sembrar los Planes si no existen
    console.info('\n📋 Verificando planes comerciales...')
    const plansData = [
      {
        code: 'STARTER',
        name: 'Plan Inicial',
        description: 'Orientado a talleres pequeños o técnicos independientes.',
        monthly: 79.0,
        yearly: 790.0,
        maxMembers: 3,
        maxTechnicians: 5,
        maxProducts: 250,
      },
      {
        code: 'PRO',
        name: 'Plan Profesional',
        description:
          'Orientado a talleres medianos con recepción y equipo técnico.',
        monthly: 149.0,
        yearly: 1490.0,
        maxMembers: 10,
        maxTechnicians: 20,
        maxProducts: 2000,
      },
      {
        code: 'ENTERPRISE',
        name: 'Plan Corporativo',
        description:
          'Para talleres de gran volumen, cadenas automotrices y flotas.',
        monthly: 299.0,
        yearly: 2990.0,
        maxMembers: 50,
        maxTechnicians: 100,
        maxProducts: 20000,
      },
    ]

    for (const plan of plansData) {
      await client.query(
        `
        INSERT INTO plans (
          id, code, name, description, price_monthly, price_yearly, currency,
          max_members, max_technicians, max_products, active, is_public,
          created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PEN', $6, $7, $8, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price_monthly = EXCLUDED.price_monthly,
          price_yearly = EXCLUDED.price_yearly,
          max_members = EXCLUDED.max_members,
          max_technicians = EXCLUDED.max_technicians,
          max_products = EXCLUDED.max_products,
          active = true;
        `,
        [
          plan.code,
          plan.name,
          plan.description,
          plan.monthly,
          plan.yearly,
          plan.maxMembers,
          plan.maxTechnicians,
          plan.maxProducts,
        ],
      )
    }

    const enterprisePlanRes = await client.query<{ id: string }>(
      `SELECT id FROM plans WHERE code = 'ENTERPRISE' LIMIT 1`,
    )
    const enterprisePlanId = enterprisePlanRes.rows[0].id

    // 3. Asignar Suscripción Corporativa Anual a Grupo Mecatronic
    console.info('\n💎 Asignando membresía ANUAL CORPORATIVA (la más cara)...')
    await client.query(
      `
      INSERT INTO organization_subscriptions (
        id, organization_id, plan_id, status, billing_cycle,
        starts_at, renews_at, notes, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'ACTIVE', 'ANNUAL',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year',
        'Membresía anual Corporativa asignada para producción y demostración comercial.',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (organization_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = 'ACTIVE',
        billing_cycle = 'ANNUAL',
        renews_at = CURRENT_TIMESTAMP + INTERVAL '1 year',
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
      `,
      [organizationId, enterprisePlanId],
    )
    console.info(
      '✅ Membresía Plan Corporativo Anual asignada con éxito a Grupo Mecatronic.',
    )

    // 4. Sembrar 5 Clientes (3 Personas Naturales + 2 Empresas Jurídicas)
    console.info('\n👥 Sembrando 5 clientes de demostración...')
    const customersData = [
      {
        type: 'NATURAL',
        doc: '45892147',
        first: 'Juan Carlos',
        last: 'Pérez Morales',
        legal: null,
        phone: '987654321',
        email: 'juan.perez@gmail.com',
      },
      {
        type: 'NATURAL',
        doc: '71239845',
        first: 'María Elena',
        last: 'Quispe Huamán',
        legal: null,
        phone: '976543210',
        email: 'maria.quispe@hotmail.com',
      },
      {
        type: 'NATURAL',
        doc: '40128734',
        first: 'Carlos Alberto',
        last: 'Mendoza Ramos',
        legal: null,
        phone: '965432109',
        email: 'carlos.mendoza@outlook.com',
      },
      {
        type: 'LEGAL',
        doc: '20601234567',
        first: null,
        last: null,
        legal: 'Transportes y Servicios Rápidos S.A.C.',
        phone: '954321098',
        email: 'operaciones@transrapidos.pe',
      },
      {
        type: 'LEGAL',
        doc: '20509876543',
        first: null,
        last: null,
        legal: 'Logística Integral del Sur S.R.L.',
        phone: '943210987',
        email: 'flota@loginterperu.com',
      },
    ]

    const customerIds: string[] = []

    for (const c of customersData) {
      const res = await client.query<{ id: string }>(
        `
        INSERT INTO customers (
          id, organization_id, type, document_number, first_name, last_name,
          legal_name, phone, email, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, document_number) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          legal_name = EXCLUDED.legal_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email
        RETURNING id;
        `,
        [
          organizationId,
          c.type,
          c.doc,
          c.first,
          c.last,
          c.legal,
          c.phone,
          c.email,
        ],
      )
      customerIds.push(res.rows[0].id)
    }
    console.info(`✅ 5 Clientes sembrados / actualizados con éxito.`)

    // 5. Sembrar 5 Vehículos asociados a los clientes
    console.info('\n🚗 Sembrando 5 vehículos de demostración...')
    const vehiclesData = [
      {
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Corolla 1.8 CVT',
        year: 2021,
        mileage: 45200,
        customerId: customerIds[0],
      },
      {
        plate: 'BVF-456',
        brand: 'Hyundai',
        model: 'Tucson 2.0 4x2',
        year: 2022,
        mileage: 32800,
        customerId: customerIds[1],
      },
      {
        plate: 'XTC-789',
        brand: 'Nissan',
        model: 'Frontier 2.5 TDI 4x4',
        year: 2020,
        mileage: 68400,
        customerId: customerIds[2],
      },
      {
        plate: 'F4T-890',
        brand: 'Isuzu',
        model: 'D-Max 3.0 Cabina Doble',
        year: 2023,
        mileage: 24100,
        customerId: customerIds[3],
      },
      {
        plate: 'V9K-321',
        brand: 'Kia',
        model: 'Sportage 2.0 EX',
        year: 2022,
        mileage: 38700,
        customerId: customerIds[4],
      },
    ]

    for (const v of vehiclesData) {
      await client.query(
        `
        INSERT INTO vehicles (
          id, organization_id, plate, brand, model, year, mileage,
          customer_id, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, plate) DO UPDATE SET
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          year = EXCLUDED.year,
          mileage = EXCLUDED.mileage,
          customer_id = EXCLUDED.customer_id;
        `,
        [
          organizationId,
          v.plate,
          v.brand,
          v.model,
          v.year,
          v.mileage,
          v.customerId,
        ],
      )
    }
    console.info(`✅ 5 Vehículos sembrados / actualizados con éxito.`)

    // 6. Sembrar 5 Técnicos Especializados
    console.info('\n🔧 Sembrando 5 técnicos de taller...')
    const techniciansData = [
      {
        code: 'TEC-001',
        fullName: 'Roberto Valdivia Campos',
        document: '43219876',
        phone: '981112233',
        email: 'rvaldivia@torcly.com',
        specialties: 'Frenos, Suspensión y Dirección',
      },
      {
        code: 'TEC-002',
        fullName: 'Miguel Ángel Castro Soto',
        document: '44321098',
        phone: '982223344',
        email: 'mcastro@torcly.com',
        specialties: 'Diagnóstico Computarizado y Sensores OBD-II',
      },
      {
        code: 'TEC-003',
        fullName: 'Jorge Luis Navarro Ruiz',
        document: '45678912',
        phone: '983334455',
        email: 'jnavarro@torcly.com',
        specialties: 'Motor, Culatas y Transmisión Automática',
      },
      {
        code: 'TEC-004',
        fullName: 'David Alejandro Morales Peña',
        document: '46789023',
        phone: '984445566',
        email: 'dmorales@torcly.com',
        specialties: 'Mantenimiento Preventivo y Lubricación General',
      },
      {
        code: 'TEC-005',
        fullName: 'Walter Sánchez Guzmán',
        document: '47890134',
        phone: '985556677',
        email: 'wsanchez@torcly.com',
        specialties: 'Sistemas Eléctricos, Baterías y Aire Acondicionado',
      },
    ]

    for (const t of techniciansData) {
      await client.query(
        `
        INSERT INTO technicians (
          id, organization_id, code, full_name, document, phone, email,
          specialties, active, created_by, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, code) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          document = EXCLUDED.document,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          specialties = EXCLUDED.specialties,
          active = true;
        `,
        [
          organizationId,
          t.code,
          t.fullName,
          t.document,
          t.phone,
          t.email,
          t.specialties,
        ],
      )
    }
    console.info(`✅ 5 Técnicos de taller sembrados / actualizados con éxito.`)

    // 7. Categorías y Unidades de Producto
    console.info('\n📦 Verificando categorías y unidades...')
    const categoriesData = [
      'Lubricantes y Fluidos',
      'Sistema de Frenos',
      'Filtros y Afinamiento',
    ]
    const categoryIds: Record<string, string> = {}

    for (const cat of categoriesData) {
      const res = await client.query<{ id: string }>(
        `
        INSERT INTO product_categories (id, organization_id, name, active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, name) DO UPDATE SET active = true
        RETURNING id;
        `,
        [organizationId, cat],
      )
      categoryIds[cat] = res.rows[0].id
    }

    const unitsData = [
      { name: 'Unidad', symbol: 'und' },
      { name: 'Galón', symbol: 'gal' },
      { name: 'Juego', symbol: 'jgo' },
    ]
    const unitIds: Record<string, string> = {}

    for (const u of unitsData) {
      const res = await client.query<{ id: string }>(
        `
        INSERT INTO product_units (id, organization_id, name, symbol, active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, symbol) DO UPDATE SET active = true
        RETURNING id;
        `,
        [organizationId, u.name, u.symbol],
      )
      unitIds[u.symbol] = res.rows[0].id
    }

    // 8. Sembrar 5 Productos con Stock Inicial
    console.info('\n🏷️ Sembrando 5 productos de catálogo...')
    const productsData = [
      {
        code: 'ACE-5W30-SINT',
        name: 'Aceite Sintético 5W-30 Full Synthetic (Galón)',
        description:
          'Lubricante sintético API SP / ILSAC GF-6 para motores modernos.',
        price: 155.0,
        minStock: 5,
        stock: 24,
        categoryId: categoryIds['Lubricantes y Fluidos'],
        unitId: unitIds['gal'],
      },
      {
        code: 'PAS-FR-COROLLA',
        name: 'Pastillas de Freno Delanteras Cerámicas',
        description: 'Juego de pastillas de alto agarre térmico sin ruido.',
        price: 120.0,
        minStock: 3,
        stock: 15,
        categoryId: categoryIds['Sistema de Frenos'],
        unitId: unitIds['jgo'],
      },
      {
        code: 'FLT-AC-TY01',
        name: 'Filtro de Aceite Blindado Alto Rendimiento',
        description:
          'Válvula anti-retorno y papel filtrante de microfibra sintética.',
        price: 38.0,
        minStock: 8,
        stock: 35,
        categoryId: categoryIds['Filtros y Afinamiento'],
        unitId: unitIds['und'],
      },
      {
        code: 'FLT-AR-UNIV',
        name: 'Filtro de Aire de Motor de Alto Flujo',
        description:
          'Protege la admisión de polvo garantizando flujo de aire óptimo.',
        price: 55.0,
        minStock: 4,
        stock: 20,
        categoryId: categoryIds['Filtros y Afinamiento'],
        unitId: unitIds['und'],
      },
      {
        code: 'LIQ-DOT4-500',
        name: 'Líquido de Frenos DOT 4 500ml',
        description: 'Punto de ebullición húmedo superior a 165°C.',
        price: 45.0,
        minStock: 5,
        stock: 30,
        categoryId: categoryIds['Sistema de Frenos'],
        unitId: unitIds['und'],
      },
    ]

    for (const p of productsData) {
      const prodRes = await client.query<{ id: string }>(
        `
        INSERT INTO products (
          id, organization_id, code, name, description, sale_price,
          minimum_stock, active, category_id, unit_id, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          sale_price = EXCLUDED.sale_price,
          minimum_stock = EXCLUDED.minimum_stock,
          active = true,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id;
        `,
        [
          organizationId,
          p.code,
          p.name,
          p.description,
          p.price,
          p.minStock,
          p.categoryId,
          p.unitId,
        ],
      )

      let prodId: string
      if (prodRes.rows.length === 0) {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM products WHERE organization_id = $1 AND code = $2`,
          [organizationId, p.code],
        )
        if (existing.rows.length > 0) {
          prodId = existing.rows[0].id
        } else {
          continue
        }
      } else {
        prodId = prodRes.rows[0].id
      }

      // Crear movimiento de stock inicial si no tiene movimientos
      const movCount = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM inventory_movements WHERE product_id = $1`,
        [prodId],
      )
      if (parseInt(movCount.rows[0].count, 10) === 0) {
        await client.query(
          `
          INSERT INTO inventory_movements (
            id, organization_id, product_id, type, status, quantity,
            notes, performed_by, occurred_at, created_at
          )
          VALUES (
            gen_random_uuid(), $1, $2, 'INITIAL', 'CONFIRMED', $3,
            'Stock inicial cargado por semilla de demostración.', 'system',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          `,
          [organizationId, prodId, p.stock],
        )
      }
    }
    console.info(`✅ 5 Productos de catálogo con stock sembrados con éxito.`)

    // 9. Sembrar 5 Proveedores Automotrices
    console.info('\n🏭 Sembrando 5 proveedores automotrices...')
    const suppliersData = [
      {
        legalName: 'Distribuidora Bosch Automotriz del Perú S.A.',
        documentNumber: '20100128456',
        contactName: 'Fernando Ramos',
        phone: '01-4458900',
        email: 'ventas@boschperu.pe',
      },
      {
        legalName: 'Repuestos y Filtros Mann S.A.C.',
        documentNumber: '20543219870',
        contactName: 'Claudia Alva',
        phone: '01-5128760',
        email: 'pedidos@mannfilter.pe',
      },
      {
        legalName: 'Lubricantes y Grasas Mobil Perú S.A.C.',
        documentNumber: '20489012345',
        contactName: 'Ricardo Chávez',
        phone: '01-6194300',
        email: 'atencion@mobilperu.com',
      },
      {
        legalName: 'Frenos y Embragues Brembo Perú E.I.R.L.',
        documentNumber: '20603456789',
        contactName: 'Patricia Salazar',
        phone: '01-7189020',
        email: 'ventas@bremboperu.pe',
      },
      {
        legalName: 'Autopartes y Suspensiones Kyb S.A.C.',
        documentNumber: '20512890341',
        contactName: 'Gabriel Torres',
        phone: '01-3829100',
        email: 'contacto@kybautopartes.pe',
      },
    ]

    for (const s of suppliersData) {
      await client.query(
        `
        INSERT INTO suppliers (
          id, organization_id, legal_name, document_number, contact_name,
          phone, email, active, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, document_number) DO UPDATE SET
          legal_name = EXCLUDED.legal_name,
          contact_name = EXCLUDED.contact_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          active = true;
        `,
        [
          organizationId,
          s.legalName,
          s.documentNumber,
          s.contactName,
          s.phone,
          s.email,
        ],
      )
    }
    console.info(`✅ 5 Proveedores automotrices sembrados con éxito.`)

    // 10. Sembrar 5 Servicios de Taller
    console.info('\n🛠️ Sembrando 5 servicios de mano de obra...')
    const servicesData = [
      {
        code: 'SRV-CAMBIO-ACEITE',
        name: 'Cambio de Aceite y Filtro de Motor con Inspección',
        description:
          'Mano de obra para drenado, reemplazo de filtro y revisión de 15 puntos.',
        price: 45.0,
      },
      {
        code: 'SRV-ALIN-BAL-3D',
        name: 'Alineación 3D y Balanceo Computarizado por Eje',
        description:
          'Calibración con sensores de alta precisión para convergencia y caída.',
        price: 80.0,
      },
      {
        code: 'SRV-MANT-FRENOS',
        name: 'Mantenimiento Integral de Frenos (4 ruedas)',
        description:
          'Limpieza, rectificación de discos/tambores y purga de líquido de frenos.',
        price: 120.0,
      },
      {
        code: 'SRV-AFIN-ELEC',
        name: 'Afinamiento Electrónico y Limpieza de Inyectores',
        description:
          'Limpieza ultrasónica de inyectores, bujías y cuerpo de aceleración.',
        price: 180.0,
      },
      {
        code: 'SRV-DIAG-COMP',
        name: 'Diagnóstico Computarizado de Motor con Escáner OBD-II',
        description:
          'Lectura de códigos de falla DTC, sensores en vivo y borrado de Check Engine.',
        price: 60.0,
      },
    ]

    for (const s of servicesData) {
      await client.query(
        `
        INSERT INTO services (
          id, organization_id, code, name, description, price, active,
          created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          active = true;
        `,
        [organizationId, s.code, s.name, s.description, s.price],
      )
    }
    console.info(`✅ 5 Servicios de taller sembrados con éxito.`)

    await client.query('COMMIT')
    console.info('\n========================================================')
    console.info('🎉 SEMILLA DE DEMOSTRACIÓN COMPLETADA EXITOSAMENTE')
    console.info('========================================================')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error durante la semilla de producción:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

void runSeed()
