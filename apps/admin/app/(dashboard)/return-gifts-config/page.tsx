import React from 'react';
import { getGiftingConfig } from './actions';
import ConfigForm from './ConfigForm';

export const metadata = {
  title: 'Return Gifts Configuration | Admin Dashboard',
};

export default async function ReturnGiftsConfigPage() {
  const config = await getGiftingConfig();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Return Gifts Configuration</h1>
        <p className="text-gray-600 mt-2">Manage the dynamic banner displayed on the Return Gifts page.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ConfigForm initialData={config} />
      </div>
    </div>
  );
}
