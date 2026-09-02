"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext, USER_EVENTS } from "@/context/SharedContext";
import { GOOGLE_OAUTH_CART_KEY } from "@/components/GoogleSignInButton";

const STORAGE_KEY = "swago_cart";

function getProductId(item: { productId?: string | number; _id?: string; id?: number }) {
  return item.productId || item._id || item.id?.toString() || "";
}

function ContinueGoogleLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, setUser } = useSharedContext();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finish = async () => {
      const rawRedirect = searchParams.get("redirect");
      const redirectUrl = rawRedirect?.startsWith("/kids") ? "/profile" : rawRedirect || "/";

      let sourceCart = cart;
      if (typeof window !== "undefined") {
        try {
          const pending = sessionStorage.getItem(GOOGLE_OAUTH_CART_KEY);
          const raw = pending || localStorage.getItem(STORAGE_KEY);
          if (raw) sourceCart = JSON.parse(raw);
          sessionStorage.removeItem(GOOGLE_OAUTH_CART_KEY);
        } catch {
          // keep whatever cart is already in context
        }
      }

      const localCart = sourceCart
        .map((item) => ({
          productId: getProductId(item),
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.images?.[0] || "/images/placeholder.png",
        }))
        .filter((item) => item.productId && item.quantity > 0);

      try {
        const res = await fetch("/api/auth/google/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localCart }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUser(data.user);
          window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGIN));
          router.replace(redirectUrl);
          return;
        }
      } catch (error) {
        console.error("Google continue failed:", error);
      }

      router.replace(`/login?error=google_failed${rawRedirect ? `&redirect=${encodeURIComponent(rawRedirect)}` : ""}`);
    };

    void finish();
  }, [cart, router, searchParams, setUser]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Finishing Google sign-in...</p>
        <p className="text-xs text-slate-400 mt-1">Taking you back to checkout</p>
      </div>
    </div>
  );
}

export default function GoogleContinuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
          Finishing Google sign-in...
        </div>
      }
    >
      <ContinueGoogleLogin />
    </Suspense>
  );
}
