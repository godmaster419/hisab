# 💼 HISAB (हिसाब) — हर पैसे का साफ़ हिसाब

> **Event-wise Money & Expense Accounting System with Month-wise Contribution Tracking, Dukandar Diary, and Instant PDF Reports.**

🌐 **Live Website URL:** [https://godmaster419.github.io/hisab/](https://godmaster419.github.io/hisab/)

---

## ✨ Features (मुख्य विशेषताएं)

- 👥 **महीनेवार अंशदान (Month-wise Contribution):**
  - **जो जिस महीने दिया, उसी में दिखे:** प्रत्येक माह का अंशदान रिकॉर्ड अलग और साफ़ रहता है।
  - **चालू माह स्थिति:** जमा करने वाले सदस्यों के आगे `✓ जमा (Paid)`, और जिन्होंने नहीं दिया उनके आगे बिना टिक का `[  ] बाकी (Pending)` दिखता है।
  - **पिछले माह का बकाया (Previous Months Unpaid):** पुराने महीनों के केवल वही सदस्य दिखते हैं जिनका अंशदान बाकी है, चुकता सदस्यों की भीड़ नहीं दिखती।

- 🏷️ **बहु-प्रयोजनीय इवेंट्स (Multi-Type Events):**
  - **सामान्य इवेंट / शादी / टूर:** आय, खर्च और व्यक्ति-वार कुल देनदारी।
  - **दुकानदार डायरी (Dukandar Diary):** उधारी, जमा और शेष का सरल बहीखाता।
  - **मासिक अंशदान समिति / क्लब:** हर महीने का नियमित चंदा और खर्च।

- 📄 **व्यावसायिक PDF और प्रिंट रिपोर्ट (Professional PDF Reports):**
  - 1-क्लिक में A4 प्रिंटेबल चालान/रिपोर्ट जनरेट करें।
  - चालू माह अंशदान चेकलिस्ट और पिछले महीनों की बकाया सूची ऑटोमैटिक शामिल।
  - हिंदी भाषा समर्थन और साफ़ सुथरा लेआउट।

- 📱 **मोबाइल-फ्रेंडली और PWA (Progressive Web App):**
  - मोबाइल, टैबलेट और डेस्कटॉप पर सहज अनुभव।
  - ऑफलाइन चलने योग्य (Local-first) — आपका डेटा आपके डिवाइस पर सुरक्षित।

---

## 🚀 Live Demo

वेबसाइट GitHub Pages पर लाइव है:
👉 **[https://godmaster419.github.io/hisab/](https://godmaster419.github.io/hisab/)**

---

## 🛠️ स्थानीय विकास (Local Development)

```bash
# 1. रिपॉजिटरी क्लोन करें
git clone https://github.com/godmaster419/hisab.git
cd hisab

# 2. डिपेंडेंसी इंस्टॉल करें
npm install

# 3. डेवलपमेंट सर्वर शुरू करें
npm run dev
```

ब्राउज़र में खोलें: `http://localhost:3000`

---

## 📦 प्रोडक्शन बिल्ड और डिप्लॉयमेंट

```bash
# स्टैटिक एक्सपोर्ट बिल्ड करें
npm run build
```

यह प्रोजेक्ट GitHub Actions द्वारा ऑटोमैटिक रूप से GitHub Pages पर डिप्लॉय होता है (`.github/workflows/deploy.yml`).
