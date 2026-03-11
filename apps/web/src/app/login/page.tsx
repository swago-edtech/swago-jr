import { Suspense } from 'react';
import LoginForm from './LoginForm';

function Loading() {
  // You can make a more elaborate loading skeleton if you want
  return <p>Loading login form...</p>;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white overflow-x-hidden">
      <Suspense fallback={<Loading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}