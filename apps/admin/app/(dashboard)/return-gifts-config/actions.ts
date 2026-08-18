'use server';

import { connectDB, GiftingPageConfig } from '@swago/database';
import { revalidatePath } from 'next/cache';

export async function getGiftingConfig() {
  try {
    await connectDB();
    let config = await GiftingPageConfig.findOne({ isSingleton: true }).lean();
    if (!config) {
      config = await GiftingPageConfig.create({
        bannerDesktopUrl: '',
        bannerMobileUrl: '',
        isSingleton: true
      });
    }
    return JSON.parse(JSON.stringify(config));
  } catch (error) {
    console.error('Failed to fetch gifting config:', error);
    return null;
  }
}

export async function updateGiftingConfig(formData: FormData) {
  try {
    const bannerDesktopUrl = formData.get('bannerDesktopUrl') as string;
    const bannerMobileUrl = formData.get('bannerMobileUrl') as string;

    await connectDB();
    await GiftingPageConfig.findOneAndUpdate(
      { isSingleton: true },
      { bannerDesktopUrl, bannerMobileUrl },
      { upsert: true, new: true }
    );
    
    // Attempt to revalidate paths if needed
    revalidatePath('/return-gifts-config');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update gifting config:', error);
    return { success: false, error: 'Failed to update configuration' };
  }
}
