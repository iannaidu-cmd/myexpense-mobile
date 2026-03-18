export type AuthScreen = "signup" | "signin" | "forgot" | "verify";

export interface FormErrors {
  [key: string]: string;
}

export interface User {
  name: string;
  email: string;
  password: string;
}

export interface AuthFormData {
  email: string;
  password: string;
}
