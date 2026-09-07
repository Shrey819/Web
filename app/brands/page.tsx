import { Metadata } from "next";
import { getGlobalBrands } from "@/app/actions/productManagement";
import { BrandsClient } from "@/components/brands/BrandsClient";

export const metadata: Metadata = {
  title: "Our Brands | OM Automation",
  description:
    "Explore world-class industrial automation brands we partner with: HIWIN, Miki Pulley, Liming, K.H, STÖBER, Atlanta, Elesa+Ganter, Aadarsh, THK, Siemens, and more.",
};

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brandsRes = await getGlobalBrands();
  const brands = brandsRes.success ? brandsRes.brands : [];

  return <BrandsClient brands={brands} />;
}
