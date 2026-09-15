import "server-only";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth-checks";
import { getCustomerProfile } from "@/lib/dal/user";
import { getOrdersForCustomer } from "@/lib/dal/order";
import { getAddressesForUser } from "@/lib/dal/address";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  let user;
  try {
    user = await requireCustomer();
  } catch {
    redirect("/login?callbackUrl=%2Fprofile");
  }

  // Authoritatively pre-fetch customer data directly from PostgreSQL DAL
  const [profile, initialOrders, initialAddresses] = await Promise.all([
    getCustomerProfile(user.id),
    getOrdersForCustomer(user.id),
    getAddressesForUser(user.id),
  ]);

  return (
    <ProfileClient
      serverUser={profile || user}
      initialOrders={initialOrders}
      initialAddresses={initialAddresses}
    />
  );
}
