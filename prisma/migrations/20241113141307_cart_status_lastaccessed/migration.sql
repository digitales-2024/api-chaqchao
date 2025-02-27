-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "cartStatus" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Cart_clientId_idx" ON "Cart"("clientId");

-- CreateIndex
CREATE INDEX "Cart_cartStatus_idx" ON "Cart"("cartStatus");

-- CreateIndex
CREATE INDEX "Cart_lastAccessed_idx" ON "Cart"("lastAccessed");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE INDEX "Order_cartId_idx" ON "Order"("cartId");
