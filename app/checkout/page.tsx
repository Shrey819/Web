import { getPublicSettings } from "@/lib/settings";
import { CheckoutClient, PublicCheckoutSettings } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage() {
  const publicSettings = await getPublicSettings();

  const checkoutSettings: PublicCheckoutSettings = {
    cod_enabled: publicSettings.cod_enabled,
    min_order_value: publicSettings.min_order_value,
    maintenance_mode: publicSettings.maintenance_mode,
  };

  return <CheckoutClient settings={checkoutSettings} />;
}

