import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Receipt, RotateCcw, Percent, CheckCircle2 } from "lucide-react";
import { getSystemSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Legal Notice & User Agreement | OM AUTOMATION",
  description: "Read the legal notice, user agreement, and terms governing the use of OM AUTOMATION platform.",
};

export default async function LegalNoticePage() {
  const settings = await getSystemSettings();
  const supportEmail = settings.support_email || "omautomation2012@gmail.com";
  const supportPhone = settings.support_phone || "+91 90993 92066";
  const storeName = settings.store_name || "OM Automation";

  return (
    <div className="bg-[#faf9f5] min-h-screen text-slate-800 font-sans">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Legal Notice</span>
        </nav>
      </div>

      {/* Content Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xl space-y-8 text-sm leading-relaxed">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Legal Notice & User Agreement
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-2">
              Last updated: July 6, 2026
            </p>
          </div>

          <div className="space-y-6 text-slate-600 font-body">
            <p className="font-semibold text-slate-900">
              Please read the following user agreement carefully before placing an order or using our services.
            </p>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">User Agreement</h3>
              <p className="mt-2">
                The following demonstrates User Agreement (here-in-after referred to as an &quot;Agreement&quot;) between {storeName} (hereinafter referred to as the &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) and the users of the website (&quot;You&quot;, &quot;Your&quot;, &quot;User&quot;/&quot;Users&quot;).
              </p>
              <p className="mt-2">
                Before You subscribe to and/or begin participating in or using this website, the Company believes that user(s) have fully read, understood and accepted the Agreement. If You do not agree to or wish to be bound by this Agreement, You may not access or otherwise use the website.
              </p>
              <p className="mt-2">
                The website under the domain name &quot;omautomation.in&quot; is owned and managed by the Company. Any and all use of this Platform is subject to, and constitutes acknowledgment and acceptance of, the following terms and conditions.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Amendment to User(s) Agreement</h3>
              <p className="mt-2">
                We may change, modify, amend, or update this agreement from time to time without any prior notification to user(s) and the amended and restated terms and conditions of use shall be effective immediately on posting. You are advised to regularly check for any amendments or updates. Your continuous use of the Platform will signify Your acceptance of the changed terms.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">User(s) Eligibility</h3>
              <p className="mt-2">
                User(s) means any individual or business entity/organization that legally operates in India or in other countries, uses and has the right to use the services provided by the Platform. Our services are available only to those individuals or companies who can form legally binding contracts under the applicable law i.e. Indian Contract Act, 1872. As a minor if You wish to purchase or sell an item on the Platform, such purchase or sale may be made by Your legal guardian or parents who have registered as users of the Platform.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Registration and Your Account</h3>
              <p className="mt-2">
                User(s) can become a Registered User(s) by filling an on-line registration form on the Platform by giving desired information (name, contact information, details of its business, etc.). The Company will establish an account (&quot;Account&quot;) for the user(s) upon registration. You are responsible for maintaining the confidentiality of Your User ID and Password, and for all activities that occur under Your Account.
              </p>
              <p className="mt-2">
                It is mandatory to submit any of the below mentioned documents or relevant identification numbers for B2B commercial access:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>GSTIN Registration (Goods and Services Tax Identification Number); or</li>
                <li>License/registration certificate/membership certificate/registration under Shops and Establishment Act, issued by a Government Authority/Body; or</li>
                <li>Permits/licenses for undertaking retail trade from Government Authorities/Local Self Government Bodies; or</li>
                <li>Certificate of incorporation or registration as a society or registration as a public trust.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Charges</h3>
              <p className="mt-2">
                Membership on the Platform is free for buyers. We do not charge any fee for browsing and buying on the Platform. We reserve the right to change our Fee Policy from time to time.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Use of Platform</h3>
              <p className="mt-2">
                You understand and agree that the Company provides hosting services, catalogs, listing details, and logistical coordination. The actual contract for sale is directly between the respective supplier/seller and You.
              </p>
              <p className="mt-2">
                As per the Consumer Protection (e-commerce) Rules, 2020:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Sellers are required to provide their legal name, principal geographic address, mobile number, email address, customer care details, and GSTIN/PAN details.</li>
                <li>Sellers must ensure descriptions, images, and other content corresponding to goods are accurate.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Cancellation</h3>
              <p className="mt-2">
                The right to cancel any order for any reason is reserved with the Company/seller of the goods. Possible reasons for cancellation include, but are not limited to: potentially fraudulent orders, incorrect pricing due to market volatility, non-payment of orders, non-availability of product in stock, or non-serviceable address pin codes.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Shipping Outside India</h3>
              <p className="mt-2">
                Our Platform presently does not entertain orders requiring international shipping. If You are an international customer, please email us Your requirements at{" "}
                <a href={`mailto:${supportEmail}`} className="text-sky-600 underline font-semibold hover:text-sky-800">
                  {supportEmail}
                </a>.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Our Business Hours</h3>
              <p className="mt-2">
                Our helpline hours are 9:00 AM to 7:00 PM Monday to Saturday at{" "}
                <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="font-semibold text-slate-900 hover:underline">
                  {supportPhone}
                </a>.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Order Delivery Time</h3>
              <p className="mt-2">
                If material is in stock with the respective seller, the shipment is dispatched in 3-4 business days on receipt of payment. For Special orders or out of stock items, the delivery time shall be around 2 weeks. If the seller is not able to fulfill Your order, we will refund Your entire amount within 15 business days.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase">Grievance Redressal</h3>
              <p className="mt-2">
                In accordance with Information Technology Act 2000 and rules made there under and the Consumer Protection (E-Commerce) Rules, 2020, the name and contact details of the Grievance Officer are provided below:
              </p>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-3 space-y-1 text-xs sm:text-sm">
                <p><strong>Name:</strong> Arun Jain</p>
                <p><strong>Designation:</strong> Grievance Officer</p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${supportEmail}`} className="text-sky-600 hover:underline font-semibold">
                    {supportEmail}
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="text-slate-900 hover:underline font-semibold">
                    {supportPhone}
                  </a>{" "}
                  (Timings: 10:00 AM to 6:30 PM)
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                The Grievance Officer shall attempt to acknowledge your grievances/complaints within 48 hours of receiving it, and resolve the complaint within 1 month.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Value Props */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              GST Input Credit
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              Get GST invoice and save up to 18% on your purchases.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              7-Day Return
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              If you receive defective Product, return it within 7 Days and Get 100% refund.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <Percent className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              Lowest Prices
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              We are offering Products at Lowest Prices in the Industry.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              Highest Quality
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              We strive to provide best quality product.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
