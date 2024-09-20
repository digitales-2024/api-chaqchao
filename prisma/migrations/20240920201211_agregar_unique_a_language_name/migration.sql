/*
  Warnings:

  - A unique constraint covering the columns `[languageName]` on the table `ClassLanguage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClassLanguage_languageName_key" ON "ClassLanguage"("languageName");
