import * as yup from "yup";

// Authentication validation schemas
export const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
  password: yup
    .string()
    .required("Password is required")
    .min(1, "Password is required"),
});

export const registerSchema = yup.object({
  fullName: yup
    .string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters")
    .trim(),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

// Shopping list validation schemas
export const createListSchema = yup.object({
  name: yup
    .string()
    .required("List name is required")
    .min(1, "List name is required")
    .max(100, "List name must be less than 100 characters")
    .trim(),
  description: yup
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .default(""),
});

// Shopping item validation schemas
export const createItemSchema = yup.object({
  name: yup
    .string()
    .required("Item name is required")
    .min(1, "Item name is required")
    .max(100, "Item name must be less than 100 characters")
    .trim(),
  description: yup
    .string()
    .max(200, "Description must be less than 200 characters")
    .trim()
    .default(""),
  quantity: yup
    .number()
    .required("Quantity is required")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity must be less than 999")
    .integer("Quantity must be a whole number"),
  unit: yup
    .string()
    .max(20, "Unit must be less than 20 characters")
    .trim()
    .default(""),
  category: yup
    .string()
    .max(50, "Category must be less than 50 characters")
    .trim()
    .default(""),
});

// Type definitions for form data
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type CreateListFormData = yup.InferType<typeof createListSchema>;
export type CreateItemFormData = yup.InferType<typeof createItemSchema>;
