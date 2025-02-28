-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ClassTypeUser" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "TypeCurrency" AS ENUM ('PEN', 'USD');

-- CreateEnum
CREATE TYPE "Family" AS ENUM ('CHOCOLAT', 'DRINK', 'SPICES', 'PERSONAL_CARE', 'MERCH', 'OTHER');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingDocumentType" AS ENUM ('INVOICE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'RUNNING', 'UNPAID', 'ABANDONED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CONFIRMED', 'ORDER_PREPARING', 'ORDER_READY', 'ORDER_PICKED_UP', 'ORDER_CANCELLED', 'PROMOTIONAL', 'REMINDER');

-- CreateEnum
CREATE TYPE "MethodPayment" AS ENUM ('PAYPAL', 'IZIPAY', 'CASH');

-- CreateEnum
CREATE TYPE "TypeClass" AS ENUM ('NORMAL', 'PRIVATE', 'GROUP');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRol" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rolId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulePermissions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModulePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolModulePermissions" (
    "id" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "modulePermissionsId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolModulePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" "AuditActionType" NOT NULL,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessConfig" (
    "id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL DEFAULT '00000000000',
    "businessName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHours" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassPriceConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL',
    "classTypeUser" "ClassTypeUser" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "typeCurrency" "TypeCurrency" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassPriceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL',
    "startTime" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassLanguage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRegistrationConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "closeBeforeStartInterval" INTEGER NOT NULL,
    "finalRegistrationCloseInterval" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassRegistrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRestricted" BOOLEAN DEFAULT false,
    "maxStock" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" "Family" NOT NULL DEFAULT 'CHOCOLAT',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "additionalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "password" TEXT,
    "birthDate" TIMESTAMP(3),
    "isGoogleAuth" BOOLEAN,
    "token" TEXT,
    "lastLogin" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terms" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "tempId" TEXT,
    "clientId" TEXT,
    "orderId" TEXT,
    "cartStatus" "CartStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerLastName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "pickupCode" TEXT,
    "totalAmount" DOUBLE PRECISION,
    "pickupTime" TIMESTAMP(3) NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "someonePickup" BOOLEAN DEFAULT false,
    "comments" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "billingDocumentType" "BillingDocumentType" NOT NULL,
    "typeDocument" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "businessName" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupCodeSequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currentSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PickupCodeSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "notificationType" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classes" (
    "id" TEXT NOT NULL,
    "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL',
    "scheduleClass" TEXT NOT NULL,
    "languageClass" TEXT NOT NULL,
    "dateClass" TIMESTAMP(3) NOT NULL,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRegister" (
    "id" TEXT NOT NULL,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "totalParticipants" INTEGER NOT NULL,
    "totalAdults" INTEGER NOT NULL,
    "totalChildren" INTEGER NOT NULL,
    "totalPriceAdults" DOUBLE PRECISION NOT NULL,
    "totalPriceChildren" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "typeCurrency" "TypeCurrency" NOT NULL,
    "allergies" TEXT,
    "occasion" TEXT,
    "comments" TEXT,
    "status" "ClassStatus" NOT NULL DEFAULT 'PENDING',
    "methodPayment" "MethodPayment",
    "paypalOrderId" TEXT,
    "paypalOrderStatus" TEXT,
    "paypalAmount" TEXT,
    "paypalCurrency" TEXT,
    "paypalDate" TEXT,
    "izipayOrderId" TEXT,
    "izipayOrderStatus" TEXT,
    "izipayAmount" TEXT,
    "izipayCurrency" TEXT,
    "izipayDate" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classesId" TEXT,

    CONSTRAINT "ClassRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassCapacity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL',
    "minCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claims" (
    "id" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "claimantAddress" TEXT,
    "documentNumber" TEXT NOT NULL,
    "claimantEmail" TEXT NOT NULL,
    "claimantPhone" TEXT NOT NULL,
    "claimantRepresentative" TEXT,
    "assetType" "AssetType" NOT NULL,
    "amountClaimed" TEXT,
    "assetDescription" TEXT NOT NULL,
    "claimDescription" TEXT NOT NULL,
    "dateClaim" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_isActive_key" ON "User"("email", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_id_key" ON "Rol"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_name_isActive_key" ON "Rol"("name", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserRol_id_key" ON "UserRol"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserRol_userId_rolId_key" ON "UserRol"("userId", "rolId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_id_key" ON "Permission"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_cod_name_key" ON "Permission"("cod", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Module_id_key" ON "Module"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Module_cod_name_key" ON "Module"("cod", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermissions_id_key" ON "ModulePermissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermissions_moduleId_permissionId_key" ON "ModulePermissions"("moduleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolModulePermissions_id_key" ON "RolModulePermissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RolModulePermissions_rolId_modulePermissionsId_key" ON "RolModulePermissions"("rolId", "modulePermissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Audit_id_key" ON "Audit"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessConfig_id_key" ON "BusinessConfig"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessConfig_businessName_email_key" ON "BusinessConfig"("businessName", "email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_id_key" ON "BusinessHours"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassPriceConfig_id_key" ON "ClassPriceConfig"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_id_key" ON "ClassSchedule"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_typeClass_startTime_key" ON "ClassSchedule"("typeClass", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ClassLanguage_id_key" ON "ClassLanguage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassLanguage_languageName_key" ON "ClassLanguage"("languageName");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegistrationConfig_id_key" ON "ClassRegistrationConfig"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_key" ON "Product"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_id_key" ON "ProductImage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_order_key" ON "ProductImage"("productId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Category_id_key" ON "Category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariation_id_key" ON "ProductVariation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_id_key" ON "Client"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_id_key" ON "Cart"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_tempId_key" ON "Cart"("tempId");

-- CreateIndex
CREATE INDEX "Cart_clientId_idx" ON "Cart"("clientId");

-- CreateIndex
CREATE INDEX "Cart_lastAccessed_idx" ON "Cart"("lastAccessed");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_id_key" ON "CartItem"("id");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_key" ON "Order"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cartId_key" ON "Order"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_pickupCode_key" ON "Order"("pickupCode");

-- CreateIndex
CREATE INDEX "Order_cartId_idx" ON "Order"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingDocument_id_key" ON "BillingDocument"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BillingDocument_orderId_key" ON "BillingDocument"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_id_key" ON "Notification"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Classes_id_key" ON "Classes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegister_id_key" ON "ClassRegister"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ClassCapacity_id_key" ON "ClassCapacity"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Claims_id_key" ON "Claims"("id");

-- AddForeignKey
ALTER TABLE "UserRol" ADD CONSTRAINT "UserRol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRol" ADD CONSTRAINT "UserRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermissions" ADD CONSTRAINT "ModulePermissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermissions" ADD CONSTRAINT "ModulePermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolModulePermissions" ADD CONSTRAINT "RolModulePermissions_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolModulePermissions" ADD CONSTRAINT "RolModulePermissions_modulePermissionsId_fkey" FOREIGN KEY ("modulePermissionsId") REFERENCES "ModulePermissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassPriceConfig" ADD CONSTRAINT "ClassPriceConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassLanguage" ADD CONSTRAINT "ClassLanguage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistrationConfig" ADD CONSTRAINT "ClassRegistrationConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariation" ADD CONSTRAINT "ProductVariation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDocument" ADD CONSTRAINT "BillingDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "FK_Notification_Client" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "FK_Notification_Order" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegister" ADD CONSTRAINT "ClassRegister_classesId_fkey" FOREIGN KEY ("classesId") REFERENCES "Classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCapacity" ADD CONSTRAINT "ClassCapacity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
