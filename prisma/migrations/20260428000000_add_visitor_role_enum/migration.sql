-- Add VISITANTE role to enum (must run in its own migration before any usage)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VISITANTE';
