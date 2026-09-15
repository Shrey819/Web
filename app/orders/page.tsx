import "server-only";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth-checks";
import { getOrdersForCustomer } from "@/lib/dal/order";
import { OrdersClient } from "@/components/orders/OrdersClient";

export default async function OrdersPage() {
  let user;
  try {
    user = await requireCustomer();
  } catch {
    redirect("/login?callbackUrl=%2Forders");
  }

  const orders = await getOrdersForCustomer(user.id);

  return <OrdersClient initialOrders={orders} />;
}
