-- Rate limiting genérico para protección anti-bots
CREATE TABLE "RateLimitBucket" (
    "bucketKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("bucketKey")
);
