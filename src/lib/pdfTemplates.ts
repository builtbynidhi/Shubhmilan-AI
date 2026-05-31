import type { BiodataFormData } from "@/types/biodata.types";

// ═══════════════════════════════════════════════════════════════════════════════
// Shared constants & helpers
// ═══════════════════════════════════════════════════════════════════════════════
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'DM Sans', 'Segoe UI', sans-serif";

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const ini = (n: string) => (n ? n.charAt(0).toUpperCase() : "?");

const siblingsText = (b: number, mb: number, s: number, ms: number) => {
  const p: string[] = [];
  if (b) p.push(`${b} Brother${b > 1 ? "s" : ""}${mb ? ` (${mb} Married)` : " (Unmarried)"}`);
  if (s) p.push(`${s} Sister${s > 1 ? "s" : ""}${ms ? ` (${ms} Married)` : " (Unmarried)"}`);
  return p.join(", ") || "None";
};

const greeting = (c: string) => {
  switch (c) {
    case "muslim": return "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    case "christian": return "✝ In God We Trust";
    case "sikh": return "ੴ ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ";
    case "jain": return "णमो अरिहंताणं";
    default: return "ॐ श्री गणेशाय नमः";
  }
};

/** Photo or initials placeholder */
const photoBox = (
  name: string,
  url: string | undefined,
  w: number,
  h: number,
  shape: "circle" | "rect" = "rect",
  border = "#D4AF37",
) => {
  const rad = shape === "circle" ? "50%" : "6px";
  const base = `width:${w}px;height:${h}px;border-radius:${rad};border:3px solid ${border};overflow:hidden;flex-shrink:0;`;
  if (url)
    return `<div style="${base}"><img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>`;
  return `<div style="${base}background:#f5f0e8;display:flex;align-items:center;justify-content:center;font-family:${SERIF};font-size:${Math.round(w / 2.5)}px;font-weight:700;color:${border};">${ini(name)}</div>`;
};

/** Colon-separated row:  Label  :  Value */
const cRow = (label: string, value: string, lc = "#5D4037") =>
  `<tr><td style="padding:5px 0;color:${lc};font-weight:600;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:5px 10px;color:${lc};vertical-align:top;">:</td><td style="padding:5px 0;color:#333;font-weight:500;">${value || "—"}</td></tr>`;

/** Simple label — value row */
const kvRow = (label: string, value: string, lc = "#795548") =>
  `<tr><td style="padding:5px 0;width:42%;color:${lc};font-weight:500;">${label}</td><td style="padding:5px 0;font-weight:600;">${value || "—"}</td></tr>`;

const tblStyle = (sz = 13) => `width:100%;font-family:${SANS};font-size:${sz}px;border-collapse:collapse;`;

// ═══════════════════════════════════════════════════════════════════════════════
// Template 1 — Classic Royal (Gold/Ivory – Hindu Traditional)
// Match: tpl_free_01
// ═══════════════════════════════════════════════════════════════════════════════
export function renderClassicRoyal(data: BiodataFormData): string {
  const { personal, career, family, about } = data;
  const name = personal.fullName || "Your Name";

  return `<div style="width:100%;min-height:100%;box-sizing:border-box;position:relative;background:linear-gradient(135deg,#FFFAF0 0%,#FFF8E7 100%);color:#3E2723;font-family:${SANS};padding:0;overflow:hidden;">
  <!-- Watermark mandala -->
  <div style="position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;border-radius:50%;border:40px solid rgba(212,175,55,0.04);pointer-events:none;"></div>
  <div style="position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);width:380px;height:380px;border-radius:50%;border:25px solid rgba(212,175,55,0.04);pointer-events:none;"></div>
  <!-- Outer gold border -->
  <div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:3px solid #D4AF37;pointer-events:none;"></div>
  <div style="position:absolute;top:16px;left:16px;right:16px;bottom:16px;border:1px solid #D4AF37;pointer-events:none;"></div>

  <div style="position:relative;z-index:1;padding:35px 45px;">
    <!-- Greeting -->
    <div style="text-align:center;font-family:${SERIF};font-size:15px;color:#D4AF37;margin-bottom:18px;font-weight:600;">${greeting(personal.community)}</div>

    <!-- Photo + Name header -->
    <div style="display:flex;align-items:flex-start;gap:22px;margin-bottom:8px;">
      ${photoBox(name, personal.photoUrl, 140, 170, "rect", "#D4AF37")}
      <div style="flex:1;padding-top:8px;">
        <h1 style="font-family:${SERIF};font-size:28px;font-weight:700;color:#5D4037;margin:0 0 8px;line-height:1.2;">${name}</h1>
        <p style="font-size:13px;color:#8D6E63;margin:0;">Date of Birth : ${personal.dateOfBirth || "—"}</p>
        <p style="font-size:13px;color:#8D6E63;margin:4px 0 0;">Place of Birth : ${family.nativePlace || career.workCity || "—"}</p>
      </div>
    </div>

    <!-- PERSONAL DETAILS -->
    <div style="text-align:center;margin:22px 0 14px;"><span style="display:inline-block;background:linear-gradient(135deg,#C8956C,#D4AF37);color:#fff;padding:6px 28px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Personal Details</span></div>
    <table style="${tblStyle()}">
      ${kvRow("Date of Birth", personal.dateOfBirth)}
      ${kvRow("Height", personal.height)}
      ${kvRow("Complexion", cap(personal.complexion))}
      ${personal.gotra ? kvRow("Gotra", personal.gotra) : ""}
      ${personal.caste ? kvRow("Caste", personal.caste) : ""}
      ${personal.manglik ? kvRow("Manglik", cap(personal.manglik)) : ""}
      ${kvRow("Mother Tongue", personal.motherTongue)}
      ${kvRow("Education", `${career.highestEducation || "—"}${career.college ? ", " + career.college : ""}`)}
      ${kvRow("Occupation", `${career.jobTitle || "—"}${career.companyName ? ", " + career.companyName : ""}`)}
    </table>

    <!-- FAMILY DETAILS -->
    <div style="text-align:center;margin:22px 0 14px;"><span style="display:inline-block;background:linear-gradient(135deg,#C8956C,#D4AF37);color:#fff;padding:6px 28px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Family Details</span></div>
    <table style="${tblStyle()}">
      ${kvRow("Father's Name", family.fatherName)}
      ${kvRow("Father's Occupation", family.fatherOccupation)}
      ${kvRow("Mother's Name", family.motherName)}
      ${kvRow("Mother's Occupation", family.motherOccupation)}
      ${kvRow("Siblings", siblingsText(family.brothers, family.marriedBrothers, family.sisters, family.marriedSisters))}
      ${kvRow("Native Place", family.nativePlace)}
    </table>

    ${about?.aboutMe ? `<div style="text-align:center;margin:22px 0 14px;"><span style="display:inline-block;background:linear-gradient(135deg,#C8956C,#D4AF37);color:#fff;padding:6px 28px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">About Me</span></div>
    <p style="font-size:13px;color:#5D4037;line-height:1.7;text-align:center;padding:0 15px;">${about.aboutMe}</p>` : ""}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template 2 — Modern Minimal (Navy Sidebar – Contemporary)
// Match: tpl_free_02
// ═══════════════════════════════════════════════════════════════════════════════
export function renderModernMinimal(data: BiodataFormData): string {
  const { personal, career, family, about } = data;
  const name = personal.fullName || "Full Name";

  return `<div style="width:100%;min-height:100%;box-sizing:border-box;background:#fff;color:#1E293B;font-family:${SANS};display:flex;">
  <!-- Left sidebar -->
  <div style="width:35%;background:linear-gradient(180deg,#1E3A8A 0%,#1E2D6A 100%);color:#F8FAFC;padding:40px 25px;display:flex;flex-direction:column;">
    ${photoBox(name, personal.photoUrl, 110, 110, "circle", "rgba(255,255,255,0.3)")}
    <h1 style="font-family:${SERIF};font-size:22px;font-weight:700;text-align:center;margin:18px 0 6px;line-height:1.3;">${name}</h1>
    <p style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#93C5FD;margin-bottom:35px;">${career.jobTitle || "—"}</p>

    <div style="margin-bottom:28px;">
      <h3 style="font-size:11px;text-transform:uppercase;color:#60A5FA;margin-bottom:12px;border-bottom:1px solid #3B82F6;padding-bottom:5px;letter-spacing:1px;">Location</h3>
      <p style="font-size:12px;margin-bottom:6px;opacity:0.9;">📍 ${career.workCity || "—"}</p>
      <p style="font-size:12px;opacity:0.9;">🏠 ${family.nativePlace || family.familyCity || "—"}</p>
    </div>

    <div style="margin-bottom:28px;">
      <h3 style="font-size:11px;text-transform:uppercase;color:#60A5FA;margin-bottom:12px;border-bottom:1px solid #3B82F6;padding-bottom:5px;letter-spacing:1px;">Quick Facts</h3>
      <p style="font-size:12px;margin-bottom:5px;display:flex;justify-content:space-between;"><span style="opacity:0.6;">Age</span><span>${personal.age || "—"}</span></p>
      <p style="font-size:12px;margin-bottom:5px;display:flex;justify-content:space-between;"><span style="opacity:0.6;">Height</span><span>${personal.height || "—"}</span></p>
      <p style="font-size:12px;margin-bottom:5px;display:flex;justify-content:space-between;"><span style="opacity:0.6;">Tongue</span><span>${personal.motherTongue || "—"}</span></p>
      <p style="font-size:12px;margin-bottom:5px;display:flex;justify-content:space-between;"><span style="opacity:0.6;">Blood</span><span>${personal.bloodGroup || "—"}</span></p>
    </div>

    <div>
      <h3 style="font-size:11px;text-transform:uppercase;color:#60A5FA;margin-bottom:12px;border-bottom:1px solid #3B82F6;padding-bottom:5px;letter-spacing:1px;">Community</h3>
      <p style="font-size:12px;margin-bottom:5px;">${cap(personal.community)} ${personal.caste ? "/ " + personal.caste : ""}</p>
      ${personal.gotra ? `<p style="font-size:12px;opacity:0.8;">Gotra: ${personal.gotra}</p>` : ""}
    </div>
  </div>

  <!-- Right content -->
  <div style="width:65%;padding:40px 35px;background:#F8FAFC;">
    ${about?.aboutMe ? `<div style="margin-bottom:28px;"><h2 style="font-family:${SERIF};font-size:17px;color:#1E3A8A;margin-bottom:10px;border-bottom:2px solid #E2E8F0;padding-bottom:8px;">About Me</h2><p style="font-size:12px;color:#475569;line-height:1.7;">${about.aboutMe}</p></div>` : ""}

    <div style="margin-bottom:28px;">
      <h2 style="font-family:${SERIF};font-size:17px;color:#1E3A8A;margin-bottom:14px;border-bottom:2px solid #E2E8F0;padding-bottom:8px;">Personal Information</h2>
      <table style="${tblStyle(12)}">
        ${kvRow("Date of Birth", personal.dateOfBirth, "#64748B")}
        ${kvRow("Marital Status", cap(personal.maritalStatus?.replace(/_/g, " ") || "—"), "#64748B")}
        ${kvRow("Complexion", cap(personal.complexion), "#64748B")}
        ${personal.manglik ? kvRow("Manglik", cap(personal.manglik), "#64748B") : ""}
      </table>
    </div>

    <div style="margin-bottom:28px;">
      <h2 style="font-family:${SERIF};font-size:17px;color:#1E3A8A;margin-bottom:14px;border-bottom:2px solid #E2E8F0;padding-bottom:8px;">Education & Career</h2>
      <table style="${tblStyle(12)}">
        ${kvRow("Education", career.highestEducation, "#64748B")}
        ${kvRow("College", career.college, "#64748B")}
        ${kvRow("Occupation", career.jobTitle, "#64748B")}
        ${kvRow("Company", career.companyName, "#64748B")}
        ${kvRow("Income", career.annualIncome, "#64748B")}
      </table>
    </div>

    <div style="margin-bottom:28px;">
      <h2 style="font-family:${SERIF};font-size:17px;color:#1E3A8A;margin-bottom:14px;border-bottom:2px solid #E2E8F0;padding-bottom:8px;">Family Background</h2>
      <table style="${tblStyle(12)}">
        ${kvRow("Father", `${family.fatherName} (${family.fatherOccupation})`, "#64748B")}
        ${kvRow("Mother", `${family.motherName} (${family.motherOccupation})`, "#64748B")}
        ${kvRow("Siblings", siblingsText(family.brothers, family.marriedBrothers, family.sisters, family.marriedSisters), "#64748B")}
        ${kvRow("Native Place", family.nativePlace, "#64748B")}
      </table>
    </div>

    ${about?.partnerExpectations ? `<div><h2 style="font-family:${SERIF};font-size:17px;color:#1E3A8A;margin-bottom:10px;border-bottom:2px solid #E2E8F0;padding-bottom:8px;">Partner Expectations</h2><p style="font-size:12px;color:#475569;line-height:1.7;">${about.partnerExpectations}</p></div>` : ""}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template 3 — Ornate Gold Frame (Green/Gold Flourishes)
// Match: tpl_std_01, tpl_std_03, tpl_std_04
// ═══════════════════════════════════════════════════════════════════════════════
export function renderOrnateGold(data: BiodataFormData): string {
  const { personal, career, family, about } = data;
  const name = personal.fullName || "Your Name";

  /* Corner flourish SVG data */
  const corner = `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><path d="M5 5 Q5 35 35 35 Q5 35 5 65" stroke="#8B7332" stroke-width="2" fill="none"/><path d="M10 5 Q10 30 35 30 Q10 30 10 55" stroke="#8B7332" stroke-width="1" fill="none" opacity="0.5"/><circle cx="5" cy="5" r="3" fill="#8B7332"/></svg>`;
  const cornerUri = `data:image/svg+xml,${encodeURIComponent(corner)}`;

  return `<div style="width:100%;min-height:100%;box-sizing:border-box;position:relative;background:#FFFFF8;color:#333;font-family:${SANS};padding:0;">
  <!-- Decorative border -->
  <div style="position:absolute;top:8px;left:8px;right:8px;bottom:8px;border:2px solid #8B7332;pointer-events:none;"></div>
  <!-- Corner flourishes -->
  <img src="${cornerUri}" style="position:absolute;top:4px;left:4px;width:70px;height:70px;" />
  <img src="${cornerUri}" style="position:absolute;top:4px;right:4px;width:70px;height:70px;transform:scaleX(-1);" />
  <img src="${cornerUri}" style="position:absolute;bottom:4px;left:4px;width:70px;height:70px;transform:scaleY(-1);" />
  <img src="${cornerUri}" style="position:absolute;bottom:4px;right:4px;width:70px;height:70px;transform:scale(-1,-1);" />

  <div style="position:relative;z-index:1;padding:40px 50px;">
    <!-- Ganesh + Greeting -->
    <div style="text-align:center;margin-bottom:14px;">
      <div style="font-size:28px;color:#8B7332;margin-bottom:4px;">&#x1F549;&#xFE0E;</div>
      <div style="font-family:${SERIF};font-size:14px;color:#8B7332;font-weight:600;">${greeting(personal.community)}</div>
    </div>

    <!-- Name + Photo row -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
      <div style="flex:1;">
        <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#8B7332;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #8B7332;padding-bottom:6px;margin-bottom:14px;">Personal Details</h2>
        <table style="${tblStyle(12)}">
          ${cRow("Name", name, "#5D4037")}
          ${cRow("Date of Birth", personal.dateOfBirth, "#5D4037")}
          ${cRow("Height", personal.height, "#5D4037")}
          ${cRow("Complexion", cap(personal.complexion), "#5D4037")}
          ${personal.gotra ? cRow("Gotra", personal.gotra, "#5D4037") : ""}
          ${personal.caste ? cRow("Caste", personal.caste, "#5D4037") : ""}
          ${cRow("Mother Tongue", personal.motherTongue, "#5D4037")}
          ${cRow("Education", `${career.highestEducation}${career.college ? ", " + career.college : ""}`, "#5D4037")}
          ${cRow("Occupation", `${career.jobTitle}${career.companyName ? ", " + career.companyName : ""}`, "#5D4037")}
        </table>
      </div>
      <div style="margin-left:25px;margin-top:30px;">
        ${photoBox(name, personal.photoUrl, 140, 170, "rect", "#8B7332")}
      </div>
    </div>

    <!-- Family Details -->
    <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#8B7332;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #8B7332;padding-bottom:6px;margin:20px 0 14px;">Family Details</h2>
    <table style="${tblStyle(12)}">
      ${cRow("Father's Name", family.fatherName, "#5D4037")}
      ${cRow("Father's Occupation", family.fatherOccupation, "#5D4037")}
      ${cRow("Mother's Name", family.motherName, "#5D4037")}
      ${cRow("Mother's Occupation", family.motherOccupation, "#5D4037")}
      ${cRow("Siblings", siblingsText(family.brothers, family.marriedBrothers, family.sisters, family.marriedSisters), "#5D4037")}
    </table>

    <!-- Contact Details -->
    <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#8B7332;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #8B7332;padding-bottom:6px;margin:20px 0 14px;">Contact Details</h2>
    <table style="${tblStyle(12)}">
      ${cRow("Contact Person", family.fatherName, "#5D4037")}
      ${cRow("Native Place", family.nativePlace, "#5D4037")}
      ${cRow("Current City", family.familyCity || career.workCity, "#5D4037")}
    </table>

    ${about?.aboutMe ? `<h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#8B7332;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #8B7332;padding-bottom:6px;margin:20px 0 14px;">About</h2>
    <p style="font-size:12px;color:#444;line-height:1.7;">${about.aboutMe}</p>` : ""}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template 4 — Royal Maroon (Maroon Header, Circular Photo)
// Match: tpl_std_02, tpl_luxury_01
// ═══════════════════════════════════════════════════════════════════════════════
export function renderRoyalMaroon(data: BiodataFormData): string {
  const { personal, career, family, about } = data;
  const name = personal.fullName || "Your Name";

  return `<div style="width:100%;min-height:100%;box-sizing:border-box;position:relative;background:#FDFDFD;color:#333;font-family:${SANS};padding:0;overflow:hidden;">
  <!-- Subtle mandala watermark bottom-right -->
  <div style="position:absolute;bottom:-60px;right:-60px;width:350px;height:350px;border-radius:50%;border:50px solid rgba(123,31,58,0.03);pointer-events:none;"></div>
  <div style="position:absolute;bottom:-30px;right:-30px;width:250px;height:250px;border-radius:50%;border:30px solid rgba(123,31,58,0.03);pointer-events:none;"></div>
  <!-- Side accent line -->
  <div style="position:absolute;top:0;left:0;bottom:0;width:6px;background:linear-gradient(180deg,#7B1F3A,#A0284E);"></div>
  <div style="position:absolute;top:0;right:0;bottom:0;width:6px;background:linear-gradient(180deg,#7B1F3A,#A0284E);"></div>

  <!-- Maroon header -->
  <div style="background:linear-gradient(135deg,#7B1F3A 0%,#5C1730 100%);padding:30px 40px 50px;text-align:center;position:relative;">
    <div style="position:absolute;bottom:0;left:0;right:0;height:20px;background:#FDFDFD;border-radius:50% 50% 0 0;"></div>
    <!-- Circular photo (overlapping header) -->
    <div style="display:inline-block;position:relative;z-index:2;margin-bottom:-40px;">
      <div style="width:130px;height:130px;border-radius:50%;border:5px solid #D4AF37;overflow:hidden;margin:0 auto;background:#f5f0e8;">
        ${personal.photoUrl
          ? `<img src="${personal.photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:${SERIF};font-size:48px;font-weight:700;color:#D4AF37;">${ini(name)}</div>`}
      </div>
    </div>
  </div>

  <!-- Body content -->
  <div style="position:relative;z-index:1;padding:55px 45px 35px;">
    <h1 style="font-family:${SERIF};font-size:26px;font-weight:700;color:#7B1F3A;text-align:center;margin:0 0 4px;">${name}</h1>
    <p style="text-align:center;font-size:12px;color:#A0284E;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:25px;">${career.jobTitle || "—"} • ${personal.age || "—"} Years</p>

    <!-- Two-column layout -->
    <div style="display:flex;gap:30px;">
      <!-- Personal Details -->
      <div style="flex:1;">
        <h2 style="font-family:${SERIF};font-size:14px;font-weight:700;color:#7B1F3A;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #7B1F3A;padding-bottom:5px;margin-bottom:12px;">Personal Details</h2>
        <table style="${tblStyle(12)}">
          ${cRow("Date of Birth", personal.dateOfBirth, "#7B1F3A")}
          ${cRow("Height", personal.height, "#7B1F3A")}
          ${cRow("Complexion", cap(personal.complexion), "#7B1F3A")}
          ${personal.gotra ? cRow("Gotra", personal.gotra, "#7B1F3A") : ""}
          ${personal.caste ? cRow("Caste", personal.caste, "#7B1F3A") : ""}
          ${personal.manglik ? cRow("Manglik", cap(personal.manglik), "#7B1F3A") : ""}
          ${cRow("Mother Tongue", personal.motherTongue, "#7B1F3A")}
          ${cRow("Education", career.highestEducation, "#7B1F3A")}
          ${cRow("College", career.college, "#7B1F3A")}
          ${cRow("Occupation", career.jobTitle, "#7B1F3A")}
          ${cRow("Company", career.companyName, "#7B1F3A")}
          ${cRow("Income", career.annualIncome, "#7B1F3A")}
        </table>
      </div>

      <!-- Contact Details -->
      <div style="flex:0 0 42%;">
        <h2 style="font-family:${SERIF};font-size:14px;font-weight:700;color:#7B1F3A;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #7B1F3A;padding-bottom:5px;margin-bottom:12px;">Contact Details</h2>
        <table style="${tblStyle(12)}">
          ${cRow("Contact Person", family.fatherName, "#7B1F3A")}
          ${cRow("Native Place", family.nativePlace, "#7B1F3A")}
          ${cRow("Current City", family.familyCity || career.workCity, "#7B1F3A")}
        </table>
      </div>
    </div>

    <!-- Family Details -->
    <h2 style="font-family:${SERIF};font-size:14px;font-weight:700;color:#7B1F3A;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #7B1F3A;padding-bottom:5px;margin:22px 0 12px;">Family Details</h2>
    <table style="${tblStyle(12)}">
      ${cRow("Father's Name", family.fatherName, "#7B1F3A")}
      ${cRow("Father's Occupation", family.fatherOccupation, "#7B1F3A")}
      ${cRow("Mother's Name", family.motherName, "#7B1F3A")}
      ${cRow("Mother's Occupation", family.motherOccupation, "#7B1F3A")}
      ${cRow("Siblings", siblingsText(family.brothers, family.marriedBrothers, family.sisters, family.marriedSisters), "#7B1F3A")}
    </table>

    ${about?.aboutMe ? `<h2 style="font-family:${SERIF};font-size:14px;font-weight:700;color:#7B1F3A;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #7B1F3A;padding-bottom:5px;margin:22px 0 12px;">About Me</h2>
    <p style="font-size:12px;color:#444;line-height:1.7;">${about.aboutMe}</p>` : ""}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template 5 — Lavender Bloom (Soft Lavender, Ganesh, Golden Florals)
// Match: tpl_prem_01, tpl_prem_03, tpl_prem_05
// ═══════════════════════════════════════════════════════════════════════════════
export function renderLavenderBloom(data: BiodataFormData): string {
  const { personal, career, family, about } = data;
  const name = personal.fullName || "Your Name";

  return `<div style="width:100%;min-height:100%;box-sizing:border-box;position:relative;background:linear-gradient(180deg,#F5F0FF 0%,#FFFDF5 40%,#FFFDF5 100%);color:#3B2D1F;font-family:${SANS};padding:0;overflow:hidden;">
  <!-- Bottom-right floral accent (CSS art) -->
  <div style="position:absolute;bottom:0;right:0;width:280px;height:280px;pointer-events:none;overflow:hidden;">
    <div style="position:absolute;bottom:-20px;right:-20px;width:220px;height:220px;border-radius:50% 0 0 0;background:linear-gradient(135deg,transparent 40%,rgba(196,164,86,0.12) 100%);"></div>
    <div style="position:absolute;bottom:30px;right:30px;width:80px;height:80px;border-radius:50%;border:8px solid rgba(196,164,86,0.1);"></div>
    <div style="position:absolute;bottom:60px;right:80px;width:40px;height:40px;border-radius:50%;background:rgba(196,164,86,0.08);"></div>
    <div style="position:absolute;bottom:10px;right:100px;width:25px;height:25px;border-radius:50%;background:rgba(196,164,86,0.1);"></div>
  </div>
  <!-- Thin gold bottom & left border -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:#C4A456;"></div>
  <div style="position:absolute;top:0;left:0;bottom:0;width:3px;background:#C4A456;"></div>

  <div style="position:relative;z-index:1;padding:30px 45px;">
    <!-- Ganesh icon + greeting -->
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:28px;color:#C4A456;margin-bottom:2px;">&#x1F549;&#xFE0E;</div>
      <div style="font-family:${SERIF};font-size:13px;color:#C4A456;font-weight:600;">${greeting(personal.community)}</div>
    </div>

    <!-- Name + Photo row -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
      <div style="flex:1;">
        <h1 style="font-family:${SERIF};font-size:28px;font-weight:700;color:#3B2D1F;margin:8px 0 6px;line-height:1.2;">${name}</h1>
        <p style="font-size:12px;color:#7D6B4F;margin:0;">Date of Birth : ${personal.dateOfBirth || "—"}</p>
        <p style="font-size:12px;color:#7D6B4F;margin:3px 0 0;">Place of Birth : ${family.nativePlace || career.workCity || "—"}</p>
      </div>
      <div style="margin-left:20px;">
        ${photoBox(name, personal.photoUrl, 130, 160, "rect", "#C4A456")}
      </div>
    </div>

    <!-- Personal Details -->
    <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#3B2D1F;margin:18px 0 12px;"><span style="border-bottom:2px solid #C4A456;padding-bottom:4px;">Personal Details</span></h2>
    <table style="${tblStyle(12)}">
      ${kvRow("Date of Birth", personal.dateOfBirth, "#7D6B4F")}
      ${kvRow("Height", personal.height, "#7D6B4F")}
      ${kvRow("Complexion", cap(personal.complexion), "#7D6B4F")}
      ${personal.gotra ? kvRow("Gotra", personal.gotra, "#7D6B4F") : ""}
      ${personal.caste ? kvRow("Caste", personal.caste, "#7D6B4F") : ""}
      ${personal.manglik ? kvRow("Manglik", cap(personal.manglik), "#7D6B4F") : ""}
      ${kvRow("Mother Tongue", personal.motherTongue, "#7D6B4F")}
      ${kvRow("Education", `${career.highestEducation}${career.college ? ", " + career.college : ""}`, "#7D6B4F")}
      ${kvRow("Occupation", `${career.jobTitle}${career.companyName ? ", " + career.companyName : ""}`, "#7D6B4F")}
    </table>

    <!-- Family Details -->
    <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#3B2D1F;margin:18px 0 12px;"><span style="border-bottom:2px solid #C4A456;padding-bottom:4px;">Family Details</span></h2>
    <table style="${tblStyle(12)}">
      ${kvRow("Father's Name", family.fatherName, "#7D6B4F")}
      ${kvRow("Father's Occupation", family.fatherOccupation, "#7D6B4F")}
      ${kvRow("Mother's Name", family.motherName, "#7D6B4F")}
      ${kvRow("Mother's Occupation", family.motherOccupation, "#7D6B4F")}
      ${kvRow("Siblings", siblingsText(family.brothers, family.marriedBrothers, family.sisters, family.marriedSisters), "#7D6B4F")}
    </table>

    ${about?.aboutMe ? `<h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#3B2D1F;margin:18px 0 10px;"><span style="border-bottom:2px solid #C4A456;padding-bottom:4px;">About Me</span></h2>
    <p style="font-size:12px;color:#555;line-height:1.7;">${about.aboutMe}</p>` : ""}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template 6 — Golden Heritage (Double Gold Border, Botanical Accents)
// Match: tpl_prem_02, tpl_prem_04, tpl_luxury_02, tpl_luxury_03, tpl_luxury_04
// ═══════════════════════════════════════════════════════════════════════════════
export function renderGoldenHeritage(data: BiodataFormData): string {
  const { personal, career, family, about } = data;
  const name = personal.fullName || "Your Name";

  return `<div style="width:100%;min-height:100%;box-sizing:border-box;position:relative;background:#FFFFF5;color:#333;font-family:${SANS};padding:0;overflow:hidden;">
  <!-- Botanical top accent -->
  <div style="position:absolute;top:0;left:0;right:0;height:50px;background:linear-gradient(180deg,rgba(70,130,180,0.06) 0%,transparent 100%);pointer-events:none;"></div>
  <!-- Botanical bottom accent -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(0deg,rgba(70,130,180,0.06) 0%,transparent 100%);pointer-events:none;"></div>
  <!-- Decorative circles bottom -->
  <div style="position:absolute;bottom:15px;left:50%;transform:translateX(-50%);display:flex;gap:8px;pointer-events:none;">
    <div style="width:10px;height:10px;border-radius:50%;background:#C4A456;opacity:0.25;"></div>
    <div style="width:10px;height:10px;border-radius:50%;background:#4682B4;opacity:0.2;"></div>
    <div style="width:10px;height:10px;border-radius:50%;background:#C4A456;opacity:0.25;"></div>
  </div>
  <!-- Double gold frame -->
  <div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:3px solid #C4A456;pointer-events:none;"></div>
  <div style="position:absolute;top:18px;left:18px;right:18px;bottom:18px;border:1px solid #C4A456;pointer-events:none;"></div>
  <!-- Gold corner squares -->
  <div style="position:absolute;top:6px;left:6px;width:14px;height:14px;border:3px solid #C4A456;"></div>
  <div style="position:absolute;top:6px;right:6px;width:14px;height:14px;border:3px solid #C4A456;"></div>
  <div style="position:absolute;bottom:6px;left:6px;width:14px;height:14px;border:3px solid #C4A456;"></div>
  <div style="position:absolute;bottom:6px;right:6px;width:14px;height:14px;border:3px solid #C4A456;"></div>

  <div style="position:relative;z-index:1;padding:35px 50px;">
    <!-- Greeting -->
    <div style="text-align:center;font-family:${SERIF};font-size:14px;color:#C4A456;margin-bottom:18px;font-weight:600;">${greeting(personal.community)}</div>

    <!-- Name + Photo row -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
      <div style="flex:1;">
        <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#C4A456;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Personal Details</h2>
        <table style="${tblStyle(12)}">
          ${cRow("Name", name, "#7D6B4F")}
          ${cRow("Date of Birth", personal.dateOfBirth, "#7D6B4F")}
          ${cRow("Height", personal.height, "#7D6B4F")}
          ${cRow("Complexion", cap(personal.complexion), "#7D6B4F")}
          ${personal.gotra ? cRow("Gotra", personal.gotra, "#7D6B4F") : ""}
          ${personal.caste ? cRow("Caste", personal.caste, "#7D6B4F") : ""}
          ${personal.manglik ? cRow("Manglik", cap(personal.manglik), "#7D6B4F") : ""}
          ${cRow("Mother Tongue", personal.motherTongue, "#7D6B4F")}
          ${cRow("Education", `${career.highestEducation}${career.college ? ", " + career.college : ""}`, "#7D6B4F")}
          ${cRow("Occupation", `${career.jobTitle}${career.companyName ? ", " + career.companyName : ""}`, "#7D6B4F")}
        </table>
      </div>
      <div style="margin-left:25px;margin-top:0;">
        ${photoBox(name, personal.photoUrl, 140, 170, "rect", "#C4A456")}
      </div>
    </div>

    <!-- Family Details -->
    <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#C4A456;text-transform:uppercase;letter-spacing:2px;margin:20px 0 12px;">Family Details</h2>
    <table style="${tblStyle(12)}">
      ${cRow("Father's Name", family.fatherName, "#7D6B4F")}
      ${cRow("Father's Occupation", family.fatherOccupation, "#7D6B4F")}
      ${cRow("Mother's Name", family.motherName, "#7D6B4F")}
      ${cRow("Mother's Occupation", family.motherOccupation, "#7D6B4F")}
      ${cRow("Siblings", siblingsText(family.brothers, family.marriedBrothers, family.sisters, family.marriedSisters), "#7D6B4F")}
    </table>

    <!-- Contact Details -->
    <h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#C4A456;text-transform:uppercase;letter-spacing:2px;margin:20px 0 12px;">Contact Details</h2>
    <table style="${tblStyle(12)}">
      ${cRow("Contact Person", family.fatherName, "#7D6B4F")}
      ${cRow("Native Place", family.nativePlace, "#7D6B4F")}
      ${cRow("Current City", family.familyCity || career.workCity, "#7D6B4F")}
    </table>

    ${about?.aboutMe ? `<h2 style="font-family:${SERIF};font-size:16px;font-weight:700;color:#C4A456;text-transform:uppercase;letter-spacing:2px;margin:20px 0 10px;">About</h2>
    <p style="font-size:12px;color:#555;line-height:1.7;">${about.aboutMe}</p>` : ""}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template Router — Maps every template ID to its renderer
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_RENDERERS: Record<string, (data: BiodataFormData) => string> = {
  // Free
  tpl_free_01: renderClassicRoyal,
  tpl_free_02: renderModernMinimal,
  // Standard
  tpl_std_01: renderOrnateGold,
  tpl_std_02: renderRoyalMaroon,
  tpl_std_03: renderOrnateGold,
  tpl_std_04: renderOrnateGold,
  // Premium
  tpl_prem_01: renderLavenderBloom,
  tpl_prem_02: renderGoldenHeritage,
  tpl_prem_03: renderLavenderBloom,
  tpl_prem_04: renderGoldenHeritage,
  tpl_prem_05: renderOrnateGold,
  // Luxury
  tpl_luxury_01: renderRoyalMaroon,
  tpl_luxury_02: renderGoldenHeritage,
  tpl_luxury_03: renderLavenderBloom,
  tpl_luxury_04: renderGoldenHeritage,
};

/**
 * Universal entry point — call this from pdfGenerator & preview modal.
 * Resolves template ID to the correct renderer, falls back to Classic Royal.
 */
export function renderTemplate(data: BiodataFormData, templateId: string): string {
  const renderer = TEMPLATE_RENDERERS[templateId] ?? renderClassicRoyal;
  return renderer(data);
}
