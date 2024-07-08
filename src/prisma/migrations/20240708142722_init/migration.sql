-- CreateEnum
CREATE TYPE "UriType" AS ENUM ('REDIRECT', 'CORS');

-- CreateTable
CREATE TABLE "App" (
    "client_id" TEXT NOT NULL,
    "hashed_client_secret" VARCHAR(64) NOT NULL,
    "terms_uri" TEXT,
    "privacy_uri" TEXT,
    "client_type" TEXT NOT NULL,
    "require_pkce" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "App_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "Uri" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" "UriType" NOT NULL,
    "uri" TEXT NOT NULL,

    CONSTRAINT "Uri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "App_client_id_key" ON "App"("client_id");

-- AddForeignKey
ALTER TABLE "Uri" ADD CONSTRAINT "Uri_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "App"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;
