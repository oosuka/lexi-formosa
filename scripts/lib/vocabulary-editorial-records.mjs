import { z } from 'zod';

const editorialOverrideSchema = z.object({
  trad: z.string().min(1),
  status: z.enum(['approved', 'pending', 'rejected']),
  canonicalJa: z.string().min(1).optional(),
  acceptedJa: z.array(z.string().min(1)).optional(),
  senseTag: z.string().min(1).optional(),
  reviewNotes: z.string().optional(),
  reviewReason: z.string().optional(),
  reviewedAt: z.string().optional(),
  reviewSourceConfidence: z.enum(['high', 'medium', 'low']).optional(),
});

export const parseEditorialOverrides = (rawValue) =>
  z.array(editorialOverrideSchema).parse(rawValue);

export const mergeEditorialState = ({ candidate, override }) => ({
  ...candidate,
  status: override?.status ?? candidate.status ?? 'approved',
  canonicalJa: override?.canonicalJa ?? candidate.canonicalJa ?? null,
  acceptedJa: override?.acceptedJa ?? candidate.acceptedJa ?? [],
  senseTag: override?.senseTag ?? candidate.senseTag ?? null,
});
