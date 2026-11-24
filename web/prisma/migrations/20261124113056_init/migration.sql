-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('admin', 'employee');

-- CreateEnum
CREATE TYPE "public"."CustomerType" AS ENUM ('surf_shop', 'surf_school', 'club', 'hotel', 'other');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('new', 'processing', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('credit_card', 'bank_transfer', 'net_terms');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'paid', 'on_terms');

-- CreateEnum
CREATE TYPE "public"."ProviderType" AS ENUM ('payment', 'invoicing', 'shipping');

-- CreateTable
CREATE TABLE "public"."StaffUser" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL DEFAULT 'employee',
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_tax_id" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "customer_type" "public"."CustomerType",
    "address" TEXT,
    "is_net_terms_approved" BOOLEAN NOT NULL DEFAULT false,
    "net_terms_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "material" TEXT,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'new',
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_due_date" DATE,
    "subtotal_amount" DECIMAL(12,2) NOT NULL,
    "shipping_fee" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "shipping_carrier" TEXT,
    "tracking_number" TEXT,
    "shipped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Provider" (
    "id" TEXT NOT NULL,
    "type" "public"."ProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "public"."StaffUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "public"."Customer"("email");

-- CreateIndex
CREATE INDEX "ProductVariant_product_id_idx" ON "public"."ProductVariant"("product_id");

-- CreateIndex
CREATE INDEX "ProductImage_product_id_color_idx" ON "public"."ProductImage"("product_id", "color");

-- CreateIndex
CREATE UNIQUE INDEX "Order_order_number_key" ON "public"."Order"("order_number");

-- CreateIndex
CREATE INDEX "Order_customer_id_idx" ON "public"."Order"("customer_id");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "Order_created_at_idx" ON "public"."Order"("created_at");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "public"."OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "OrderItem_product_variant_id_idx" ON "public"."OrderItem"("product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_order_id_key" ON "public"."Invoice"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "public"."Invoice"("invoice_number");

-- CreateIndex
CREATE INDEX "Provider_type_idx" ON "public"."Provider"("type");

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- כללים עסקיים ברמת מסד הנתונים
ALTER TABLE "ProductVariant" ADD CONSTRAINT "stock_non_negative" CHECK ("stock_quantity" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "quantity_positive" CHECK ("quantity" >= 1);
ALTER TABLE "Product" ADD CONSTRAINT "price_non_negative" CHECK ("price" >= 0);

-- מספור רץ להזמנות ולחשבוניות
CREATE SEQUENCE "order_number_seq" START 1001;
CREATE SEQUENCE "invoice_number_seq" START 5001;
