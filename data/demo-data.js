/* =========================================================
   OR SHOPEE MANAGER — Dados de Demonstração
   ⚠ ATENÇÃO: Todos os dados abaixo são FICTÍCIOS e servem
   apenas para demonstração/portfólio do sistema.
   Nada aqui representa dados reais.
   ========================================================= */

const DemoData = (() => {

    // =========================================================
    // MARCADOR DE DEMONSTRAÇÃO
    // =========================================================
    // Todos os registros criados por este módulo recebem
    // a flag `isDemo: true` para permitir remoção seletiva.
    const DEMO_FLAG = 'isDemo';

    // =========================================================
    // GERAÇÃO DE IDs
    // =========================================================
    function demoId(prefix, n) {
        return `demo_${prefix}_${String(n).padStart(3, '0')}`;
    }

    // =========================================================
    // DATAS RELATIVAS (para o gráfico ficar bonito)
    // =========================================================
    function daysAgo(days, hours = 12, minutes = 0) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
    }

    function daysFromNow(days, hours = 14, minutes = 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
    }

    // =========================================================
    // PRODUTOS DE DEMONSTRAÇÃO
    // =========================================================
    const products = [
        {
            id: demoId('prod', 1),
            name: '[DEMO] Fone Bluetooth TWS Pro',
            category: 'Eletrônicos',
            store: 'TechStore BR',
            price: 89.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-1',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-1',
            commissionPercent: 8,
            estimatedCommission: 7.19,
            status: 'ativo',
            notes: 'Produto campeão de vendas. Investir em mais conteúdos.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(45),
            updatedAt: daysAgo(2)
        },
        {
            id: demoId('prod', 2),
            name: '[DEMO] Kit Organizador de Cozinha',
            category: 'Casa',
            store: 'Casa & Co',
            price: 45.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-2',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-2',
            commissionPercent: 12,
            estimatedCommission: 5.51,
            status: 'ativo',
            notes: 'Bom desempenho no Instagram.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(40),
            updatedAt: daysAgo(5)
        },
        {
            id: demoId('prod', 3),
            name: '[DEMO] Sérum Facial Vitamina C',
            category: 'Beleza',
            store: 'Beauty Shop',
            price: 39.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-3',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-3',
            commissionPercent: 15,
            estimatedCommission: 5.99,
            status: 'ativo',
            notes: 'Alta conversão no TikTok. Repostar conteúdo.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(35),
            updatedAt: daysAgo(1)
        },
        {
            id: demoId('prod', 4),
            name: '[DEMO] Camiseta Oversized Premium',
            category: 'Moda',
            store: 'Urban Wear',
            price: 59.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-4',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-4',
            commissionPercent: 10,
            estimatedCommission: 5.99,
            status: 'ativo',
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(30),
            updatedAt: daysAgo(10)
        },
        {
            id: demoId('prod', 5),
            name: '[DEMO] Mouse Gamer RGB 7200DPI',
            category: 'Informática',
            store: 'Gamer Zone',
            price: 79.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-5',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-5',
            commissionPercent: 6,
            estimatedCommission: 4.79,
            status: 'ativo',
            notes: 'Produto com muitas visualizações, poucas vendas. Revisar copy.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(28),
            updatedAt: daysAgo(3)
        },
        {
            id: demoId('prod', 6),
            name: '[DEMO] Brinquedo Educativo Montessori',
            category: 'Infantil',
            store: 'Kids Fun',
            price: 69.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-6',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-6',
            commissionPercent: 14,
            estimatedCommission: 9.79,
            status: 'ativo',
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(22),
            updatedAt: daysAgo(8)
        },
        {
            id: demoId('prod', 7),
            name: '[DEMO] Kit Ferramentas 129 Peças',
            category: 'Ferramentas',
            store: 'Tool Master',
            price: 129.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-7',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-7',
            commissionPercent: 5,
            estimatedCommission: 6.50,
            status: 'pausado',
            notes: 'Estoque baixo na loja. Aguardando reposição.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(20),
            updatedAt: daysAgo(6)
        },
        {
            id: demoId('prod', 8),
            name: '[DEMO] Luminária LED de Mesa',
            category: 'Casa',
            store: 'Casa & Co',
            price: 34.90,
            shopeeUrl: 'https://shopee.com.br/product/demo-8',
            affiliateUrl: 'https://s.shopee.com.br/demo-aff-8',
            commissionPercent: 11,
            estimatedCommission: 3.84,
            status: 'ativo',
            notes: 'Produto em teste.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(15),
            updatedAt: daysAgo(4)
        }
    ];

    // =========================================================
    // LINKS DE DEMONSTRAÇÃO
    // =========================================================
    const links = [
        {
            id: demoId('link', 1),
            productId: demoId('prod', 1),
            productName: '[DEMO] Fone Bluetooth TWS Pro',
            url: 'https://s.shopee.com.br/demo-aff-1',
            platform: 'instagram',
            clicks: 342,
            sales: 18,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(40),
            updatedAt: daysAgo(2)
        },
        {
            id: demoId('link', 2),
            productId: demoId('prod', 1),
            productName: '[DEMO] Fone Bluetooth TWS Pro',
            url: 'https://s.shopee.com.br/demo-aff-1-tk',
            platform: 'tiktok',
            clicks: 512,
            sales: 27,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(38),
            updatedAt: daysAgo(1)
        },
        {
            id: demoId('link', 3),
            productId: demoId('prod', 3),
            productName: '[DEMO] Sérum Facial Vitamina C',
            url: 'https://s.shopee.com.br/demo-aff-3',
            platform: 'instagram',
            clicks: 289,
            sales: 22,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(35),
            updatedAt: daysAgo(1)
        },
        {
            id: demoId('link', 4),
            productId: demoId('prod', 2),
            productName: '[DEMO] Kit Organizador de Cozinha',
            url: 'https://s.shopee.com.br/demo-aff-2',
            platform: 'whatsapp',
            clicks: 156,
            sales: 14,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(30),
            updatedAt: daysAgo(3)
        },
        {
            id: demoId('link', 5),
            productId: demoId('prod', 4),
            productName: '[DEMO] Camiseta Oversized Premium',
            url: 'https://s.shopee.com.br/demo-aff-4',
            platform: 'instagram',
            clicks: 421,
            sales: 11,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(28),
            updatedAt: daysAgo(5)
        },
        {
            id: demoId('link', 6),
            productId: demoId('prod', 5),
            productName: '[DEMO] Mouse Gamer RGB 7200DPI',
            url: 'https://s.shopee.com.br/demo-aff-5',
            platform: 'youtube',
            clicks: 687,
            sales: 4,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(25),
            updatedAt: daysAgo(7)
        },
        {
            id: demoId('link', 7),
            productId: demoId('prod', 6),
            productName: '[DEMO] Brinquedo Educativo Montessori',
            url: 'https://s.shopee.com.br/demo-aff-6',
            platform: 'instagram',
            clicks: 234,
            sales: 13,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(20),
            updatedAt: daysAgo(4)
        },
        {
            id: demoId('link', 8),
            productId: demoId('prod', 8),
            productName: '[DEMO] Luminária LED de Mesa',
            url: 'https://s.shopee.com.br/demo-aff-8',
            platform: 'tiktok',
            clicks: 98,
            sales: 0,
            status: 'ativo',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(10),
            updatedAt: daysAgo(2)
        }
    ];

    // =========================================================
    // CONTEÚDOS DE DEMONSTRAÇÃO
    // =========================================================
    const contents = [
        {
            id: demoId('cont', 1),
            name: '[DEMO] Unboxing Fone TWS - Reels IG',
            productId: demoId('prod', 1),
            productName: '[DEMO] Fone Bluetooth TWS Pro',
            platform: 'instagram',
            type: 'Reels',
            status: 'publicado',
            publishDate: daysAgo(30, 18),
            clicks: 342,
            sales: 18,
            commission: 129.42,
            notes: 'Vídeo viralizou. Repostar com novo ângulo.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(32),
            updatedAt: daysAgo(30)
        },
        {
            id: demoId('cont', 2),
            name: '[DEMO] Review Fone TWS - TikTok',
            productId: demoId('prod', 1),
            productName: '[DEMO] Fone Bluetooth TWS Pro',
            platform: 'tiktok',
            type: 'Vídeo',
            status: 'publicado',
            publishDate: daysAgo(25, 20),
            clicks: 512,
            sales: 27,
            commission: 194.13,
            notes: 'Melhor performance até agora. Padrão a seguir.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(28),
            updatedAt: daysAgo(25)
        },
        {
            id: demoId('cont', 3),
            name: '[DEMO] Antes/Depois Sérum Vitamina C',
            productId: demoId('prod', 3),
            productName: '[DEMO] Sérum Facial Vitamina C',
            platform: 'instagram',
            type: 'Story',
            status: 'publicado',
            publishDate: daysAgo(20, 12),
            clicks: 289,
            sales: 22,
            commission: 131.78,
            notes: 'Ótima conversão. Fazer mais no mesmo estilo.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(22),
            updatedAt: daysAgo(20)
        },
        {
            id: demoId('cont', 4),
            name: '[DEMO] Organização de cozinha - Reels',
            productId: demoId('prod', 2),
            productName: '[DEMO] Kit Organizador de Cozinha',
            platform: 'instagram',
            type: 'Reels',
            status: 'publicado',
            publishDate: daysAgo(18, 17),
            clicks: 156,
            sales: 14,
            commission: 77.14,
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(20),
            updatedAt: daysAgo(18)
        },
        {
            id: demoId('cont', 5),
            name: '[DEMO] Look do dia - Camiseta Oversized',
            productId: demoId('prod', 4),
            productName: '[DEMO] Camiseta Oversized Premium',
            platform: 'instagram',
            type: 'Post',
            status: 'publicado',
            publishDate: daysAgo(15, 19),
            clicks: 421,
            sales: 11,
            commission: 65.89,
            notes: 'Boa performance.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(17),
            updatedAt: daysAgo(15)
        },
        {
            id: demoId('cont', 6),
            name: '[DEMO] Setup Gamer - Short',
            productId: demoId('prod', 5),
            productName: '[DEMO] Mouse Gamer RGB 7200DPI',
            platform: 'youtube',
            type: 'Short',
            status: 'publicado',
            publishDate: daysAgo(12, 16),
            clicks: 687,
            sales: 4,
            commission: 19.16,
            notes: 'Muitos cliques, poucas vendas. Revisar público-alvo.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(14),
            updatedAt: daysAgo(12)
        },
        {
            id: demoId('cont', 7),
            name: '[DEMO] Montessori - Story',
            productId: demoId('prod', 6),
            productName: '[DEMO] Brinquedo Educativo Montessori',
            platform: 'instagram',
            type: 'Story',
            status: 'agendado',
            publishDate: daysFromNow(2, 18),
            clicks: 0,
            sales: 0,
            commission: 0,
            notes: 'Aguardando aprovação.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(5),
            updatedAt: daysAgo(1)
        },
        {
            id: demoId('cont', 8),
            name: '[DEMO] Luminária - Reels',
            productId: demoId('prod', 8),
            productName: '[DEMO] Luminária LED de Mesa',
            platform: 'tiktok',
            type: 'Reels',
            status: 'producao',
            publishDate: daysFromNow(5, 20),
            clicks: 0,
            sales: 0,
            commission: 0,
            notes: 'Gravando com produto em mãos.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(3),
            updatedAt: daysAgo(1)
        },
        {
            id: demoId('cont', 9),
            name: '[DEMO] Ideia: Comparativo de Fones',
            productId: demoId('prod', 1),
            productName: '[DEMO] Fone Bluetooth TWS Pro',
            platform: 'tiktok',
            type: 'Vídeo',
            status: 'ideia',
            publishDate: daysFromNow(10, 15),
            clicks: 0,
            sales: 0,
            commission: 0,
            notes: 'Comparar 3 modelos diferentes.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(2),
            updatedAt: daysAgo(1)
        },
        {
            id: demoId('cont', 10),
            name: '[DEMO] Ideia: Rotina de skincare',
            productId: demoId('prod', 3),
            productName: '[DEMO] Sérum Facial Vitamina C',
            platform: 'instagram',
            type: 'Reels',
            status: 'ideia',
            publishDate: daysFromNow(7, 11),
            clicks: 0,
            sales: 0,
            commission: 0,
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(1),
            updatedAt: daysAgo(1)
        }
    ];

    // =========================================================
    // CLIENTES DE DEMONSTRAÇÃO
    // =========================================================
    const customers = [
        {
            id: demoId('cust', 1),
            name: '[DEMO] Ana Silva',
            whatsapp: '(11) 98765-4321',
            city: 'São Paulo - SP',
            lastProductId: demoId('prod', 1),
            lastProductName: '[DEMO] Fone Bluetooth TWS Pro',
            lastPurchaseDate: daysAgo(2, 14),
            lastValue: 89.90,
            purchaseCount: 3,
            notes: 'Cliente recorrente. Gosta de eletrônicos.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(30),
            updatedAt: daysAgo(2)
        },
        {
            id: demoId('cust', 2),
            name: '[DEMO] Bruno Costa',
            whatsapp: '(21) 99876-5432',
            city: 'Rio de Janeiro - RJ',
            lastProductId: demoId('prod', 3),
            lastProductName: '[DEMO] Sérum Facial Vitamina C',
            lastPurchaseDate: daysAgo(5, 10),
            lastValue: 39.90,
            purchaseCount: 2,
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(25),
            updatedAt: daysAgo(5)
        },
        {
            id: demoId('cust', 3),
            name: '[DEMO] Carla Mendes',
            whatsapp: '(31) 98888-7777',
            city: 'Belo Horizonte - MG',
            lastProductId: demoId('prod', 2),
            lastProductName: '[DEMO] Kit Organizador de Cozinha',
            lastPurchaseDate: daysAgo(8, 16),
            lastValue: 45.90,
            purchaseCount: 1,
            notes: 'Indicou para amigas.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(20),
            updatedAt: daysAgo(8)
        },
        {
            id: demoId('cust', 4),
            name: '[DEMO] Diego Ferreira',
            whatsapp: '(11) 97777-6666',
            city: 'São Paulo - SP',
            lastProductId: demoId('prod', 5),
            lastProductName: '[DEMO] Mouse Gamer RGB 7200DPI',
            lastPurchaseDate: daysAgo(12, 21),
            lastValue: 79.90,
            purchaseCount: 1,
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(15),
            updatedAt: daysAgo(12)
        },
        {
            id: demoId('cust', 5),
            name: '[DEMO] Elisa Rocha',
            whatsapp: '(41) 96666-5555',
            city: 'Curitiba - PR',
            lastProductId: demoId('prod', 6),
            lastProductName: '[DEMO] Brinquedo Educativo Montessori',
            lastPurchaseDate: daysAgo(18, 11),
            lastValue: 69.90,
            purchaseCount: 4,
            notes: 'Cliente fiel. Sempre compra brinquedos.',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(22),
            updatedAt: daysAgo(18)
        },
        {
            id: demoId('cust', 6),
            name: '[DEMO] Felipe Alves',
            whatsapp: '(51) 95555-4444',
            city: 'Porto Alegre - RS',
            lastProductId: demoId('prod', 4),
            lastProductName: '[DEMO] Camiseta Oversized Premium',
            lastPurchaseDate: daysAgo(14, 15),
            lastValue: 59.90,
            purchaseCount: 2,
            notes: '',
            [DEMO_FLAG]: true,
            createdAt: daysAgo(20),
            updatedAt: daysAgo(14)
        }
    ];

    // =========================================================
    // VENDAS DE DEMONSTRAÇÃO
    // =========================================================
    const sales = [
        // Últimos 7 dias - alta performance
        { days: 0, product: 1, qty: 2, value: 179.80, platform: 'instagram', customer: 1 },
        { days: 0, product: 3, qty: 1, value: 39.90, platform: 'tiktok', customer: null },
        { days: 1, product: 1, qty: 1, value: 89.90, platform: 'tiktok', customer: null },
        { days: 1, product: 2, qty: 2, value: 91.80, platform: 'whatsapp', customer: 3 },
        { days: 2, product: 1, qty: 1, value: 89.90, platform: 'instagram', customer: 1 },
        { days: 2, product: 6, qty: 3, value: 209.70, platform: 'instagram', customer: 5 },
        { days: 3, product: 3, qty: 2, value: 79.80, platform: 'instagram', customer: 2 },
        { days: 3, product: 4, qty: 1, value: 59.90, platform: 'instagram', customer: 6 },
        { days: 4, product: 1, qty: 3, value: 269.70, platform: 'tiktok', customer: null },
        { days: 5, product: 3, qty: 1, value: 39.90, platform: 'instagram', customer: 2 },
        { days: 5, product: 2, qty: 1, value: 45.90, platform: 'whatsapp', customer: null },
        { days: 6, product: 6, qty: 1, value: 69.90, platform: 'instagram', customer: 5 },

        // Semana anterior
        { days: 8, product: 1, qty: 2, value: 179.80, platform: 'instagram', customer: null },
        { days: 9, product: 5, qty: 1, value: 79.90, platform: 'youtube', customer: 4 },
        { days: 10, product: 3, qty: 3, value: 119.70, platform: 'tiktok', customer: null },
        { days: 11, product: 1, qty: 1, value: 89.90, platform: 'instagram', customer: 1 },
        { days: 12, product: 4, qty: 2, value: 119.80, platform: 'instagram', customer: null },
        { days: 13, product: 2, qty: 1, value: 45.90, platform: 'whatsapp', customer: 3 },
        { days: 14, product: 5, qty: 1, value: 79.90, platform: 'youtube', customer: 4 },

        // Mês passado (para popular o gráfico mensal)
        { days: 20, product: 1, qty: 4, value: 359.60, platform: 'instagram', customer: null },
        { days: 22, product: 3, qty: 5, value: 199.50, platform: 'tiktok', customer: null },
        { days: 25, product: 6, qty: 3, value: 209.70, platform: 'instagram', customer: 5 },
        { days: 28, product: 2, qty: 2, value: 91.80, platform: 'whatsapp', customer: null },
        { days: 32, product: 1, qty: 3, value: 269.70, platform: 'instagram', customer: null },
        { days: 35, product: 4, qty: 2, value: 119.80, platform: 'instagram', customer: 6 },
        { days: 38, product: 3, qty: 4, value: 159.60, platform: 'tiktok', customer: null },
        { days: 42, product: 1, qty: 2, value: 179.80, platform: 'instagram', customer: null },
        { days: 45, product: 5, qty: 1, value: 79.90, platform: 'youtube', customer: null }
    ];

    // =========================================================
    // FUNÇÕES PÚBLICAS
    // =========================================================

    /**
     * Carrega todos os dados de demonstração no LocalStorage
     */
    function load() {
        try {
            // Produtos
            products.forEach(p => {
                if (!Storage.getById(Storage.KEYS.products, p.id)) {
                    Storage.add(Storage.KEYS.products, p);
                }
            });

            // Clientes
            customers.forEach(c => {
                if (!Storage.getById(Storage.KEYS.customers, c.id)) {
                    Storage.add(Storage.KEYS.customers, c);
                }
            });

            // Links
            links.forEach(l => {
                if (!Storage.getById(Storage.KEYS.links, l.id)) {
                    Storage.add(Storage.KEYS.links, l);
                }
            });

            // Conteúdos
            contents.forEach(c => {
                if (!Storage.getById(Storage.KEYS.contents, c.id)) {
                    Storage.add(Storage.KEYS.contents, c);
                }
            });

            // Vendas — geradas dinamicamente com comissão calculada
            sales.forEach((s, idx) => {
                const saleId = demoId('sale', idx + 1);
                if (Storage.getById(Storage.KEYS.sales, saleId)) return;

                const product = products.find(p => p.id === demoId('prod', s.product));
                if (!product) return;

                const commissionPercent = product.commissionPercent || 0;
                const commissionValue = s.value * (commissionPercent / 100);

                const customer = s.customer
                    ? customers.find(c => c.id === demoId('cust', s.customer))
                    : null;

                Storage.add(Storage.KEYS.sales, {
                    id: saleId,
                    date: daysAgo(s.days, 10 + (idx % 10), (idx * 7) % 60),
                    productId: product.id,
                    productName: product.name,
                    quantity: s.qty,
                    saleValue: s.value,
                    commissionPercent,
                    commissionValue,
                    platform: s.platform,
                    customerId: customer ? customer.id : null,
                    customerName: customer ? customer.name : '',
                    notes: '',
                    [DEMO_FLAG]: true,
                    createdAt: daysAgo(s.days),
                    updatedAt: daysAgo(s.days)
                });
            });

            // Marca no storage que a demo está carregada
            try {
                localStorage.setItem('orsm_demo_loaded', '1');
            } catch (e) { /* ignore */ }

            return {
                products: products.length,
                links: links.length,
                contents: contents.length,
                sales: sales.length,
                customers: customers.length
            };

        } catch (err) {
            console.error('[DemoData] Erro ao carregar dados:', err);
            throw err;
        }
    }

    /**
     * Remove APENAS os registros marcados como demo
     */
    function remove() {
        try {
            const tables = ['products', 'links', 'contents', 'sales', 'customers'];
            let removed = 0;

            tables.forEach(table => {
                const all = Storage.getAll(table);
                const filtered = all.filter(item => !item[DEMO_FLAG]);
                removed += all.length - filtered.length;

                // Salva direto para não criar novos timestamps
                try {
                    localStorage.setItem('orsm_' + table, JSON.stringify(filtered));
                } catch (e) {
                    console.error(e);
                }
            });

            try {
                localStorage.removeItem('orsm_demo_loaded');
            } catch (e) { /* ignore */ }

            return removed;

        } catch (err) {
            console.error('[DemoData] Erro ao remover dados:', err);
            throw err;
        }
    }

    /**
     * Verifica se existem dados demo no sistema
     */
    function hasDemoData() {
        const tables = ['products', 'links', 'contents', 'sales', 'customers'];
        for (const table of tables) {
            const all = Storage.getAll(table);
            if (all.some(item => item[DEMO_FLAG])) return true;
        }
        return false;
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        load,
        remove,
        hasDemoData,
        DEMO_FLAG
    };
})();