-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TitleStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REGENERATING');

-- CreateEnum
CREATE TYPE "OutlineStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REGENERATING');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('GENERATE_TITLES', 'GENERATE_OUTLINE', 'GENERATE_BLOG', 'REGENERATE_CONTENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "mission" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryKeywords" TEXT[],
    "secondaryKeywords" TEXT[],
    "frequency" TEXT,
    "planningPeriod" TEXT,
    "tone" TEXT,
    "targetAudience" TEXT,
    "industry" TEXT,
    "goals" TEXT[],
    "competitorUrls" TEXT[],
    "topicsToAvoid" TEXT[],
    "preferredLength" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_titles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TitleStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "aiGenerationContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_outlines" (
    "id" TEXT NOT NULL,
    "blogTitleId" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "seoKeywords" TEXT[],
    "metaDescription" TEXT,
    "suggestedImages" TEXT[],
    "status" "OutlineStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_outlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "full_blogs" (
    "id" TEXT NOT NULL,
    "blogOutlineId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "full_blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_clerkId_idx" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_settings_organizationId_key" ON "content_settings"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "blog_titles_organizationId_status_idx" ON "blog_titles"("organizationId", "status");

-- CreateIndex
CREATE INDEX "blog_titles_scheduledDate_idx" ON "blog_titles"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "blog_outlines_blogTitleId_key" ON "blog_outlines"("blogTitleId");

-- CreateIndex
CREATE INDEX "blog_outlines_status_idx" ON "blog_outlines"("status");

-- CreateIndex
CREATE UNIQUE INDEX "full_blogs_blogOutlineId_key" ON "full_blogs"("blogOutlineId");

-- CreateIndex
CREATE INDEX "full_blogs_status_idx" ON "full_blogs"("status");

-- CreateIndex
CREATE INDEX "full_blogs_publishedAt_idx" ON "full_blogs"("publishedAt");

-- CreateIndex
CREATE INDEX "jobs_organizationId_status_idx" ON "jobs"("organizationId", "status");

-- CreateIndex
CREATE INDEX "jobs_userId_status_idx" ON "jobs"("userId", "status");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");

-- AddForeignKey
ALTER TABLE "content_settings" ADD CONSTRAINT "content_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_titles" ADD CONSTRAINT "blog_titles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_outlines" ADD CONSTRAINT "blog_outlines_blogTitleId_fkey" FOREIGN KEY ("blogTitleId") REFERENCES "blog_titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_blogs" ADD CONSTRAINT "full_blogs_blogOutlineId_fkey" FOREIGN KEY ("blogOutlineId") REFERENCES "blog_outlines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
