"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isRegister];
}
