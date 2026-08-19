import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Receipt, RotateCcw, Percent, CheckCircle2 } from "lucide-react";

import { getSystemSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Policy | OM AUTOMATION",
  description: "Read our privacy policy regarding how we collect, use, and protect your personal information.",
};

export default async function PrivacyPage() {
  const settings = await getSystemSettings();
  return (
    <div className="bg-[#faf9f5] min-h-screen text-slate-800 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Privacy Policy</span>
        </nav>
      </div>

      {/* Main Privacy Policy Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xl space-y-8 text-sm leading-relaxed">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-2">
              Last updated: July 6, 2026
            </p>
          </div>

          {/* Intro */}
          <div className="space-y-4 text-slate-600 font-body">
            <p>
              This Privacy Policy describes how {settings.store_name || "OM Automation"} (the &quot;Site&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from{" "}
              <a href="https://omautomation.in" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold hover:text-sky-800">
                omautomation.in
              </a>{" "}
              (the &quot;Site&quot;) or otherwise communicate with us regarding the Site (collectively, the &quot;Services&quot;). For purposes of this Privacy Policy, &quot;you&quot; and &quot;your&quot; means you as the user of the Services, whether you are a customer, website visitor, or another individual whose information we have collected pursuant to this Privacy Policy.
            </p>
            <p>
              Please read this Privacy Policy carefully. By using and accessing any of the Services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or access any of the Services.
            </p>
          </div>

          {/* Section: Changes to This Privacy Policy */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Changes to This Privacy Policy
            </h2>
            <p className="text-slate-600 font-body">
              We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site, update the &quot;Last updated&quot; date and take any other steps required by applicable law.
            </p>
          </div>

          {/* Section: How We Collect and Use Your Personal Information */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              How We Collect and Use Your Personal Information
            </h2>
            <p className="text-slate-600 font-body">
              To provide the Services, we collect personal information about you from a variety of sources, as set out below. The information that we collect and use varies depending on how you interact with us.
            </p>
            <p className="text-slate-600 font-body">
              In addition to the specific uses set out below, we may use information we collect about you to communicate with you, provide or improve the Services, comply with any applicable legal obligations, enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.
            </p>
          </div>

          {/* Section: What Personal Information We Collect */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              What Personal Information We Collect
            </h2>
            <p className="text-slate-600 font-body">
              The types of personal information we obtain about you depends on how you interact with our Site and use our Services. When we use the term &quot;personal information&quot;, we are referring to information that identifies, relates to, describes or can be associated with you. The following sections describe the categories and specific types of personal information we collect.
            </p>

            <div className="pl-4 border-l-2 border-slate-200 space-y-4">
              {/* Bullet 1 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900">Information We Collect Directly from You</h3>
                <p className="text-slate-600 font-body">
                  Information that you directly submit to us through our Services may include:
                </p>
                <ul className="list-disc pl-5 text-slate-600 font-body space-y-1.5">
                  <li><strong>Contact details</strong> including your name, address, phone number, and email.</li>
                  <li><strong>Order information</strong> including your name, billing address, shipping address, payment confirmation, email address, and phone number.</li>
                  <li><strong>Account information</strong> including your username, password, security questions and other information used for account security purposes.</li>
                  <li><strong>Shopping information</strong> including the items you view, put in your cart, saved into your account like loyalty points, reviews, referrals or gift cards, or purchases.</li>
                  <li><strong>Customer support information</strong> including the information you choose to include in communications with us, for example, when sending a message through the Services.</li>
                </ul>
                <p className="text-xs text-slate-500 font-body mt-1">
                  Some features of the Services may require you to directly provide us with certain information about yourself. You may elect not to provide this information, but doing so may prevent you from using or accessing these features.
                </p>
              </div>

              {/* Bullet 2 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900">Information We Collect about Your Usage</h3>
                <p className="text-slate-600 font-body">
                  We may also automatically collect certain information about your interaction with the Services (&quot;Usage Data&quot;). To do this, we may use cookies, pixels and similar technologies (&quot;Cookies&quot;). Usage Data may include information about how you access and use our Site and your account, including device information, browser information, information about your network connection, your IP address and other information regarding your interaction with the Services.
                </p>
              </div>

              {/* Bullet 3 */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900">Information We Obtain from Third Parties</h3>
                <p className="text-slate-600 font-body">
                  Finally, we may obtain information about you from third parties, including from vendors and service providers who may collect information on our behalf, such as:
                </p>
                <ul className="list-disc pl-5 text-slate-600 font-body space-y-1">
                  <li>Companies who support our Site and Services, such as Shopify.</li>
                  <li>Our payment processors, who collect payment information (e.g., bank account, credit or debit card information, billing address) to process your payment in order to fulfill your orders and provide you with products or services you have requested, in order to perform our contract with you.</li>
                </ul>
                <p className="text-slate-600 font-body">
                  When you visit our Site, open or click on emails we send you, or interact with our Services or advertisements, we, or third parties we work with, may automatically collect certain information using online tracking technologies such as pixels, web beacons, software developer kits, third-party libraries, and cookies.
                </p>
                <p className="text-xs text-slate-500 font-body">
                  Any information we obtain from third parties will be treated in accordance with this Privacy Policy. Also see the section below, Third Party Websites and Links.
                </p>
              </div>
            </div>
          </div>

          {/* Section: How We Use Your Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              How We Use Your Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">Providing Products and Services</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  We use your personal information to provide you with the Services in order to perform our contract with you, including to process your payments, fulfill your orders, to send notifications to you related to your account, purchases, returns, exchanges or other transactions, to create, maintain and otherwise manage your account, to arrange for shipping, facilitate any returns and exchanges and other features and functionalities related to your account.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">Marketing and Advertising</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  We may use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you advertisements for products or services. This may include using your personal information to better tailor the Services and advertising on our Site and other websites.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">Security and Fraud Prevention</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  We use your personal information to detect, investigate or take action regarding possible fraudulent, illegal or malicious activity. If you choose to use the Services and register an account, you are responsible for keeping your account credentials safe. We highly recommend that you do not share your username, password, or other access details with anyone else. If you believe your account has been compromised, please contact us immediately.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900">Service Improvement & Support</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  We use your personal information to provide you with customer support and improve our Services. This is in our legitimate interests in order to be responsive to you, to provide effective services to you, and to maintain our business relationship with you.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Cookies */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Cookies
            </h2>
            <p className="text-slate-600 font-body">
              Like many websites, we use Cookies on our Site. For specific information about the Cookies that we use related to powering our store with Shopify, see{" "}
              <a href="https://www.shopify.com/legal/cookies" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold hover:text-sky-800">
                https://www.shopify.com/legal/cookies
              </a>. We use Cookies to power and improve our Site and our Services (including to remember your actions and preferences), to run analytics and better understand user interaction with the Services (in our legitimate interests to administer, improve and optimize the Services). We may also permit third parties and services providers to use Cookies on our Site to better tailor the services, products and advertising on our Site and other websites.
            </p>
            <p className="text-slate-600 font-body">
              Most browsers automatically accept Cookies by default, but you can choose to set your browser to remove or reject Cookies through your browser controls. Please keep in mind that removing or blocking Cookies can negatively impact your user experience and may cause some of the Services, including certain features and general functionality, to work incorrectly or no longer be available. Additionally, blocking Cookies may not completely prevent how we share information with third parties such as our advertising partners.
            </p>
          </div>

          {/* Section: How We Disclose Personal Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              How We Disclose Personal Information
            </h2>
            <p className="text-slate-600 font-body">
              In certain circumstances, we may disclose your personal information to third parties for contract fulfillment purposes, legitimate purposes and other reasons subject to this Privacy Policy. Such circumstances may include:
            </p>
            <ul className="list-disc pl-5 text-slate-600 font-body space-y-1.5">
              <li>With vendors or other third parties who perform services on our behalf (e.g., IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).</li>
              <li>With business and marketing partners to provide services and advertise to you. Our business and marketing partners will use your information in accordance with their own privacy notices.</li>
              <li>When you direct, request us or otherwise consent to our disclosure of certain information to third parties, such as to ship you products or through your use of social media widgets or login integrations, with your consent.</li>
              <li>With our affiliates or otherwise within our corporate group, in our legitimate interests to run a successful business.</li>
              <li>In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.</li>
            </ul>

            {/* Table 1 */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl mt-4">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 font-mono font-bold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Categories of Recipients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600 font-body">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Identifiers (basic contact details, order/account info)</td>
                    <td className="px-4 py-3">Vendors and third parties (ISPs, payment processors, fulfillment, support, data analytics), Business/Marketing partners, Affiliates</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Commercial information (order history, shopping data, customer support info)</td>
                    <td className="px-4 py-3">Vendors and third parties, Business/Marketing partners, Affiliates</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Internet or other network activity (Usage Data)</td>
                    <td className="px-4 py-3">Vendors and third parties, Business/Marketing partners, Data analytics providers, Affiliates</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Geolocation data (locations from IP address or technical methods)</td>
                    <td className="px-4 py-3">Vendors and third parties, Business/Marketing partners, Affiliates</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-slate-600 font-body">
              We do not use or disclose sensitive personal information without your consent or for the purposes of inferring characteristics about you.
            </p>
            <p className="text-slate-600 font-body">
              We have &quot;sold&quot; and &quot;shared&quot; (as those terms are defined in applicable law) personal information over the preceding 12 months for the purpose of engaging in advertising and marketing activities, as follows.
            </p>

            {/* Table 2 */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl mt-2">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 font-mono font-bold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Category of Personal Information</th>
                    <th className="px-4 py-3">Categories of Recipients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600 font-body">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Identifiers (name, e-mail address and phone number)</td>
                    <td className="px-4 py-3">Business and marketing partners</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Commercial information (records of products or services purchased)</td>
                    <td className="px-4 py-3">Business and marketing partners</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Usage Data</td>
                    <td className="px-4 py-3">Business and marketing partners</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: User Generated Content */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              User Generated Content
            </h2>
            <p className="text-slate-600 font-body">
              The Services may enable you to post product reviews and other user-generated content. If you choose to submit user generated content to any public area of the Services, this content will be public and accessible by anyone.
            </p>
            <p className="text-slate-600 font-body">
              We do not control who will have access to the information that you choose to make available to others, and cannot ensure that parties who have access to such information will respect your privacy or keep it secure. We are not responsible for the privacy or security of any information that you make publicly available, or for the accuracy, use or misuse of any information that you disclose or receive from third parties.
            </p>
          </div>

          {/* Section: Third Party Websites and Links */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Third Party Websites and Links
            </h2>
            <p className="text-slate-600 font-body">
              Our Site may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies and other terms and conditions. We do not guarantee and are not responsible for the privacy or security of such sites, including the accuracy, completeness, or reliability of information found on these sites. Information you provide on public or semi-public venues, including information you share on third-party social networking platforms may also be viewable by other users of the Services and/or users of those third-party platforms without limitation as to its use by us or by a third party. Our inclusion of such links does not, by itself, imply any endorsement of the content on such platforms or of their owners or operators, except as disclosed on the Services.
            </p>
          </div>

          {/* Section: Children's Data */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Children's Data
            </h2>
            <p className="text-slate-600 font-body">
              The Services are not intended to be used by children, and we do not knowingly collect any personal information about children. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted.
            </p>
            <p className="text-slate-600 font-body">
              As of the Effective Date of this Privacy Policy, we do not have actual knowledge that we &quot;share&quot; or &quot;sell&quot; (as those terms are defined in applicable law) personal information of individuals under 16 years of age.
            </p>
          </div>

          {/* Section: Security and Retention */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Security and Retention of Your Information
            </h2>
            <p className="text-slate-600 font-body">
              Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee &quot;perfect security.&quot; In addition, any information you send to us may not be secure while in transit. We recommend that you do not use insecure channels to communicate sensitive or confidential information to us.
            </p>
            <p className="text-slate-600 font-body">
              How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide the Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.
            </p>
          </div>

          {/* Section: Your Rights */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Your Rights
            </h2>
            <p className="text-slate-600 font-body font-medium">
              Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. However, these rights are not absolute, may apply only in certain circumstances and, in certain cases, we may decline your request as permitted by law.
            </p>
            <ul className="list-disc pl-5 text-slate-600 font-body space-y-2">
              <li><strong>Right to Access / Know</strong>: You may have a right to request access to personal information that we hold about you, including details relating to the ways in which we use and share your information.</li>
              <li><strong>Right to Delete</strong>: You may have a right to request that we delete personal information we maintain about you.</li>
              <li><strong>Right to Correct</strong>: You may have a right to request that we correct inaccurate personal information we maintain about you.</li>
              <li><strong>Right of Portability</strong>: You may have a right to receive a copy of the personal information we hold about you and to request that we transfer it to a third party, in certain circumstances and with certain exceptions.</li>
              <li><strong>Restriction of Processing</strong>: You may have the right to ask us to stop or restrict our processing of personal information.</li>
              <li><strong>Withdrawal of Consent</strong>: Where we rely on consent to process your personal information, you may have the right to withdraw this consent.</li>
              <li><strong>Appeal</strong>: You may have a right to appeal our decision if we decline to process your request. You can do so by replying directly to our denial.</li>
              <li><strong>Managing Communication Preferences</strong>: We may send you promotional emails, and you may opt out of receiving these at any time by using the unsubscribe option displayed in our emails to you. If you opt out, we may still send you non-promotional emails, such as those about your account or orders that you have made.</li>
            </ul>
            <p className="text-slate-600 font-body">
              You may exercise any of these rights where indicated on our Site or by contacting us using the contact details provided below.
            </p>
            <p className="text-slate-600 font-body">
              We will not discriminate against you for exercising any of these rights. We may need to collect information from you to verify your identity, such as your email address or account information, before providing a substantive response to the request. In accordance with applicable laws, you may designate an authorized agent to make requests on your behalf to exercise your rights. Before accepting such a request from an agent, we will require that the agent provide proof you have authorized them to act on your behalf, and we may need you to verify your identity directly with us. We will respond to your request in a timely manner as required under applicable law.
            </p>
          </div>

          {/* Section: Complaints */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Complaints
            </h2>
            <p className="text-slate-600 font-body">
              If you have complaints about how we process your personal information, please contact us using the contact details provided below. If you are not satisfied with our response to your complaint, depending on where you live you may have the right to appeal our decision by contacting us using the contact details set out below, or lodge your complaint with your local data protection authority.
            </p>
          </div>

          {/* Section: International Users */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              International Users
            </h2>
            <p className="text-slate-600 font-body">
              Please note that we may transfer, store and process your personal information outside the country you live in. Your personal information is also processed by staff and third party service providers and partners in these countries.
            </p>
            <p className="text-slate-600 font-body">
              If we transfer your personal information out of Europe, we will rely on recognized data transfer mechanisms like the European Commission&apos;s Standard Contractual Clauses, or any equivalent contracts issued by the relevant competent authority of the UK, as relevant, unless the data transfer is to a country that has been determined to provide an adequate level of protection.
            </p>
          </div>

          {/* Section: Contact (Matches Screenshot 2 layout) */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Contact
            </h2>
            <p className="text-slate-600 font-body">
              Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please call or email us at{" "}
              <a href={`mailto:${settings.support_email || "omautomation2012@gmail.com"}`} className="text-sky-600 underline font-semibold hover:text-sky-800">
                {settings.support_email || "omautomation2012@gmail.com"}
              </a>{" "}
              or contact us at{" "}
              <span className="font-semibold text-slate-800">
                {settings.store_name || "OM Automation"}, Shed No : C1B-271 R - Road, Aji GIDC, Rajkot - 360002, Gujarat, India
              </span>.
            </p>
          </div>
        </div>
      </div>

      {/* Value Propositions Bar Above Footer (Matches Reference Screenshot 2) */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {/* Feature 1 */}
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

          {/* Feature 2 */}
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

          {/* Feature 3 */}
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

          {/* Feature 4 */}
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
