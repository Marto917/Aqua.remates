-- CreateTable
CREATE TABLE "VerificationEmailThrottle" (
    "email" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "sendsInWindow" INTEGER NOT NULL DEFAULT 1,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationEmailThrottle_pkey" PRIMARY KEY ("email")
);
