import { z } from "zod";
import { validateBody } from "./validateAuthRequest.js";

const trimmedText = (max) => z.string().trim().max(max).optional().default("");

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .refine((value) => value === "" || z.email().safeParse(value).success, "Email khong dung dinh dang")
  .optional()
  .default("");

const stringList = z
  .array(z.string().trim().min(1).max(80))
  .max(20)
  .optional()
  .default([]);

const socialLinkList = z
  .array(z.string().trim().min(1).max(180))
  .max(3)
  .optional()
  .default([]);

export const updateDashboardProfileSchema = z
  .object({
    displayName: trimmedText(80),
    bio: trimmedText(500),
    pronouns: trimmedText(40),
    company: trimmedText(120),
    location: trimmedText(120),
    showLocalTime: z.boolean().optional().default(false),
    contactEmail: optionalEmail,
    websiteUrl: trimmedText(180),
    facebookUrl: trimmedText(180),
    socialLinks: socialLinkList,
    headline: trimmedText(120),
    coreStack: stringList,
    experience: trimmedText(1200),
    topContribution: trimmedText(180),
  })
  .strict();

export const validateDashboardProfile = validateBody(updateDashboardProfileSchema);
