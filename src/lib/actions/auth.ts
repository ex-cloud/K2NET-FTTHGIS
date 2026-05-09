"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function authenticate(
  prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  try {
    const org = formData.get("org")?.toString() || "system";
    const callbackUrl = formData.get("callbackUrl")?.toString();
    const redirectTo = callbackUrl || ((org === "system") ? "/system/organizations" : `/dashboard`);

    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      org: org,
      redirectTo: redirectTo,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah." };
        default:
          return { error: "Terjadi kesalahan. Silakan coba lagi." };
      }
    }
    throw error; // Re-throw for redirect
  }
}
