import { Suspense } from 'react';
import LoginForm from './LoginForm';

function Loading() {
  // You can make a more elaborate loading skeleton if you want
  return <p>Loading login form...</p>;
}

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
      <Suspense fallback={<Loading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}