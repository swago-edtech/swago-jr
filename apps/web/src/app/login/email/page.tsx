import { Suspense } from "react";
import EmailLoginForm from "../EmailLoginForm";

function Loading() {
  return <p>Loading email login form...</p>;
}

export default function EmailLoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
      <Suspense fallback={<Loading />}>
        <EmailLoginForm />
      </Suspense>
    </div>
  );
}
