import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Readable } from 'stream';
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) { }

  async create(companyId: string, data: any, user?: any) {
    const {
      title, description, image, categoryId, subcategoryId, supplierId,
      purchasePrice, sellingPrice, priceTaxFree, supplierReference, sku, quantity, isVariable
    } = data;

    try {
      // 1. Create product
      const product = await this.prisma.product.create({
        data: {
          title,
          description,
          image,
          categoryId: categoryId || null,
          subcategoryId: subcategoryId || null,
          supplierId: supplierId || null,
          purchasePrice: Number(purchasePrice) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          priceTaxFree: priceTaxFree ? Number(priceTaxFree) : null,
          supplierReference: (supplierReference && supplierReference.trim() !== '') ? supplierReference : null,
          sku: (sku && sku.trim() !== '') ? sku : null,
          quantity: Number(quantity) || 0,
          isVariable: isVariable || false,
          companyId,
          variants: {
            create: data.variants ? data.variants.map((v: any) => ({
              title: v.title,
              sku: v.sku,
              priceHT: Number(v.priceHT) || 0,
              priceTTC: Number(v.priceTTC) || 0,
              quantity: Number(v.quantity) || 0,
            })) : []
          }
        },
        include: {
          categoryRef: true,
          subcategoryRef: true,
          variants: true
        }
      });

      // 2. Sync aggregate if variable
      if (isVariable && data.variants && data.variants.length > 0) {
        const totalQty = data.variants.reduce((acc: number, v: any) => acc + (Number(v.quantity) || 0), 0);
        const minPrice = Math.min(...data.variants.map((v: any) => Number(v.priceTTC) || 0));

        await this.prisma.product.update({
          where: { id: product.id },
          data: {
            quantity: totalQty,
            sellingPrice: minPrice
          }
        });
      }

      if (user) await this.logAndNotify(companyId, user, 'CREATE', `Création produit ${product.title}`, `/dashboard/products/${product.id}`, product.id, { name: product.title });

      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async findAll(companyId: string, params: {
    search?: string;
    sku?: string;
    categoryId?: string;
    subcategoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { search, sku, categoryId, subcategoryId, sortBy = 'title', sortOrder = 'asc' } = params;

    const where: any = { companyId };

    if (sku) {
      where.sku = { contains: sku, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }

    const orderBy: any = {};
    if (['title', 'sku', 'sellingPrice', 'quantity', 'purchasePrice', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    return this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        categoryRef: true,
        subcategoryRef: true,
        variants: true,
      },
    });
  }

  async findById(id: string, companyId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
      include: {
        categoryRef: true,
        subcategoryRef: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    return product;
  }

  async update(companyId: string, id: string, data: any, user?: any) {
    const {
      title, description, image, categoryId, subcategoryId, supplierId,
      purchasePrice, sellingPrice, priceTaxFree, supplierReference, sku, quantity, trackStock, isVariable, variants
    } = data;

    try {
      // 1. Update core product data
      const updated = await this.prisma.product.update({
        where: { id, companyId },
        data: {
          title,
          description,
          image,
          categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
          subcategoryId: subcategoryId !== undefined ? (subcategoryId || null) : undefined,
          supplierId: supplierId !== undefined ? (supplierId || null) : undefined,
          purchasePrice: purchasePrice !== undefined ? (Number(purchasePrice) || 0) : undefined,
          sellingPrice: sellingPrice !== undefined ? (Number(sellingPrice) || 0) : undefined,
          priceTaxFree: priceTaxFree !== undefined ? (priceTaxFree ? Number(priceTaxFree) : null) : undefined,
          supplierReference: (supplierReference !== undefined) ? ((supplierReference && supplierReference.trim() !== '') ? supplierReference : null) : undefined,
          sku: (sku !== undefined) ? ((sku && sku.trim() !== '') ? sku : null) : undefined,
          quantity: quantity !== undefined ? (Number(quantity) || 0) : undefined,
          trackStock: trackStock !== undefined ? trackStock : undefined,
          isVariable: isVariable !== undefined ? isVariable : undefined,
        },
        include: {
          categoryRef: true,
          subcategoryRef: true,
          variants: true
        }
      });

      // 2. Handle variants update separately
      if (variants && Array.isArray(variants)) {
        // Delete all for this product and recreate for simplicity in this MVP
        await this.prisma.productVariant.deleteMany({ where: { productId: id } });

        if (variants.length > 0) {
          await this.prisma.productVariant.createMany({
            data: variants.map((v: any) => ({
              productId: id,
              title: v.title,
              sku: v.sku,
              priceHT: Number(v.priceHT) || 0,
              priceTTC: Number(v.priceTTC) || 0,
              quantity: Number(v.quantity) || 0,
            }))
          });
        }

        // 3. Sync aggregate stock and price if variable
        if (isVariable && variants.length > 0) {
          const totalQty = variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
          const minPrice = Math.min(...variants.map(v => Number(v.priceTTC) || 0));

          await this.prisma.product.update({
            where: { id },
            data: {
              quantity: totalQty,
              sellingPrice: minPrice // Show "Starting from" price essentially
            }
          });
        }
      }

      if (user) await this.logAndNotify(companyId, user, 'UPDATE', `Mise à jour produit ${data.title || 'Produit'}`, `/dashboard/products/${id}`, id, data);

      return this.findById(id, companyId);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async getProductStats(id: string, companyId: string) {
    const product = await this.findById(id, companyId);

    // Get all sales lines for this product
    const salesLines = await this.prisma.documentLine.findMany({
      where: {
        productId: id,
        document: {
          companyId,
          type: { in: ['INVOICE', 'SALES_ORDER', 'DELIVERY_NOTE'] }
        }
      },
      include: {
        document: {
          include: {
            client: true
          }
        }
      }
    });

    const totalQuantitySold = salesLines.reduce((acc, line) => acc + line.quantity, 0);
    const totalRevenue = salesLines.reduce((acc, line) => acc + line.subtotal, 0);

    // Benefit margin
    // Margin = Revenue - (PurchasePrice * QuantitySold)
    const totalCost = totalQuantitySold * (product.purchasePrice || 0);
    const profitMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? (profitMargin / totalRevenue) * 100 : 0;

    // Clients list
    const clientsMap = new Map();
    salesLines.forEach(line => {
      if (line.document.client) {
        const client = line.document.client;
        if (!clientsMap.has(client.id)) {
          clientsMap.set(client.id, {
            id: client.id,
            name: client.name,
            totalPurchased: 0,
            lastPurchase: line.document.issueDate
          });
        }
        const stats = clientsMap.get(client.id);
        stats.totalPurchased += line.subtotal;
        if (new Date(line.document.issueDate) > new Date(stats.lastPurchase)) {
          stats.lastPurchase = line.document.issueDate;
        }
      }
    });

    return {
      product: {
        id: product.id,
        title: product.title,
        sku: product.sku,
        quantity: product.quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        trackStock: product.trackStock
      },
      stats: {
        totalQuantitySold,
        totalRevenue,
        profitMargin,
        marginPercentage,
        uniqueClientsCount: clientsMap.size,
        clients: Array.from(clientsMap.values()).sort((a, b) => b.totalPurchased - a.totalPurchased)
      },
      recentSales: salesLines.slice(0, 10).map(line => ({
        date: line.document.issueDate,
        docNumber: line.document.number,
        clientName: line.document.client?.name,
        quantity: line.quantity,
        price: line.unitPrice,
        total: line.total
      }))
    };
  }

  async delete(id: string, companyId: string, user?: any) {
    const product = await this.prisma.product.delete({
      where: { id, companyId },
    })
    if (user) await this.logAndNotify(companyId, user, 'DELETE', `Suppression produit`, `/dashboard/products`, id);
    return product;
  }

  // Categories Management
  async getCategories(companyId: string) {
    return this.prisma.productCategory.findMany({
      where: { companyId },
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(companyId: string, name: string) {
    return this.prisma.productCategory.upsert({
      where: {
        companyId_name: { companyId, name },
      },
      update: {},
      create: { name, companyId },
    });
  }

  async deleteCategory(companyId: string, id: string) {
    return this.prisma.productCategory.delete({
      where: { id, companyId },
    });
  }

  async createSubCategory(categoryId: string, name: string) {
    return this.prisma.productSubCategory.upsert({
      where: {
        categoryId_name: { categoryId, name },
      },
      update: {},
      create: { name, categoryId },
    });
  }

  async getSubCategories(categoryId: string) {
    return (this.prisma as any).productSubCategory.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });
  }

  // Attributes Management
  async getAttributes(companyId: string) {
    // Cast to any because ProductAttribute might not be in generated client yet 
    return (this.prisma as any).productAttribute.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createAttribute(companyId: string, name: string, values: string[] = []) {
    return (this.prisma as any).productAttribute.create({
      data: { name, values, companyId },
    });
  }

  async updateAttribute(id: string, companyId: string, data: any) {
    return (this.prisma as any).productAttribute.update({
      where: { id, companyId },
      data: {
        name: data.name,
        values: data.values
      }
    });
  }

  async deleteAttribute(id: string, companyId: string) {
    return (this.prisma as any).productAttribute.delete({
      where: { id, companyId },
    });
  }

  // Import WooCommerce CSV
  async importFromWooCommerceCsv(buffer: Buffer, companyId: string) {
    console.log('Starting WooCommerce Import for company:', companyId);

    // Dynamic loading of csv-parse
    let parseFunc: any;
    try {
      const check = require('csv-parse');
      parseFunc = check.parse || check;
    } catch (e) {
      throw new Error('Failed to load csv-parse module: ' + e);
    }

    const hasCategories = !!(this.prisma as any).productCategory;
    if (!hasCategories) {
      console.warn('Prisma Client missing productCategory. Importing without categories.');
    }

    const stream = Readable.from(buffer);
    const parser = stream.pipe(parseFunc({
      columns: true,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
      delimiter: [',', ';', '\t']
    }));

    let successCount = 0;
    let errorCount = 0;

    for await (const row of parser) {
      try {
        // Flexible mapping for EN/FR headers with normalization
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

        const getVal = (candidates: string[]) => {
          const rowKeys = Object.keys(row);
          const normalizedRowKeys = rowKeys.reduce((acc, k) => {
            acc[normalize(k)] = k; // Map normalized -> original
            return acc;
          }, {} as Record<string, string>);

          for (const candidate of candidates) {
            const normalizedCandidate = normalize(candidate);
            if (normalizedRowKeys[normalizedCandidate]) {
              return row[normalizedRowKeys[normalizedCandidate]];
            }
          }
          return undefined;
        };

        const title = getVal(['Name', 'Nom', 'Titre']);
        if (!title) {
          if (successCount === 0 && errorCount === 0) {
            console.warn('First row failure. Expected "Nom" or "Name". Found keys:', Object.keys(row));
          }
          continue;
        }

        const sku = getVal(['SKU', 'UGS', 'Référence', 'Reference']) || null;
        const sellingPrice = parseFloat((getVal(['Regular price', 'Tarif régulier', 'Prix', 'Price']) || '0').replace(',', '.'));
        const description = getVal(['Description', 'Description courte']) || '';
        const quantity = parseFloat(getVal(['Stock', 'Quantity', 'Quantité']) || '0');
        const categoryString = getVal(['Categories', 'Catégories', 'Categorie']);
        const imageString = getVal(['Images', 'Image']) || '';
        const image = imageString.split(',')[0].trim();

        let categoryId = null;
        if (categoryString && hasCategories) {
          const firstCat = categoryString.split(',')[0].trim();
          const catName = firstCat.split('>')[0].trim();

          if (catName) {
            const cat = await (this.prisma as any).productCategory.upsert({
              where: {
                companyId_name: { companyId, name: catName },
              },
              update: {},
              create: { name: catName, companyId },
            });
            categoryId = cat.id;
          }
        }

        const productData = {
          companyId,
          title,
          description,
          sellingPrice,
          purchasePrice: 0, // Default as not present in Woo export usually
          quantity,
          sku,
          image: image || undefined,
          trackStock: true,
          categoryId
        };

        if (sku) {
          const existing = await this.prisma.product.findFirst({ where: { companyId, sku } });
          if (existing) {
            await (this.prisma as any).product.update({
              where: { id: existing.id },
              data: {
                title, description, sellingPrice, quantity, categoryId
              }
            });
          } else {
            await (this.prisma as any).product.create({ data: productData });
          }
        } else {
          await (this.prisma as any).product.create({ data: productData });
        }
        successCount++;
      } catch (e) {
        console.error('Import error', e);
        errorCount++;
      }
    }
    return { successCount, errorCount };
  }

  async exportToWooCommerceCsv(companyId: string) {
    let stringifyFunc: any;
    try {
      const check = require('csv-stringify/sync');
      stringifyFunc = check.stringify || check;
    } catch (e) {
      throw new Error('Failed to load csv-stringify module: ' + e);
    }

    const products = await (this.prisma as any).product.findMany({
      where: { companyId },
      include: { categoryRef: true }
    });

    const csvData = products.map((p: any) => ({
      'ID': p.id,
      'Type': 'simple',
      'SKU': p.sku || '',
      'Name': p.title,
      'Published': 1,
      'Is featured?': 0,
      'Visibility in catalog': 'visible',
      'Short description': '',
      'Description': p.description || '',
      'Date sale price starts': '',
      'Date sale price ends': '',
      'Tax status': 'taxable',
      'Tax class': '',
      'In stock?': p.quantity > 0 ? 1 : 0,
      'Stock': p.quantity,
      'Backorders allowed?': 0,
      'Sold individually?': 0,
      'Weight (kg)': '',
      'Length (cm)': '',
      'Width (cm)': '',
      'Height (cm)': '',
      'Allow customer reviews?': 1,
      'Purchase note': '',
      'Sale price': '',
      'Regular price': p.sellingPrice,
      'Categories': p.categoryRef ? p.categoryRef.name : '',
      'Tags': '',
      'Shipping class': '',
      'Images': p.image || '',
      'Download limit': '',
      'Download expiry days': '',
      'Parent': '',
      'Grouped products': '',
      'Upsells': '',
      'Cross-sells': '',
      'External URL': '',
      'Button text': '',
      'Position': 0
    }));

    return stringifyFunc(csvData, { header: true });
  }

  private async logAndNotify(companyId: string, user: any, action: string, message: string, link: string, entityId: string, details?: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          entity: 'Product',
          entityId,
          changes: details || {}
        }
      });
      if (user.role !== 'ADMIN') {
        await this.notificationsService.notifyAdmins(companyId, `Action Stock: ${action}`, `${user.firstName} ${user.lastName} : ${message}`, link);
      }
    } catch (e) { console.error("Log error", e) }
  }
}
