"use client";

import { useState, useEffect } from "react";
import { submitInquiryFormAction, submitPromotionalNewsletterAction } from "@/app/actions/forms";
import { useToastStore } from "@/store/useToastStore";
import { Send, Mail, ArrowRight, CheckCircle2, Phone, MapPin, Building } from "lucide-react";

export function ContactForms() {
  const { addToast } = useToastStore();
  const [supportEmail, setSupportEmail] = useState("omautomation2012@gmail.com");
  const [supportPhone, setSupportPhone] = useState("+91 90993 92066");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.support_email) setSupportEmail(data.support_email);
        if (data?.support_phone) setSupportPhone(data.support_phone);
      })
      .catch(() => {});
  }, []);

  // Form 1 State (Inquiry Form)
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState("General Inquiry");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Form 2 State (Promotional Newsletter Form)
  const [newsEmail, setNewsEmail] = useState("");
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);
  const [newsSuccess, setNewsSuccess] = useState(false);

  // Handle Form 1 Submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiryName.trim()) {
      addToast("error", "Validation Error", "Please enter your name.");
      return;
    }
    if (!inquiryEmail.trim() || !inquiryEmail.includes("@")) {
      addToast("error", "Validation Error", "Please enter a valid email address.");
      return;
    }
    if (!inquiryMessage.trim()) {
      addToast("error", "Validation Error", "Please enter your message.");
      return;
    }

    setIsSubmittingInquiry(true);

    try {
      const res = await submitInquiryFormAction({
        name: inquiryName,
        email: inquiryEmail,
        category: inquiryCategory,
        message: inquiryMessage,
      });

      if (res.success) {
        setInquirySuccess(true);
        addToast(
          "success",
          "Inquiry Received",
          "Thank you for contacting us! Our team will respond shortly."
        );
        setInquiryName("");
        setInquiryEmail("");
        setInquiryMessage("");
      } else {
        addToast("error", "Submission Error", res.error || "Failed to send message.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An error occurred.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Handle Form 2 Submission
  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsEmail.trim() || !newsEmail.includes("@")) {
      addToast("error", "Validation Error", "Please enter a valid email address.");
      return;
    }

    setIsSubmittingNews(true);

    try {
      const res = await submitPromotionalNewsletterAction(newsEmail);

      if (res.success) {
        setNewsSuccess(true);
        addToast(
          "success",
          "Subscribed Successfully",
          "You have been subscribed to our newsletter for exclusive offers!"
        );
        setNewsEmail("");
      } else {
        addToast("error", "Subscription Failed", res.error || "Could not subscribe.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An error occurred.");
    } finally {
      setIsSubmittingNews(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Business Contact Information Header (Matches Reference Screenshot 1) */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Business Contact Information
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
          Feel free to fill out the form below to get in touch with us OR email us directly at:{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-amber-600 underline font-semibold hover:text-amber-800"
          >
            {supportEmail}
          </a>{" "}
          (NOTE: Please include your order number in message) OR call us directly at{" "}
          <a
            href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            className="text-amber-600 underline font-semibold hover:text-amber-800"
          >
            {supportPhone}
          </a>
          .
        </p>

        <p className="text-xs text-slate-500 font-mono font-medium pt-1">
          <strong className="text-slate-800 font-bold">Office Address:</strong> Om Automation, Plot No. 12, GIDC Phase 2, Rajkot, Gujarat - 360002 | Branch: Dahisar, Mumbai - 400068
        </p>
      </div>

      {/* FORM 1: "Drop us an email" Inquiry Form Container (Matches Reference Screenshot 2) */}
      <div className="max-w-3xl mx-auto bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-12 shadow-sm">
        <div className="text-center mb-8">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            Drop us an email
          </h3>
        </div>

        {inquirySuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-lg">Thank You! Message Sent</h4>
            <p className="text-xs text-emerald-700">
              We have received your inquiry. Our engineering support team will reach out to you within 24 hours.
            </p>
            <button
              onClick={() => setInquirySuccess(false)}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold transition-all"
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} className="space-y-6">
            {/* Name & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-sm font-mono"
                />
              </div>
            </div>

            {/* Topic Select Dropdown */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-2">
                How can we help?
              </label>
              <select
                value={inquiryCategory}
                onChange={(e) => setInquiryCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm font-mono cursor-pointer"
              >
                <option value="General Inquiry">Option 1: General Inquiry</option>
                <option value="Technical Support">Option 2: Technical Support & Manuals</option>
                <option value="Order Status">Option 3: Order Tracking & Status</option>
                <option value="Product Quote">Option 4: RFQ / Product Quote</option>
                <option value="Wholesale Bulk">Option 5: Wholesale & Bulk Deal</option>
              </select>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 mb-2">
                Message *
              </label>
              <textarea
                rows={5}
                required
                placeholder="Write your message details here..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-sm font-mono"
              />
            </div>

            {/* Send Button (Matches Reference Screenshot 3 Orange Pill Button) */}
            <div>
              <button
                type="submit"
                disabled={isSubmittingInquiry}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 font-mono"
              >
                {isSubmittingInquiry ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FORM 2: "Sign up to our Newsletter" Promotional Form (Matches Reference Screenshot 3 & 4) */}
      <div className="max-w-2xl mx-auto text-center space-y-4 py-8">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Sign up to our Newsletter
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 font-body">
          Be the first to know about new collections and exclusive offers.
        </p>

        {newsSuccess ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-3 rounded-full text-xs font-mono font-bold inline-block">
            ✓ Subscribed to promotional updates!
          </div>
        ) : (
          <form onSubmit={handleNewsSubmit} className="relative max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Your email"
              value={newsEmail}
              onChange={(e) => setNewsEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-full pl-6 pr-14 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-sm font-mono"
            />
            <button
              type="submit"
              disabled={isSubmittingNews}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all disabled:opacity-50"
              aria-label="Subscribe to newsletter"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
