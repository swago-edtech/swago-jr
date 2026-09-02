export interface CartItem {
  productId: string | number;
  quantity: number;
  price: number;
  name: string;
  image: string;
  images?: string[];
  addedAt?: Date;
}

type CartInput = {
  productId?: string | number;
  id?: string | number;
  _id?: { toString?: () => string };
  quantity?: number;
  qty?: number;
  price?: number;
  unitPrice?: number;
  name?: string;
  image?: string;
  images?: string[];
  addedAt?: string | Date;
};

export function normalizeCartItem(item: CartInput): CartItem | null {
  const id = item?.productId || item?.id || item?._id?.toString?.() || null;
  const qty = item?.quantity ?? item?.qty ?? 0;
  const price = item?.price ?? item?.unitPrice ?? 0;
  const name = item?.name || "";
  const image = item?.image || item?.images?.[0] || "";

  if (!id || qty <= 0) return null;

  return {
    productId: String(id),
    quantity: Number(qty),
    price: Number(price),
    name,
    image,
    images: item?.images || (image ? [image] : []),
    addedAt: item?.addedAt ? new Date(item.addedAt) : new Date(),
  };
}

export function mergeCartItems(dbCart: CartInput[], localCart: CartInput[]): CartItem[] {
  const dbItems = dbCart.map(normalizeCartItem).filter(Boolean) as CartItem[];
  const localItems = localCart.map(normalizeCartItem).filter(Boolean) as CartItem[];
  const merged = new Map<string, CartItem>();

  for (const item of dbItems) {
    merged.set(item.productId.toString(), { ...item });
  }

  for (const item of localItems) {
    const key = item.productId.toString();
    const existing = merged.get(key);
    if (!existing || item.quantity > existing.quantity) {
      merged.set(key, { ...item });
    }
  }

  return Array.from(merged.values()).filter((i) => i && i.productId && i.quantity > 0);
}
