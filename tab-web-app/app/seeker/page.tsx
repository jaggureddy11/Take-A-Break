"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, ShieldCheck, Check, Send, AlertTriangle, ExternalLink, Wifi, Utensils, Info } from "lucide-react";

declare const google: any;

interface ChatMessage {
  sender: "seeker" | "dude";
  text: string;
  time: string;
}

interface VerificationReport {
  wifiSpeed: number;
  foodRating: string;
  photo: string;
  location: string;
}

interface Bounty {
  id: string;
  area: string;
  locationName: string;
  lat: number;
  lng: number;
  budgetMin: number;
  budgetMax: number;
  depositMin: number;
  depositMax: number;
  roomType: string;
  genderPref: string;
  foodPref?: string | null;
  preferences: string[];
  notes: string;
  status: "pending" | "visiting" | "submitted" | "completed" | "disputed";
  seekerName: string;
  dudeName: string | null;
  escrowState: "secured" | "released" | "disputed";
  createdAt: string;
  chat: ChatMessage[];
  report: VerificationReport | null;
}

const DEFAULT_BOUNTIES: Bounty[] = [
  {
    id: "B-8831",
    area: "Indiranagar",
    locationName: "100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038",
    lat: 12.9719,
    lng: 77.6412,
    budgetMin: 10000,
    budgetMax: 15000,
    depositMin: 1,
    depositMax: 3,
    roomType: "Single Room",
    genderPref: "Any",
    preferences: ["wifi", "food", "washroom"],
    notes: "Please check if the PG Mess has north-Indian food options, and run speed test near the window.",
    status: "visiting",
    seekerName: "Amit R.",
    dudeName: "Rahul K.",
    escrowState: "secured",
    createdAt: "2026-05-30T10:30:00Z",
    chat: [
      { sender: "dude", text: "Hi Amit, I've accepted your bounty. Heading to the Indiranagar double-story PG near Metro Station now.", time: "10:35 AM" },
      { sender: "seeker", text: "Thanks Rahul! Please pay extra attention to the room ventilation.", time: "10:38 AM" },
      { sender: "dude", text: "Got it, just reached the PG. Entering the single room on the second floor.", time: "10:55 AM" }
    ],
    report: null
  },
  {
    id: "B-2144",
    area: "Koramangala",
    locationName: "Koramangala 4th Block, Bengaluru, Karnataka 560034",
    lat: 12.9352,
    lng: 77.6244,
    budgetMin: 8000,
    budgetMax: 12000,
    depositMin: 2,
    depositMax: 2,
    roomType: "Double Sharing",
    genderPref: "Any",
    preferences: ["wifi", "washroom"],
    notes: "Must be walking distance to St. John's Hospital. Power backup is critical.",
    status: "pending",
    seekerName: "Neha S.",
    dudeName: null,
    escrowState: "secured",
    createdAt: "2026-05-30T11:45:00Z",
    chat: [],
    report: null
  },
  {
    id: "B-9982",
    area: "HSR Layout",
    locationName: "Sector 2, HSR Layout, Bengaluru, Karnataka 560102",
    lat: 12.9105,
    lng: 77.6450,
    budgetMin: 12000,
    budgetMax: 18000,
    depositMin: 2,
    depositMax: 4,
    roomType: "Single Room",
    genderPref: "Any",
    preferences: ["wifi", "food", "washroom", "restriction"],
    notes: "Looking for premium space in Sector 2. Need food quality check.",
    status: "submitted",
    seekerName: "Vikram M.",
    dudeName: "Priya L.",
    escrowState: "secured",
    createdAt: "2026-05-30T09:15:00Z",
    chat: [
      { sender: "dude", text: "Hey Vikram, done with the detailed walk. Sending the verification report now.", time: "09:40 AM" },
      { sender: "dude", text: "The food is surprisingly good. Daily menu includes paneer, dal, and standard roti.", time: "09:42 AM" }
    ],
    report: {
      wifiSpeed: 105,
      foodRating: "5",
      photo: "room_premium.jpg",
      location: "https://maps.google.com/?q=Sector+2+HSR+Layout+Bengaluru"
    }
  },
  {
    id: "B-1024",
    area: "Whitefield",
    locationName: "Whitefield, Bengaluru, Karnataka 560066",
    lat: 12.9698,
    lng: 77.7499,
    budgetMin: 10000,
    budgetMax: 16000,
    depositMin: 1,
    depositMax: 2,
    roomType: "Single Room",
    genderPref: "Any",
    preferences: ["wifi"],
    notes: "Check if the flatmates are quiet, and verify mobile reception inside the room.",
    status: "completed",
    seekerName: "Rohan D.",
    dudeName: "Rahul K.",
    escrowState: "released",
    createdAt: "2026-05-29T14:20:00Z",
    chat: [
      { sender: "dude", text: "Mobile signal is full 5G (Airtel and Jio).", time: "02:35 PM" },
      { sender: "seeker", text: "Awesome! Looks perfect. Releasing payment now.", time: "02:40 PM" }
    ],
    report: {
      wifiSpeed: 180,
      foodRating: "4",
      photo: "room_double.jpg",
      location: "https://maps.google.com/?q=Whitefield+Bengaluru"
    }
  }
];

const MOCK_LOCATIONS = [
  { name: "Indiranagar, Bengaluru", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6244 },
  { name: "HSR Layout, Bengaluru", lat: 12.9105, lng: 77.6450 },
  { name: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7499 },
  { name: "Hebbal, Bengaluru", lat: 13.0354, lng: 77.5988 },
  { name: "Yeshwanthpur, Bengaluru", lat: 13.0250, lng: 77.5462 },
  { name: "MG Road, Bengaluru", lat: 12.9738, lng: 77.6119 }
];

function SeekerDashboardContent() {
  const searchParams = useSearchParams();
  const areaParam = searchParams.get("area");
  const idParam = searchParams.get("id");

  // State
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [toastText, setToastText] = useState<string | null>(null);

  // Form State
  const [locationInput, setLocationInput] = useState("");
  const [latVal, setLatVal] = useState(12.9716);
  const [lngVal, setLngVal] = useState(77.5946);
  const [budgetMin, setBudgetMin] = useState(8000);
  const [budgetMax, setBudgetMax] = useState(15000);
  const [depositMin, setDepositMin] = useState(1);
  const [depositMax, setDepositMax] = useState(3);
  const [roomType, setRoomType] = useState("Single Room");
  const [genderPref, setGenderPref] = useState("Any");
  const [foodPref, setFoodPref] = useState("Veg & Non-Veg");
  const [specialNotes, setSpecialNotes] = useState("");
  const [chatMessageInput, setChatMessageInput] = useState("");

  // Checkboxes
  const [prefWifi, setPrefWifi] = useState(true);
  const [prefFood, setPrefFood] = useState(true);
  const [prefWashroom, setPrefWashroom] = useState(true);
  const [prefCurfew, setPrefCurfew] = useState(false);
  const [prefAc, setPrefAc] = useState(false);
  const [prefVentilation, setPrefVentilation] = useState(false);

  // Map elements refs
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const googleMarker = useRef<any>(null);
  const autocomplete = useRef<any>(null);
  const isDraggingMock = useRef(false);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3000);
  };

  // 1. Sync Database on Load
  useEffect(() => {
    const data = localStorage.getItem("tab_db");
    let loadedBounties: Bounty[] = [];
    if (data) {
      try {
        loadedBounties = JSON.parse(data);
        setBounties(loadedBounties);
      } catch (e) {
        loadedBounties = DEFAULT_BOUNTIES;
        setBounties(loadedBounties);
      }
    } else {
      loadedBounties = DEFAULT_BOUNTIES;
      localStorage.setItem("tab_db", JSON.stringify(DEFAULT_BOUNTIES));
      setBounties(DEFAULT_BOUNTIES);
    }

    // Auto-select active parameter or previous item
    if (idParam) {
      const bExists = loadedBounties.some(b => b.id === idParam);
      if (bExists) {
        setSelectedBountyId(idParam);
        localStorage.setItem("tab_selected_bounty_id", idParam);
      }
    } else {
      const savedBountyId = localStorage.getItem("tab_selected_bounty_id");
      if (savedBountyId) {
        const bExists = loadedBounties.some(b => b.id === savedBountyId);
        if (bExists) {
          setSelectedBountyId(savedBountyId);
        }
      }
    }

    // Prefill from map node query params
    if (areaParam) {
      setLocationInput(`${areaParam}, Bengaluru`);
      const matched = MOCK_LOCATIONS.find(loc => loc.name.toLowerCase().includes(areaParam.toLowerCase()));
      if (matched) {
        setLatVal(matched.lat);
        setLngVal(matched.lng);
      }
    }
  }, [areaParam, idParam]);

  // 2. Initialize Map (Google Maps Script or Mock Fallback)
  useEffect(() => {
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (mapsKey && mapsKey !== "placeholder-anon-key" && !window.google) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleMap();
      script.onerror = () => initMockMap();
      document.head.appendChild(script);
    } else if (window.google) {
      initGoogleMap();
    } else {
      initMockMap();
    }
  }, [wizardStep]);

  const initGoogleMap = () => {
    if (!mapRef.current || !window.google) return;
    mapRef.current.innerHTML = "";

    const latLng = { lat: latVal, lng: lngVal };
    try {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: latLng,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true
      });

      googleMarker.current = new google.maps.Marker({
        position: latLng,
        map: googleMap.current,
        draggable: true,
        title: "Drag to refine location"
      });

      const searchInput = document.getElementById("bounty-location-input") as HTMLInputElement;
      if (searchInput) {
        autocomplete.current = new google.maps.places.Autocomplete(searchInput, {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "name", "formatted_address"]
        });

        autocomplete.current.bindTo("bounds", googleMap.current);
        autocomplete.current.addListener("place_changed", () => {
          const place = autocomplete.current.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          const loc = place.geometry.location;
          googleMap.current.setCenter(loc);
          googleMap.current.setZoom(16);
          googleMarker.current.setPosition(loc);

          setLatVal(loc.lat());
          setLngVal(loc.lng());
          setLocationInput(place.formatted_address || place.name);
        });
      }

      googleMarker.current.addListener("dragend", () => {
        const pos = googleMarker.current.getPosition();
        setLatVal(pos.lat());
        setLngVal(pos.lng());

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
          if (status === "OK" && results[0]) {
            setLocationInput(results[0].formatted_address);
          }
        });
      });
    } catch (e) {
      initMockMap();
    }
  };

  const initMockMap = () => {
    if (!mapRef.current) return;
    // Render offline SVG map elements inside mapRef
    mapRef.current.innerHTML = `
      <div style="position: absolute; inset: 0; background: #121212; display: flex; flex-direction: column;">
        <svg id="mock-picker-svg" viewBox="0 0 400 180" style="width:100%; height:100%; cursor: crosshair;">
          <defs>
            <pattern id="mock-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mock-grid)"/>
          
          <circle cx="200" cy="90" r="60" fill="none" stroke="rgba(204, 90, 55, 0.08)" stroke-width="2" stroke-dasharray="4 4"/>
          <circle cx="200" cy="90" r="30" fill="none" stroke="rgba(204, 90, 55, 0.08)" stroke-width="2" stroke-dasharray="4 4"/>
          
          <text x="310" y="80" fill="rgba(255,255,255,0.25)" font-size="8px" font-family="Plus Jakarta Sans" text-anchor="middle">Whitefield</text>
          <text x="230" y="135" fill="rgba(255,255,255,0.25)" font-size="8px" font-family="Plus Jakarta Sans" text-anchor="middle">Koramangala</text>
          <text x="240" y="65" fill="rgba(255,255,255,0.25)" font-size="8px" font-family="Plus Jakarta Sans" text-anchor="middle">Indiranagar</text>
          <text x="290" y="150" fill="rgba(255,255,255,0.25)" font-size="8px" font-family="Plus Jakarta Sans" text-anchor="middle">HSR Layout</text>
          <text x="140" y="40" fill="rgba(255,255,255,0.25)" font-size="8px" font-family="Plus Jakarta Sans" text-anchor="middle">Hebbal</text>
          <text x="100" y="105" fill="rgba(255,255,255,0.25)" font-size="8px" font-family="Plus Jakarta Sans" text-anchor="middle">Yeshwanthpur</text>
          
          <g id="mock-picker-pin" transform="translate(200, 90)" style="cursor: grab;">
            <circle cx="0" cy="0" r="10" fill="rgba(204, 90, 55, 0.25)"></circle>
            <path d="M 0 0 C -4 -4 -6 -10 0 -16 C 6 -10 4 -4 0 0 Z" fill="#cc5a37" stroke="#ffffff" stroke-width="1"/>
            <circle cx="0" cy="-11" r="2.5" fill="#ffffff"/>
          </g>
        </svg>
        <div style="background: rgba(15,15,15,0.9); padding: 5px 10px; font-size: 9px; color: #868e96; display: flex; justify-content: space-between; border-top: 1px solid #e9ecef; font-family: monospace;">
          <span>Lat: <strong id="mock-lat-display" style="color: #cc5a37;">${latVal.toFixed(4)}</strong>, Lng: <strong id="mock-lng-display" style="color: #cc5a37;">${lngVal.toFixed(4)}</strong></span>
          <span style="color: #cc5a37; font-weight: bold; font-family: 'Plus Jakarta Sans'; font-size: 8px; text-transform: uppercase;">Mock Map Fallback</span>
        </div>
      </div>
    `;

    const svg = document.getElementById("mock-picker-svg");
    const pin = document.getElementById("mock-picker-pin");
    const latDisplay = document.getElementById("mock-lat-display");
    const lngDisplay = document.getElementById("mock-lng-display");
    if (!svg || !pin || !latDisplay || !lngDisplay) return;

    const svgToCoords = (x: number, y: number) => {
      const latMin = 12.88, latMax = 13.06, lngMin = 77.48, lngMax = 77.78;
      const lat = latMax - (y / 180) * (latMax - latMin);
      const lng = lngMin + (x / 400) * (lngMax - lngMin);
      return { lat, lng };
    };

    const coordsToSvg = (lat: number, lng: number) => {
      const latMin = 12.88, latMax = 13.06, lngMin = 77.48, lngMax = 77.78;
      const x = ((lng - lngMin) / (lngMax - lngMin)) * 400;
      const y = ((latMax - lat) / (latMax - latMin)) * 180;
      return { x, y };
    };

    const initPos = coordsToSvg(latVal, lngVal);
    pin.setAttribute("transform", `translate(${initPos.x}, ${initPos.y})`);

    const updatePin = (x: number, y: number) => {
      pin.setAttribute("transform", `translate(${x}, ${y})`);
      const { lat, lng } = svgToCoords(x, y);
      latDisplay.textContent = lat.toFixed(4);
      lngDisplay.textContent = lng.toFixed(4);
      setLatVal(lat);
      setLngVal(lng);

      // Auto geocode closest mock name
      let closest = MOCK_LOCATIONS[0];
      let minDist = Infinity;
      MOCK_LOCATIONS.forEach(loc => {
        const d = Math.hypot(loc.lat - lat, loc.lng - lng);
        if (d < minDist) {
          minDist = d;
          closest = loc;
        }
      });

      if (minDist < 0.02) {
        setLocationInput(`Near ${closest.name.split(",")[0]}, Bengaluru (Adjusted Pin)`);
      } else {
        setLocationInput(`Custom Pin at (${lat.toFixed(4)}, ${lng.toFixed(4)}), Bengaluru`);
      }
    };

    svg.addEventListener("mousedown", (e: any) => {
      isDraggingMock.current = true;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(0, Math.min(400, ((e.clientX - rect.left) / rect.width) * 400));
      const y = Math.max(0, Math.min(180, ((e.clientY - rect.top) / rect.height) * 180));
      updatePin(x, y);
    });

    window.addEventListener("mouseup", () => {
      isDraggingMock.current = false;
    });
  };

  // 3. Geolocation Auto-Pin Function
  const pinMapToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const uLat = position.coords.latitude;
          const uLng = position.coords.longitude;
          setLatVal(uLat);
          setLngVal(uLng);

          if (googleMap.current && googleMarker.current) {
            const latLng = { lat: uLat, lng: uLng };
            googleMap.current.setCenter(latLng);
            googleMap.current.setZoom(15);
            googleMarker.current.setPosition(latLng);
            google.maps.event.trigger(googleMap.current, 'resize');
          }

          if (window.google && google.maps.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat: uLat, lng: uLng } }, (results, status) => {
              if (status === "OK" && results[0]) {
                setLocationInput(results[0].formatted_address);
              } else {
                setLocationInput(`Current Location (${uLat.toFixed(4)}, ${uLng.toFixed(4)})`);
              }
            });
          } else {
            // SVG Fallback Geolocation Render
            const latDisplay = document.getElementById("mock-lat-display");
            const lngDisplay = document.getElementById("mock-lng-display");
            const pin = document.getElementById("mock-picker-pin");
            if (latDisplay && lngDisplay && pin) {
              latDisplay.textContent = uLat.toFixed(4);
              lngDisplay.textContent = uLng.toFixed(4);
              const latMin = 12.88, latMax = 13.06, lngMin = 77.48, lngMax = 77.78;
              const x = ((uLng - lngMin) / (lngMax - lngMin)) * 400;
              const y = ((latMax - uLat) / (latMax - latMin)) * 180;
              pin.setAttribute("transform", `translate(${Math.max(0, Math.min(400, x))}, ${Math.max(0, Math.min(180, y))})`);
            }
            setLocationInput(`Current Location (${uLat.toFixed(4)}, ${uLng.toFixed(4)})`);
          }
          showToast("📍 Pinned to your current location!");
        },
        () => {
          showToast("⚠️ Location permission denied or timeout.");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      showToast("⚠️ Geolocation is not supported by your browser.");
    }
  };

  // 4. Form Submit
  const handlePostBounty = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationInput) {
      showToast("⚠️ Preferred location is required.");
      return;
    }

    if (budgetMin > budgetMax) {
      showToast("⚠️ Minimum budget exceeds maximum budget.");
      return;
    }

    const preferences = [];
    if (prefWifi) preferences.push("wifi");
    if (prefFood) preferences.push("food");
    if (prefWashroom) preferences.push("washroom");
    if (prefCurfew) preferences.push("restriction");
    if (prefAc) preferences.push("ac");
    if (prefVentilation) preferences.push("ventilation");

    const newB = {
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      area: locationInput.split(",")[0].trim() || "Bengaluru",
      locationName: locationInput,
      lat: latVal,
      lng: lngVal,
      budgetMin,
      budgetMax,
      depositMin,
      depositMax,
      roomType,
      genderPref,
      foodPref: prefFood ? foodPref : null,
      preferences,
      notes: specialNotes,
      status: "pending" as const,
      seekerName: "Amit R.",
      dudeName: null,
      escrowState: "secured" as const,
      createdAt: new Date().toISOString(),
      chat: [],
      report: null
    };

    const updated = [...bounties, newB];
    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));

    // Reset Form
    setWizardStep(1);
    setLocationInput("");
    setLatVal(12.9716);
    setLngVal(77.5946);
    setSpecialNotes("");
    setPrefCurfew(false);
    setPrefAc(false);
    setPrefVentilation(false);

    // Open active chat console automatically
    setSelectedBountyId(newB.id);
    localStorage.setItem("tab_selected_bounty_id", newB.id);

    showToast(`Bounty ${newB.id} successfully created. ₹499 locked in Escrow!`);
  };

  // 5. Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBountyId || !chatMessageInput.trim()) return;

    const updated = bounties.map(b => {
      if (b.id === selectedBountyId) {
        return {
          ...b,
          chat: [
            ...b.chat,
            {
              sender: "seeker" as const,
              text: chatMessageInput.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return b;
    });

    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));
    setChatMessageInput("");
  };

  // 6. Release Escrow Payout
  const handleReleaseFunds = () => {
    if (!selectedBountyId) return;
    const updated = bounties.map(b => {
      if (b.id === selectedBountyId) {
        return {
          ...b,
          status: "completed" as const,
          escrowState: "released" as const
        };
      }
      return b;
    });
    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));
    showToast("Escrow Funds Disbursed: ₹400 routed to Dude, ₹99 Platform fee.");
  };

  // 7. Raise Dispute
  const handleRaiseDispute = () => {
    if (!selectedBountyId) return;
    const updated = bounties.map(b => {
      if (b.id === selectedBountyId) {
        return {
          ...b,
          escrowState: "disputed" as const
        };
      }
      return b;
    });
    setBounties(updated);
    localStorage.setItem("tab_db", JSON.stringify(updated));
    showToast("Dispute registered. Our Admin will inspect verification logs and coordinate.");
  };

  const activeBounty = bounties.find(b => b.id === selectedBountyId);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Toast Notification */}
      {toastText && (
        <div className="fixed bottom-10 right-10 bg-black text-white text-xs font-bold px-4 py-3 rounded-lg border border-zinc-800 shadow-2xl flex items-center gap-2 select-none z-50 animate-bounce">
          🔔 <span>{toastText}</span>
        </div>
      )}

      {/* Left Column: Post Form (cols 4) */}
      <div className="lg:col-span-5 border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-black mb-1">Post a New Bounty</h2>
          <p className="text-[11px] text-zinc-500 font-sans">Submit PG details for a Dude to verify.</p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex justify-between items-center px-4 relative select-none">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-100 -z-10" />
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${wizardStep >= 1 ? "bg-[#cc5a37] text-white border-[#cc5a37]" : "bg-white text-zinc-400 border-zinc-200"}`}>1</span>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${wizardStep >= 2 ? "bg-[#cc5a37] text-white border-[#cc5a37]" : "bg-white text-zinc-400 border-zinc-200"}`}>2</span>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${wizardStep >= 3 ? "bg-[#cc5a37] text-white border-[#cc5a37]" : "bg-white text-zinc-400 border-zinc-200"}`}>3</span>
        </div>

        <form onSubmit={handlePostBounty} className="flex flex-col gap-4 font-sans text-xs">
          {/* STEP 1: Area & Budget */}
          {wizardStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-700">Preferred Location</label>
                  <button 
                    type="button" 
                    onClick={pinMapToCurrentLocation}
                    className="px-2.5 py-1 text-[10px] font-bold border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[#cc5a37] rounded cursor-pointer transition-colors"
                  >
                    📍 Use Current Location
                  </button>
                </div>
                <input 
                  type="text" 
                  id="bounty-location-input"
                  placeholder="Search area, landmark or street in Bengaluru..."
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none"
                />
                
                {/* Map preview box */}
                <div 
                  ref={mapRef} 
                  className="h-44 w-full bg-zinc-50 border border-zinc-200 rounded relative overflow-hidden mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Min Budget (₹/mo)</label>
                  <input 
                    type="number" 
                    min={1000} 
                    value={budgetMin} 
                    onChange={(e) => setBudgetMin(parseInt(e.target.value))}
                    className="p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Max Budget (₹/mo)</label>
                  <input 
                    type="number" 
                    min={1000} 
                    value={budgetMax} 
                    onChange={(e) => setBudgetMax(parseInt(e.target.value))}
                    className="p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Min Deposit (months)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={depositMin} 
                    onChange={(e) => setDepositMin(parseInt(e.target.value))}
                    className="p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Max Deposit (months)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={depositMax} 
                    onChange={(e) => setDepositMax(parseInt(e.target.value))}
                    className="p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-zinc-700">Room Occupancy Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Single Room", "Double Sharing", "Flatmate"].map(type => (
                    <button 
                      key={type} 
                      type="button"
                      onClick={() => setRoomType(type)}
                      className={`py-2 text-[10px] font-bold border rounded transition-all cursor-pointer ${roomType === type ? "bg-[#cc5a37] text-white border-[#cc5a37]" : "border-zinc-250 hover:bg-zinc-50"}`}
                    >
                      {type.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-zinc-700">Dude Gender Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Any", "Female Only", "Male Only"].map(gender => (
                    <button 
                      key={gender} 
                      type="button"
                      onClick={() => setGenderPref(gender)}
                      className={`py-2 text-[10px] font-bold border rounded transition-all cursor-pointer ${genderPref === gender ? "bg-[#cc5a37] text-white border-[#cc5a37]" : "border-zinc-250 hover:bg-zinc-50"}`}
                    >
                      {gender.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setWizardStep(2)}
                className="mt-2 w-full py-3 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold text-xs rounded transition-all cursor-pointer text-center"
              >
                Next: Preferences ➔
              </button>
            </div>
          )}

          {/* STEP 2: Preferences & Tasks */}
          {wizardStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-zinc-700">Select Verification Tasks</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Wi-Fi test", state: prefWifi, setter: setPrefWifi, icon: "📶" },
                    { label: "Food audit", state: prefFood, setter: setPrefFood, icon: "🍽️" },
                    { label: "Washroom", state: prefWashroom, setter: setPrefWashroom, icon: "🚿" },
                    { label: "Curfew rules", state: prefCurfew, setter: setPrefCurfew, icon: "🚪" },
                    { label: "AC/Backup", state: prefAc, setter: setPrefAc, icon: "❄️" },
                    { label: "Ventilation", state: prefVentilation, setter: setPrefVentilation, icon: "🪟" }
                  ].map((task, i) => (
                    <label key={i} className={`p-3 border rounded flex flex-col gap-1 cursor-pointer transition-all ${task.state ? "border-[#cc5a37] bg-orange-50/10" : "border-zinc-200"}`}>
                      <input 
                        type="checkbox" 
                        checked={task.state} 
                        onChange={(e) => task.setter(e.target.checked)} 
                        className="hidden" 
                      />
                      <span className="text-sm select-none">{task.icon}</span>
                      <strong className="text-[10px] text-zinc-800 select-none">{task.label}</strong>
                    </label>
                  ))}
                </div>
              </div>

              {prefFood && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700">Your Food Preference</label>
                  <select 
                    value={foodPref} 
                    onChange={(e) => setFoodPref(e.target.value)}
                    className="p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none"
                  >
                    <option value="Veg & Non-Veg">Veg & Non-Veg (Both kitchens)</option>
                    <option value="Vegetarian Only">Pure Vegetarian Only</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700">Special Instructions for Dude</label>
                <textarea 
                  value={specialNotes} 
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Check power backup stability, room light exposure, flatmates background checks..."
                  rows={3}
                  className="p-3 border border-zinc-200 rounded focus:border-[#cc5a37]/50 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 mt-2 select-none">
                <button 
                  type="button" 
                  onClick={() => setWizardStep(1)}
                  className="py-3 px-4 border border-zinc-200 rounded font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={() => setWizardStep(3)}
                  className="flex-1 py-3 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold rounded transition-all cursor-pointer text-center"
                >
                  Next: Escrow ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Hold Authorization */}
          {wizardStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="border border-zinc-100 rounded-md p-4 bg-zinc-50/50 flex flex-col gap-3 font-mono">
                <div className="flex justify-between items-center">
                  <span>Bounty Payout (to Dude):</span>
                  <strong>₹400</strong>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Platform Fee (Holds):</span>
                  <strong>₹99</strong>
                </div>
                <hr className="border-zinc-200" />
                <div className="flex justify-between items-center text-sm font-black text-black">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#cc5a37]">₹499</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 flex gap-1.5 bg-zinc-50 p-3 rounded">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Escrow Secured by Razorpay. Funds are only disbursed after report is approved. Refunds are processed immediately on disputes.</span>
              </p>
              <div className="flex gap-3 select-none">
                <button 
                  type="button" 
                  onClick={() => setWizardStep(2)}
                  className="py-3 px-4 border border-zinc-200 rounded font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold rounded transition-all cursor-pointer text-center"
                >
                  Authorize & Post Bounty
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Right Column: Console & Live Logs (cols 7) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* List of Seeker's Bounties */}
        <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading font-black text-xl text-black">My Posted Bounties</h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 text-zinc-600">{bounties.length} Total</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bounties.map(b => {
              const isActive = b.id === selectedBountyId;
              const budgetStr = `₹${b.budgetMin.toLocaleString()} - ₹${b.budgetMax.toLocaleString()}`;
              return (
                <div 
                  key={b.id}
                  onClick={() => {
                    setSelectedBountyId(b.id);
                    localStorage.setItem("tab_selected_bounty_id", b.id);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col gap-2 relative ${isActive ? "border-[#cc5a37] bg-orange-50/5 shadow-sm" : "border-zinc-100 hover:border-zinc-200"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-heading font-bold text-xs text-black">📍 {b.area}</h4>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                      b.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      b.status === "submitted" ? "bg-green-50 text-green-500 border-green-200" :
                      b.status === "visiting" ? "bg-yellow-50 text-yellow-500 border-yellow-200" :
                      "bg-blue-50 text-blue-500 border-blue-200"
                    }`}>{b.status}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-sans">{b.roomType} | Budget: {budgetStr}</span>
                  <div className="text-[9px] text-zinc-400 mt-2 flex justify-between border-t border-zinc-50 pt-2 font-mono">
                    <span>ID: {b.id}</span>
                    <span>{b.dudeName ? `Dude: ${b.dudeName}` : "Unassigned"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live chat hub */}
        {activeBounty ? (
          <div className="border border-zinc-100 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-zinc-50 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🕵️‍♂️</span>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">{activeBounty.dudeName || "Dude System"}</h3>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                    {activeBounty.area} PG Bounty - Budget ₹{activeBounty.budgetMin.toLocaleString()} - ₹{activeBounty.budgetMax.toLocaleString()}
                    {activeBounty.lat && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${activeBounty.lat},${activeBounty.lng}`}
                        target="_blank"
                        className="text-[#cc5a37] font-bold hover:underline flex items-center gap-0.5"
                      >
                        (📍 Coordinates <ExternalLink size={10} />)
                      </a>
                    )}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase ${
                activeBounty.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                activeBounty.status === "submitted" ? "bg-green-50 text-green-600" :
                activeBounty.status === "visiting" ? "bg-yellow-50 text-yellow-600" :
                "bg-blue-50 text-blue-600"
              }`}>{activeBounty.status}</span>
            </div>

            {/* Escrow visualisation steps */}
            <div className="bg-zinc-50/50 border border-zinc-100 rounded-lg p-4 font-mono text-[10px] flex flex-col gap-3 select-none">
              <strong className="text-black font-sans uppercase tracking-wider text-[9px] text-zinc-500">Razorpay Route Escrow Status</strong>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col gap-1.5 items-center">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">✓</span>
                  <span className="font-bold text-black">Payment Secured</span>
                  <span className="text-[8px] text-zinc-400">₹499 in Escrow</span>
                </div>
                <div className="flex flex-col gap-1.5 items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                    activeBounty.status === "submitted" || activeBounty.status === "completed" ? "bg-emerald-600 text-white" : "bg-[#cc5a37] text-white animate-pulse"
                  }`}>{activeBounty.status === "submitted" || activeBounty.status === "completed" ? "✓" : "2"}</span>
                  <span className="font-bold text-black">Dude Audit</span>
                  <span className="text-[8px] text-zinc-400">Walkthrough Report</span>
                </div>
                <div className="flex flex-col gap-1.5 items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                    activeBounty.status === "completed" ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-400"
                  }`}>{activeBounty.status === "completed" ? "✓" : "3"}</span>
                  <span className="font-bold text-black">Escrow Transits</span>
                  <span className="text-[8px] text-zinc-400">Split Transfer</span>
                </div>
              </div>
            </div>

            {/* Report visual panel */}
            {(activeBounty.status === "submitted" || activeBounty.status === "completed") && activeBounty.report && (
              <div className="border border-zinc-200 rounded-lg p-4 bg-emerald-50/10 flex flex-col gap-4 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📋</span>
                  <h4 className="font-heading font-extrabold text-sm text-black">Dude's Verification Findings</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-[#cc5a37]" />
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Wi-Fi Bandwidth:</span>
                      <strong>{activeBounty.report.wifiSpeed} Mbps</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils size={14} className="text-[#cc5a37]" />
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Kitchen Hygiene:</span>
                      <strong>{activeBounty.report.foodRating}/5 Rating</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#cc5a37]" />
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Verification Maps:</span>
                      <a 
                        href={activeBounty.report.location} 
                        target="_blank" 
                        className="text-[#cc5a37] font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        Verified Pin <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="aspect-video w-full max-w-sm border border-zinc-200 rounded-md overflow-hidden bg-zinc-50 flex items-center justify-center text-3xl select-none">
                  🏨
                </div>

                {activeBounty.status === "submitted" ? (
                  <div className="flex gap-3 select-none">
                    <button 
                      onClick={handleReleaseFunds}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors cursor-pointer text-center"
                    >
                      Release Funds & Accept PG
                    </button>
                    <button 
                      onClick={handleRaiseDispute}
                      className="py-3 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded transition-colors cursor-pointer"
                    >
                      Raise Dispute
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold rounded text-center">
                    ✓ Escrow Payout Disbursed Successfully (₹400 to Dude, ₹99 Platform Fee)
                  </div>
                )}
              </div>
            )}

            {/* Chat message logs */}
            <div className="border border-zinc-100 rounded-lg p-4 bg-zinc-50/30 flex flex-col gap-3 min-h-[180px] max-h-[300px] overflow-y-auto pr-1">
              {activeBounty.chat.length === 0 ? (
                <div className="text-center text-zinc-400 py-12 text-xs font-sans flex flex-col items-center gap-1.5">
                  <Info size={16} />
                  <span>No chat messages yet. Your Dude will update you once visiting begins.</span>
                </div>
              ) : (
                activeBounty.chat.map((msg, i) => {
                  const isSeeker = msg.sender === "seeker";
                  return (
                    <div 
                      key={i}
                      className={`max-w-[75%] p-3 rounded-md text-xs leading-relaxed ${
                        isSeeker ? "bg-[#cc5a37] text-white self-end" : "bg-zinc-100 text-zinc-800 self-start border border-zinc-200"
                      }`}
                    >
                      <div>{msg.text}</div>
                      <span className="text-[9px] opacity-75 float-right mt-1.5 font-mono">{msg.time}</span>
                      <div className="clear-both" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Type messages to coordinate with your Dude..."
                required
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                className="flex-1 p-3 border border-zinc-200 rounded text-xs focus:border-[#cc5a37]/50 focus:outline-none"
              />
              <button 
                type="submit"
                className="px-5 bg-[#cc5a37] hover:bg-[#b84b2c] text-white font-bold text-xs rounded transition-colors flex items-center justify-center select-none cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 rounded-lg py-24 text-center text-zinc-400 text-xs font-sans flex flex-col items-center justify-center gap-2">
            <Info size={20} className="text-zinc-300" />
            <span>Select a bounty from the list above to open the live ground verification hub.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeekerDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Loading Seeker Console...</div>}>
      <SeekerDashboardContent />
    </Suspense>
  );
}
