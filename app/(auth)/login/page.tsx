import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
export default function LoginPage() { return <Suspense><AuthCard expectedRole="proprietaire" /></Suspense>; }
