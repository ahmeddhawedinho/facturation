import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ClientsModule } from './clients/clients.module';
import { DocumentsModule } from './documents/documents.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { CustomAttributesModule } from './custom-attributes/custom-attributes.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { CustomRolesModule } from './custom-roles/custom-roles.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ImportExportModule } from './import-export/import-export.module';
import { EmployeesModule } from './employees/employees.module';
import { SalariesModule } from './salaries/salaries.module';
import { PerformanceModule } from './performance/performance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { AccountantPortalModule } from './accountant-portal/accountant-portal.module';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        CompaniesModule,
        ClientsModule,
        DocumentsModule,
        TaxRatesModule,
        ExchangeRatesModule,
        CustomAttributesModule,
        AuditLogsModule,
        SuppliersModule,
        ProductsModule,
        PurchaseOrdersModule,
        CustomRolesModule,
        DashboardModule,
        ImportExportModule,
        EmployeesModule,
        SalariesModule,
        PerformanceModule,
        NotificationsModule,
        ChatModule,
        AccountantPortalModule,
    ],
})
export class AppModule { }
