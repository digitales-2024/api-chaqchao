-- CreateTable
CREATE TABLE "_CartItemToProductVariation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CartItemToProductVariation_AB_unique" ON "_CartItemToProductVariation"("A", "B");

-- CreateIndex
CREATE INDEX "_CartItemToProductVariation_B_index" ON "_CartItemToProductVariation"("B");

-- AddForeignKey
ALTER TABLE "_CartItemToProductVariation" ADD CONSTRAINT "_CartItemToProductVariation_A_fkey" FOREIGN KEY ("A") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItemToProductVariation" ADD CONSTRAINT "_CartItemToProductVariation_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
