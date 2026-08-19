import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | OM AUTOMATION",
  description:
    "Established in 2012 in Rajkot, Gujarat, Om Automation is a leading manufacturer of precision CNC machines, industrial controllers, and automation hardware.",
};

export default function AboutPage() {
  const leaders = [
    {
      firstName: "HIREN",
      lastName: "PADIA",
      name: "HIREN PADIA",
      role: "Co-Founder & Technical Director",
      image: "/images/about/hiren-padia.png",
    },
    {
      firstName: "DHARMESH",
      lastName: "PAMBHAR",
      name: "DHARMESH PAMBHAR",
      role: "Co-Founder & Operations Head",
      image: "/images/about/dharmesh-pambhar.png",
    },
    {
      firstName: "MAHESH",
      lastName: "PAMBHAR",
      name: "MAHESH PAMBHAR",
      role: "Co-Founder & R&D Lead",
      image: "/images/about/mahesh-pambhar.png",
    },
  ];

  const qualities = [
    {
      title: "Qualitative Product Range",
      icon: "/images/about/qualitative-range.png",
      desc: "Precision-engineered hardware built for industrial performance.",
    },
    {
      title: "Stringent Quality Control",
      icon: "/images/about/quality-control.png",
      desc: "Rigorously tested in-house to guarantee 100% defect-free operation.",
    },
    {
      title: "Economical Prices",
      icon: "/images/about/economical-prices.png",
      desc: "Direct-from-manufacturer pricing without intermediary markups.",
    },
    {
      title: "Wide Distribution Network",
      icon: "/images/about/distribution-network.png",
      desc: "Serving domestic markets across India and strategic hubs globally.",
    },
    {
      title: "Swift Delivery",
      icon: "/images/about/swift-delivery.png",
      desc: "Rapid order processing and insured express shipping dispatch.",
    },
  ];

  const certificates = [
    {
      title: "Quality Management System",
      sub: "ISO 9001:2015 Certified",
      image: "/images/about/iso-certificate.jpg",
    },
    {
      title: "Certificate of Registration",
      sub: "Progressive International Certification",
      image: "/images/about/registration-certificate.jpg",
    },
    {
      title: "Zed Bronze Certificate",
      sub: "MSME Sustainable ZED Scheme",
      image: "/images/about/zed-bronze-certificate.jpg",
    },
    {
      title: "Compliance Document",
      sub: "CE & International Standards",
      image: "/images/about/compliance-document.jpg",
    },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* 1. Hero Header Banner */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-16 sm:py-24 text-center border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 space-y-3 relative z-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight font-heading">
            About <span className="text-amber-400">Us</span>
          </h1>
          <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono text-slate-300">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <span className="text-slate-500 font-bold">&gt;</span>
            <span className="text-amber-400 font-bold">About Us</span>
          </nav>
        </div>
      </section>

      {/* 2. Company Intro & Story with Founder Portraits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Text Content Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 block mb-2">
                A B O U T &nbsp; U S
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight font-heading">
                We are <span className="italic font-serif font-normal">Leading</span>{" "}
                <span className="text-amber-500">machine manufacturer company</span>
              </h2>
            </div>

            <div className="border-l-4 border-amber-400 pl-4 py-1">
              <p className="font-serif italic font-extrabold text-amber-600 text-lg sm:text-xl">
                “Teamwork Is Our Strategy To Constantly Improve.”
              </p>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed font-body">
              <p>
                Established in 2012 and headquartered in Rajkot, Gujarat, India, Om Automation has established itself as a leading manufacturer of CNC machines tailored for the gold jewelry industry. Specializing in a wide array of advanced technologies, Om Automation designs and manufactures precision machinery including hollow ball CNC machines, CNC bangle machines, lightweight jewelry manufacturing from sheet metals, CNC hollow pipe designing, and CNC wire faceting systems.
              </p>
              <p>
                With a commitment to excellence and innovation, Om Automation operates with all essential departments in-house, encompassing mechanical, electrical, and software engineering. This integrated approach ensures meticulous quality control and enables the company to deliver customized solutions that meet the specific requirements of jewelry manufacturers.
              </p>
              <p>
                Recognizing the need for expansion and enhanced customer support, Om Automation inaugurated a branch office in Dahisar, Mumbai in 2017. This strategic move has strengthened the company’s presence in a crucial market, facilitating better service delivery to a diverse clientele across India.
              </p>
              <p>
                In addition to serving the domestic market, Om Automation caters to a global clientele, providing both machines and comprehensive service solutions worldwide. The company has established strategic partnerships with service providers in key international markets including Dubai, Turkey, Israel, Malaysia, and Iran. These collaborations reinforce Om Automation’s commitment to delivering reliable and efficient service on a global scale, further solidifying its reputation as a trusted partner in the CNC machinery sector for the jewelry industry.
              </p>
            </div>
          </div>

          {/* Leadership Team Column - Authentic Founder Portraits (Smaller scale & non-bold last name) */}
          <div className="lg:col-span-5 space-y-8 flex flex-col items-center">
            {leaders.map((leader, idx) => (
              <div key={idx} className="relative w-full max-w-[270px] group">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-b-[3.5rem] rounded-t-2xl bg-amber-400/10">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-full object-contain object-bottom group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                {/* Overlay Name Badge Box matching user reference screenshot */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "-10px",
                    backgroundColor: "#373435",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 700,
                    fontStyle: "normal",
                    lineHeight: "1.2em",
                    letterSpacing: "0.1em",
                    color: "#ffffff",
                    textAlign: "center",
                  }}
                  className="shadow-2xl text-base sm:text-lg md:text-[20px] z-10 uppercase"
                >
                  {leader.firstName}
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: "14px",
                      letterSpacing: "0.12em",
                      display: "block",
                      marginTop: "3px",
                      color: "#f1f5f9",
                    }}
                    className="font-normal uppercase"
                  >
                    {leader.lastName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Mission & Vision Section */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
              O U R &nbsp; M I S S I O N
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 font-heading">
              Mission <span className="text-amber-500">& Vision</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {/* Mission Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 p-3 flex items-center justify-center border border-slate-700">
                  <img
                    src="/images/about/our-mission.png"
                    alt="Our Mission Icon"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-black font-heading text-white">
                  Our Mission
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-body">
                  To create Solutions for customers to enhance productivity, reliability, reduce wastage, create lasting value, and empower modern precision manufacturing across global markets.
                </p>
              </div>
            </div>

            {/* Vision Card */}
            <div className="bg-white text-slate-900 rounded-3xl p-8 border-2 border-amber-400 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 p-3 flex items-center justify-center border border-amber-200">
                  <img
                    src="/images/about/our-vision.png"
                    alt="Our Vision Icon"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-black font-heading text-slate-900">
                  Our Vision
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-body">
                  To achieve total customer satisfaction. To provide Growth opportunity for our workforce, partners, and community through technological innovation and uncompromised quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why We Are / Our Qualities */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200/60">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
            W H Y &nbsp; W E &nbsp; A R E
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 font-heading">
            Our Qualities
          </h2>
        </div>

        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Top Row: 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {qualities.slice(0, 3).map((q, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl hover:border-amber-400 transition-all text-center flex flex-col items-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-50/50 p-3 flex items-center justify-center">
                  <img
                    src={q.icon}
                    alt={q.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h4 className="font-extrabold text-base text-slate-900 font-heading">
                  {q.title}
                </h4>
                <p className="text-xs text-slate-600 font-body leading-relaxed">
                  {q.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Row: 2 Cards Centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {qualities.slice(3, 5).map((q, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md hover:shadow-xl hover:border-amber-400 transition-all text-center flex flex-col items-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-50/50 p-3 flex items-center justify-center">
                  <img
                    src={q.icon}
                    alt={q.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h4 className="font-extrabold text-base text-slate-900 font-heading">
                  {q.title}
                </h4>
                <p className="text-xs text-slate-600 font-body leading-relaxed">
                  {q.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Certificates & Awards Section */}
      <section className="py-16 sm:py-24 bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
            O U R &nbsp; A C H I E V E M E N T S
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 font-heading">
            Certificates <span className="text-amber-500">& Awards</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {certificates.map((cert, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-3xl p-4 border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-white border border-slate-200 mb-4 shadow-inner">
                <img
                  src={cert.image}
                  alt={cert.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="text-center space-y-1 py-1">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 font-heading">
                  {cert.title}
                </h4>
                <p className="text-xs text-slate-500 font-mono">{cert.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
