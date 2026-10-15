import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Fuze Drive",
  description: "Request a password reset link for your Fuze Drive account.",
  alternates: {
    canonical: "https://fuzedrive.tech/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
