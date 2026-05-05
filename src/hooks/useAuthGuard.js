import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/utils/auth";

/**
 * Redirects to /login if no valid auth state is found in localStorage.
 * Returns `checking` = true while the auth state is being verified
 * (prevents a flash of protected content on first render).
 */
export function useAuthGuard(skip = false) {
  const router = useRouter();
  const [checking, setChecking] = useState(!skip);

  useEffect(() => {
    if (skip) return;
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [skip, router]);

  return { checking };
}
