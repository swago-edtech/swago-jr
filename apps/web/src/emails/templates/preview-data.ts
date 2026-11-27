import type { OrderConfirmationEmailProps } from "./OrderConfirmation";
import type { AdminOrderEmailProps } from "./OrderAdminNotification";
import type { LowStockAlertProps } from "./LowStockAlert";
import type { LotteryWinnerProps } from "./LotteryWinner";
import type { SwagoMoneyDepositProps } from "./SwagoMoneyDeposit";

export const orderConfirmationPreview: OrderConfirmationEmailProps = {
  name: "Priya Sharma",
  orderNumber: "SW-260326-ABCD",
  orderDate: "26/03/2026, 10:30:00 am",
  email: "priya@example.com",
  items: [
    {
      name: "Junior Chef Baking Set of 5",
      quantity: 1,
      price: 1999,
      image:
        "https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq",
    },
    {
      name: "Confidence Journal",
      quantity: 2,
      price: 499,
    },
  ],
  subtotal: "2997.00",
  discount: "100.00",
  swagoMoneyRedeemed: "50.00",
  shipping: "0.00",
  totalAmount: "2847.00",
  paymentMethod: "Online (Razorpay)",
  paymentStatus: "Successful",
  address: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  couponCode: "SAVE100",
};

export const orderConfirmationCodPreview: OrderConfirmationEmailProps = {
  ...orderConfirmationPreview,
  orderNumber: "SW-260326-COD1",
  paymentMethod: "Cash on Delivery",
  paymentStatus: "Pending",
  totalAmount: "2997.00",
  discount: "0.00",
  swagoMoneyRedeemed: "0.00",
};

export const orderConfirmationIntlPreview: OrderConfirmationEmailProps = {
  ...orderConfirmationPreview,
  orderNumber: "SW-260326-UAE1",
  currencySymbol: "د.إ",
  shippingLabel: "International Shipping",
  shipping: "35.00",
  subtotal: "120.00",
  discount: "0.00",
  swagoMoneyRedeemed: "0.00",
  totalAmount: "155.00",
  items: [
    { name: "Junior Chef Baking Set of 5", quantity: 1, price: 120 },
  ],
};

export const orderAdminPreview: AdminOrderEmailProps = {
  orderNumber: "SW-260326-ABCD",
  orderDate: "26/03/2026, 10:30:00 am",
  customerName: "Priya Sharma",
  customerEmail: "priya@example.com",
  customerPhone: "+919876543210",
  shippingMethod: "Standard Shipping",
  paymentMethod: "Online (Razorpay)",
  totalAmount: "2847.00",
  subtotal: "2997.00",
  discount: "100.00",
  swagoMoneyRedeemed: "50.00",
  shippingFee: "0.00",
  couponCode: "SAVE100",
  items: [
    { name: "Junior Chef Baking Set of 5", quantity: 1, price: "1999.00" },
    { name: "Confidence Journal", quantity: 2, price: "499.00" },
  ],
  adminUrl: "https://admin.swagojr.com/orders/preview",
};

export const orderAdminIntlPreview: AdminOrderEmailProps = {
  ...orderAdminPreview,
  orderNumber: "SW-260326-UAE1",
  shippingMethod: "International Shipping",
  shippingFee: "35.00",
  subtotal: "120.00",
  discount: "0.00",
  swagoMoneyRedeemed: "0.00",
  totalAmount: "155.00",
  currencySymbol: "د.إ",
  countryCode: "AE",
  items: [{ name: "Junior Chef Baking Set of 5", quantity: 1, price: "120.00" }],
};

export const lowStockPreview: LowStockAlertProps = {
  items: [
    {
      name: "Baking Tool Kit BOM",
      sku: "BOM-BAKE-01",
      currentStock: 3,
      lowStockThreshold: 10,
      unit: "pcs",
    },
    {
      name: "Journal Cover Sheet",
      sku: "BOM-JRN-02",
      currentStock: 0,
      lowStockThreshold: 25,
      unit: "pcs",
    },
  ],
};

export const lotteryWinnerPreview: LotteryWinnerProps = {
  name: "Aarav",
  amount: 500,
  ticketCode: "LTRY-88421",
};

export const swagoMoneyDepositPreview: SwagoMoneyDepositProps = {
  name: "Priya Sharma",
  amount: 200,
  reason: "Customer goodwill credit",
};
