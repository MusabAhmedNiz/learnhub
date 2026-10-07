import { z } from "zod";
import { isMediaKey } from "./media";

export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Price must be a valid non-negative number",
    }),
  productId: z.string().min(1, "Polar product ID is required"),
  image: z.string().refine((v) => isMediaKey(v, "image"), "Upload a thumbnail"),
  video: z.string().refine((v) => isMediaKey(v, "video"), "Upload a video"),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type CourseValues = z.infer<typeof courseSchema>;

export const courseApiSchema = courseSchema.extend({ price: z.number().finite().nonnegative() });
