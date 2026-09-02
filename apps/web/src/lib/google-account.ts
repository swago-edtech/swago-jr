import { User } from "@swago/database";
import type { GoogleSignInProfile } from "@swago/database";
import { mergeCartItems, normalizeCartItem, type CartItem } from "./cart-merge";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findOrLinkGoogleUser(
  profile: GoogleSignInProfile,
  localCart: CartItem[] = []
) {
  const email = profile.email.toLowerCase();
  const emailMatch = new RegExp(`^${escapeRegex(email)}$`, "i");

  let user = await User.findOne({ googleId: profile.googleId });

  if (!user) {
    user = await User.findOne({ email: emailMatch });
  }

  if (!user) {
    user = await User.create({
      email,
      name: profile.name || undefined,
      googleId: profile.googleId,
      authMethod: "google",
      avatar: profile.picture,
      cart: localCart,
    });
    return { user, isNewUser: true };
  }

  user.googleId = user.googleId || profile.googleId;
  if (!user.email) user.email = email;
  if (!user.name && profile.name) user.name = profile.name;
  if (!user.avatar && profile.picture) user.avatar = profile.picture;
  if (!user.authMethod) user.authMethod = user.phone ? "phone" : "google";

  if (localCart.length > 0) {
    user.cart = mergeCartItems(user.cart || [], localCart);
  }

  await user.save();
  return { user, isNewUser: false };
}

export function cartFromUnknown(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCartItem).filter(Boolean) as CartItem[];
}
