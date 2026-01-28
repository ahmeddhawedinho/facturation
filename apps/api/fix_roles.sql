UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'COMPANY_ADMIN' OR "role" = 'SUPER_ADMIN';
UPDATE "User" SET "role" = 'SUB_ACCOUNT' WHERE "role" = 'COMPANY_USER';
