# KidProfile Migration to Single-Account Model
**Date:** May 1, 2026

## Overview
This document outlines the changes made during the architectural transition to a single-account-owner model. The `KidProfile` dependency has been completely removed across the stack, and all profile-level data (ambassador status, earnings, rewards, order history) has been flattened directly into the `User` model.

## Functionality Impact & Flow Changes

### 1. Registration & Onboarding
- **Old Flow:** Parent registers → Redirected to `/profile/kids/new` to create a child profile → Dashboard.
- **New Flow:** Parent registers/logs in → Automatically provisions Ambassador data on the `User` object → Redirects directly to `/profile`.
- **Impact:** Faster onboarding. The intermediate "create kid profile" and "select kid profile" steps have been completely removed.

### 2. Ambassador Program & Brain Gym
- **Old Flow:** Required selecting a `selectedKidProfile` from local storage and passing `kidProfileId` in API requests for reel uploads and Brain Gym tasks.
- **New Flow:** The authenticated session is the sole source of truth. APIs read the `userId` directly. 
- **Impact:** Components like `ReelUploadForm` and `BrainGymQuiz` are now simplified.

### 3. Lottery Code Redemption
- **Old Flow:** Users had to select which kid profile to apply a lottery ticket to via a dropdown.
- **New Flow:** Tickets are automatically applied to the primary `User` account.
- **Impact:** Simplifies the `ClaimPhase` and `SelectionPhase` flows. The `/lottery-code/my-tickets` page now queries the `User` directly.

### 4. Checkout & Wallet (Swago Money)
- **Old Flow:** Swago Money was deducted from the specific `KidProfile` referenced during checkout.
- **New Flow:** Swago Money is deducted directly from `User.ambassador.swagoMoney`.
- **Impact:** Unified wallet balance.

### 5. Admin Panel
- **Old Flow:** Admin tables relied heavily on Mongoose `.populate()` to fetch parent details from `KidProfile`.
- **New Flow:** Admin pages (Reel Submissions, Lottery Draws, User Challenges) query the `User` model directly, significantly improving database read performance.

---

## Do We Need a Database Migration?
**Yes, absolutely.** 

Since you are using MongoDB, your database is currently holding legacy data in the `KidProfiles` collection. The updated application code is now looking for this data inside the `User` collection. If you deploy this code without running a data migration, existing users will appear to have **0 Swago Money**, **no ambassador status**, and **no lottery tickets**.

### What the Migration Needs to Do:
We need a script to iterate over all existing `KidProfile` documents and copy their data into the `User` document that owns them. Specifically:
1. Copy `ambassador` object (swagoMoney, entryChallenge, brainGym status).
2. Copy `lotteryTickets` array.
3. Move basic details like `name`, `age`, `grade`, and `avatarColor` to the User object.
4. Ensure references like `LotteryCode.usedBy` and `ProductCode.usedBy` are safely updated, though since they now map to the `User` ID, this is straightforward.

*(I will create this script for you in the `scripts/` directory).*
