"use client";

export const GOOGLE_OAUTH_CART_KEY = "swago_oauth_cart";

type GoogleSignInButtonProps = {
  redirectUrl?: string | null;
  className?: string;
};

export default function GoogleSignInButton({
  redirectUrl,
  className = "",
}: GoogleSignInButtonProps) {
  const href = `/api/auth/google${
    redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""
  }`;

  const handleClick = () => {
    try {
      const cart = localStorage.getItem("swago_cart");
      if (cart) sessionStorage.setItem(GOOGLE_OAUTH_CART_KEY, cart);
    } catch {
      // ignore storage failures; login still proceeds
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`w-full inline-flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl text-sm transition-all shadow-sm ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
      Continue with Google
    </a>
  );
}

export function GoogleAuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">or</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
