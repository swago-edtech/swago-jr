import { Suspense } from 'react';
import LoginForm from './LoginForm';

function Loading() {
  // You can make a more elaborate loading skeleton if you want
  return <p>Loading login form...</p>;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-gradient-to-br from-white via-purple-50 to-indigo-50">
      <Suspense fallback={<Loading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}