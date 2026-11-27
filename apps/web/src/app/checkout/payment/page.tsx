import { redirect } from "next/navigation";

/**
 * Retired two-step payment page. Nothing in the storefront links here any more
 * (it relied on a sessionStorage hand-off that is no longer written), and it
 * sent free-text states that the address validator now rejects. All checkout
 * flows go through /checkout, which uses the shared AddressFields + server
 * pricing. Old bookmarks land on the live checkout.
 */
export default function LegacyPaymentPage() {
  redirect("/checkout");
}
