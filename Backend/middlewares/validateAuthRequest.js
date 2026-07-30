import { z } from "zod";

const usernameSchema = z
  .string({ error: "Username bat buoc la chuoi" })
  .trim()
  .min(3, "Username can toi thieu 3 ky tu")
  .max(32, "Username toi da 32 ky tu")
  .regex(/^[A-Za-z0-9._-]+$/, "Username chi gom chu, so, dau cham, gach duoi hoac gach ngang")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string({ error: "Password bat buoc la chuoi" })
  .min(8, "Password can toi thieu 8 ky tu")
  .max(128, "Password toi da 128 ky tu");

const nameSchema = z
  .string({ error: "Ten bat buoc la chuoi" })
  .trim()
  .min(1, "Ten khong duoc de trong")
  .max(50, "Ten toi da 50 ky tu");

export const signUpSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    username: usernameSchema,
    email: z
      .string({ error: "Email bat buoc la chuoi" })
      .trim()
      .email("Email khong dung dinh dang")
      .max(254, "Email toi da 254 ky tu")
      .transform((value) => value.toLowerCase()),
    password: passwordSchema,
  })
  .strict();

export const signInSchema = z
  .object({
    username: usernameSchema,
    password: z
      .string({ error: "Password bat buoc la chuoi" })
      .min(1, "Password khong duoc de trong")
      .max(128, "Password toi da 128 ky tu"),
  })
  .strict();

export const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Du lieu dau vao khong hop le",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    });
  }

  req.body = parsed.data;
  next();
};
