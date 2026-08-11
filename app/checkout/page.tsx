import { getSystemSettings } from "@/lib/settings";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage() {
  const settings = await getSystemSettings();
  return <CheckoutClient settings={settings} />;
}
