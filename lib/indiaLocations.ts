export interface StateData {
  name: string;
  type: "State" | "Union Territory";
  pinPrefixes: number[]; // 2-digit prefixes e.g. [36, 37, 38, 39]
  cities: string[];
}

export const COUNTRIES = [
  "India",
  "United States",
  "United Arab Emirates",
  "United Kingdom",
  "Germany",
  "Singapore",
  "Australia",
  "Canada",
  "Saudi Arabia",
  "Japan",
  "France",
  "Italy",
  "Netherlands",
  "Other",
];

export const INDIA_STATES_DATA: StateData[] = [
  {
    name: "Gujarat",
    type: "State",
    pinPrefixes: [36, 37, 38, 39],
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
      "Gandhinagar", "Junagadh", "Anand", "Navsari", "Morbi", "Bharuch",
      "Porbandar", "Vapi", "Mehsana", "Bhuj", "Valsad", "Patan", "Palanpur",
      "Godhra", "Veraval", "Surendranagar", "Gandhidham", "Ankleshwar", "Dahej",
      "Sanand", "Halol", "Kadi", "Kalol", "Botad", "Amreli", "Dahod", "Nadiad"
    ]
  },
  {
    name: "Maharashtra",
    type: "State",
    pinPrefixes: [40, 41, 42, 43, 44],
    cities: [
      "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Navi Mumbai",
      "Solapur", "Kolhapur", "Amravati", "Nanded", "Sangli", "Jalgaon", "Akola",
      "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Satara", "Ratnagiri"
    ]
  },
  {
    name: "West Bengal",
    type: "State",
    pinPrefixes: [70, 71, 72, 73, 74],
    cities: [
      "Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Barasat",
      "Bardhaman", "Malda", "Baharampur", "Kharagpur", "Shantipur", "Dankuni",
      "Haldia", "Krishnanagar", "Raiganj", "Baruipur", "South 24 Parganas",
      "North 24 Parganas", "Darjeeling", "Jalpaiguri", "Cooch Behar", "Purulia"
    ]
  },
  {
    name: "Delhi",
    type: "Union Territory",
    pinPrefixes: [11],
    cities: [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
      "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi",
      "West Delhi", "Dwarka", "Rohini", "Okhla", "Connaught Place", "Saket"
    ]
  },
  {
    name: "Karnataka",
    type: "State",
    pinPrefixes: [56, 57, 58, 59],
    cities: [
      "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi",
      "Kalaburagi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru",
      "Raichur", "Bidar", "Hosapete", "Hassan", "Gadag", "Udupi", "Peenya"
    ]
  },
  {
    name: "Tamil Nadu",
    type: "State",
    pinPrefixes: [60, 61, 62, 63, 64],
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur",
      "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet",
      "Sivakasi", "Karur", "Hosur", "Kanchipuram", "Nagercoil", "Sriperumbudur"
    ]
  },
  {
    name: "Rajasthan",
    type: "State",
    pinPrefixes: [30, 31, 32, 33, 34],
    cities: [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara",
      "Alwar", "Bharatpur", "Sikar", "Pali", "Sri Ganganagar", "Bhiwadi", "Neemrana"
    ]
  },
  {
    name: "Uttar Pradesh",
    type: "State",
    pinPrefixes: [20, 21, 22, 23, 24, 25, 26, 27, 28],
    cities: [
      "Noida", "Greater Noida", "Ghaziabad", "Lucknow", "Kanpur", "Varanasi",
      "Agra", "Prayagraj", "Meerut", "Bareilly", "Aligarh", "Moradabad",
      "Saharanpur", "Gorakhpur", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura"
    ]
  },
  {
    name: "Haryana",
    type: "State",
    pinPrefixes: [12, 13],
    cities: [
      "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak",
      "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Bahadurgarh", "Manesar"
    ]
  },
  {
    name: "Telangana",
    type: "State",
    pinPrefixes: [50],
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam",
      "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Secunderabad"
    ]
  },
  {
    name: "Andhra Pradesh",
    type: "State",
    pinPrefixes: [51, 52, 53],
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada",
      "Rajahmundry", "Kadapa", "Tirupati", "Anantapur", "Vizianagaram", "Eluru", "Ongole", "Sri City"
    ]
  },
  {
    name: "Kerala",
    type: "State",
    pinPrefixes: [67, 68, 69],
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur",
      "Alappuzha", "Kottayam", "Palakkad", "Manjeri", "Thalassery", "Ernakulam"
    ]
  },
  {
    name: "Madhya Pradesh",
    type: "State",
    pinPrefixes: [45, 46, 47, 48],
    cities: [
      "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas",
      "Satna", "Ratlam", "Rewa", "Katni", "Singrauli", "Pithampur", "Mandi Island"
    ]
  },
  {
    name: "Punjab",
    type: "State",
    pinPrefixes: [14, 15],
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
      "Hoshiarpur", "Batala", "Pathankot", "Moga", "Abohar", "Phagwara"
    ]
  },
  {
    name: "Bihar",
    type: "State",
    pinPrefixes: [80, 81, 82, 84, 85],
    cities: [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga",
      "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra"
    ]
  },
  {
    name: "Odisha",
    type: "State",
    pinPrefixes: [75, 76, 77],
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri",
      "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Paradeep", "Angul"
    ]
  },
  {
    name: "Assam",
    type: "State",
    pinPrefixes: [78],
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia",
      "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar", "Goalpara"
    ]
  },
  {
    name: "Jharkhand",
    type: "State",
    pinPrefixes: [81, 82, 83],
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar",
      "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chirkunda"
    ]
  },
  {
    name: "Chhattisgarh",
    type: "State",
    pinPrefixes: [49],
    cities: [
      "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon",
      "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari", "Mahasamund"
    ]
  },
  {
    name: "Uttarakhand",
    type: "State",
    pinPrefixes: [24, 26],
    cities: [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur",
      "Rishikesh", "Pantnagar", "SIDCUL", "Kotdwar", "Nainital"
    ]
  },
  {
    name: "Himachal Pradesh",
    type: "State",
    pinPrefixes: [17],
    cities: [
      "Shimla", "Dharamshala", "Solan", "Mandi", "Baddi", "Palampur",
      "Nahan", "Paonta Sahib", "Kullu", "Una", "Hamirpur", "Bilaspur"
    ]
  },
  {
    name: "Goa",
    type: "State",
    pinPrefixes: [40],
    cities: [
      "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim",
      "Curchorem", "Cuncolim", "Verna Industrial Estate"
    ]
  },
  {
    name: "Chandigarh",
    type: "Union Territory",
    pinPrefixes: [16],
    cities: ["Chandigarh", "Manimajra", "Industrial Area Phase 1", "Industrial Area Phase 2"]
  },
  {
    name: "Jammu and Kashmir",
    type: "Union Territory",
    pinPrefixes: [18, 19],
    cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Sopore", "Samba"]
  },
  {
    name: "Ladakh",
    type: "Union Territory",
    pinPrefixes: [19],
    cities: ["Leh", "Kargil", "Diskit", "Nubra", "Zanskar"]
  },
  {
    name: "Puducherry",
    type: "Union Territory",
    pinPrefixes: [60],
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Ozhukarai"]
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    type: "Union Territory",
    pinPrefixes: [36, 39],
    cities: ["Daman", "Diu", "Silvassa", "Naroli", "Dadra"]
  },
  {
    name: "Andaman and Nicobar Islands",
    type: "Union Territory",
    pinPrefixes: [74],
    cities: ["Port Blair", "Garacharma", "Bambooflat", "Diglipur", "Mayabunder"]
  },
  {
    name: "Tripura",
    type: "State",
    pinPrefixes: [79],
    cities: ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Khowai"]
  },
  {
    name: "Meghalaya",
    type: "State",
    pinPrefixes: [79],
    cities: ["Shillong", "Tura", "Nongpoh", "Jowai", "Baghmara", "Williamnagar"]
  },
  {
    name: "Manipur",
    type: "State",
    pinPrefixes: [79],
    cities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul"]
  },
  {
    name: "Nagaland",
    type: "State",
    pinPrefixes: [79],
    cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto"]
  },
  {
    name: "Arunachal Pradesh",
    type: "State",
    pinPrefixes: [79],
    cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Namsai"]
  },
  {
    name: "Mizoram",
    type: "State",
    pinPrefixes: [79],
    cities: ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha"]
  },
  {
    name: "Sikkim",
    type: "State",
    pinPrefixes: [73],
    cities: ["Gangtok", "Namchi", "Geyzing", "Mangan", "Rangpo", "Jorethang"]
  },
  {
    name: "Lakshadweep",
    type: "Union Territory",
    pinPrefixes: [68],
    cities: ["Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy"]
  }
];

/**
 * Get list of all Indian States and Union Territories sorted alphabetically
 */
export function getIndiaStates(): string[] {
  const uniqueNames = Array.from(new Set(INDIA_STATES_DATA.map((s) => s.name)));
  return uniqueNames.sort((a, b) => a.localeCompare(b));
}

/**
 * Get cities for a given Indian State / UT
 */
export function getCitiesForState(stateName: string): string[] {
  if (!stateName) return [];
  const state = INDIA_STATES_DATA.find((s) => s.name.toLowerCase() === stateName.trim().toLowerCase());
  return state ? state.cities : [];
}

/**
 * Find probable State / UT name for a 6-digit Indian PIN code
 */
export function getSuggestedStateForPincode(pincode: string): string | null {
  const cleanPin = pincode.replace(/\D/g, "");
  if (cleanPin.length < 2) return null;
  const prefix = Number(cleanPin.slice(0, 2));

  const matched = INDIA_STATES_DATA.find((s) => s.pinPrefixes.includes(prefix));
  return matched ? matched.name : null;
}

/**
 * Check if a PIN code prefix matches the selected State in India
 */
export function validatePincodeWithState(
  pincode: string,
  selectedState: string
): { isValid: boolean; expectedState?: string; message?: string } {
  const cleanPin = pincode.replace(/\D/g, "");
  if (cleanPin.length !== 6) {
    return { isValid: false, message: "PIN code must be exactly 6 digits." };
  }

  if (!selectedState || selectedState.trim() === "") {
    return { isValid: true };
  }

  const prefix = Number(cleanPin.slice(0, 2));
  const currentState = INDIA_STATES_DATA.find(
    (s) => s.name.toLowerCase() === selectedState.trim().toLowerCase()
  );

  if (!currentState) {
    return { isValid: true }; // Custom or unlisted state
  }

  if (currentState.pinPrefixes.includes(prefix)) {
    return { isValid: true };
  }

  // Find what state this PIN actually belongs to
  const actualState = INDIA_STATES_DATA.find((s) => s.pinPrefixes.includes(prefix));

  if (actualState) {
    return {
      isValid: false,
      expectedState: actualState.name,
      message: `PIN ${cleanPin} typically belongs to ${actualState.name}, but State is selected as ${currentState.name}.`,
    };
  }

  return { isValid: true };
}
