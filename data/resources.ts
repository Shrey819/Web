import { ResourceArticle } from "@/types";

export const RESOURCES: ResourceArticle[] = [
  {
    id: "res-01",
    slug: "vfd-selection-guide-2026",
    title: "How to Select the Right Variable Frequency Drive for High-Torque Machinery",
    category: "Buying Guide",
    author: "Dr. Marcus Vance",
    authorRole: "Lead Automation Architect",
    date: "July 14, 2026",
    readTime: "7 min read",
    summary: "A comprehensive technical breakdown on calculating overload capacity, ambient derating, EMC filtering, and fieldbus protocols when specifying VFDs for heavy conveyors and pumps.",
    content: [
      "Selecting the correct Variable Frequency Drive (VFD) is critical for preventing machine downtime, overheating, and nuisance tripping. In industrial automation applications, VFDs do far more than control motor speed—they act as protective barriers for motors and intelligence hubs for factory networks.",
      "When sizing a VFD, never rely solely on motor horsepower (HP). Always compare motor full load amps (FLA) against the continuous current rating of the drive, especially for heavy-duty starting torques.",
      "Consider ambient temperature derating: for every 5°C above 40°C in an electrical enclosure, most drives require a 2% to 3% current derate unless active cooling or heat pipe exchangers are integrated.",
      "Protocol choice is equally essential. Ensure your VFD natively supports your PLC communication standard (PROFINET for Siemens TIA Portal, EtherNet/IP for Allen-Bradley Studio 5000, EtherCAT for Omron Sysmac)."
    ],
    image: "/images/resources/vfd-guide.svg",
    tags: ["VFD", "Motors", "ABB", "Siemens", "Energy Efficiency"]
  },
  {
    id: "res-02",
    slug: "profinet-vs-ethercat-vs-ethernet-ip",
    title: "PROFINET vs EtherCAT vs EtherNet/IP: Industrial Ethernet Protocol Comparison",
    category: "Technical Guide",
    author: "Elena Rostova",
    authorRole: "Senior Systems Engineer",
    date: "June 28, 2026",
    readTime: "10 min read",
    summary: "An in-depth analysis of jitter, cycle times, topology flexibility, and deterministic synchronization across the top 3 real-time industrial Ethernet networks.",
    content: [
      "Modern industrial control architectures rely heavily on deterministic real-time communication networks to synchronize high-speed motion, robot joints, and remote I/O blocks.",
      "EtherCAT utilizes processing-on-the-fly where master frames pass through slave nodes with sub-microsecond latency, making it the preferred protocol for multi-axis servo synchronization.",
      "PROFINET IRT (Isochronous Real-Time) provides strict bandwidth reservation for Motion Control while allowing standard TCP/IP traffic on the same physical line via Siemens TIA hardware.",
      "EtherNet/IP leverages CIP (Common Industrial Protocol) over standard IEEE Ethernet switches, offering maximum flexibility and seamless enterprise IT/OT integration."
    ],
    image: "/images/resources/ethernet-guide.svg",
    tags: ["PLC", "PROFINET", "EtherCAT", "EtherNet/IP", "Networking"]
  },
  {
    id: "res-03",
    slug: "io-link-smart-sensing-revolution",
    title: "Unlocking Predictive Maintenance with IO-Link Smart Sensors",
    category: "Automation Trends",
    author: "Hans Gruber",
    authorRole: "Industrial IoT Specialist",
    date: "May 19, 2026",
    readTime: "6 min read",
    summary: "How point-to-point IO-Link digital communication provides real-time sensor operating temperature, lens contamination alerts, and dynamic parameterization.",
    content: [
      "Traditional 24V discrete sensors only transmit binary 0 or 1 signals—providing no insight into impending failure or gradual alignment degradation.",
      "IO-Link transforms standard 3-wire sensors into intelligent edge devices capable of sending internal temperature statistics, operating hours, and optic surface contamination flags directly to your SCADA/Cloud dashboard.",
      "Re-commissioning broken sensors takes seconds: when a technician replaces an IO-Link sensor, the master automatically downloads the saved configuration parameters without requiring a laptop connection."
    ],
    image: "/images/resources/iolink-guide.svg",
    tags: ["Sensors", "IO-Link", "Industry 4.0", "Predictive Maintenance"]
  }
];
