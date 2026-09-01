import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence directory
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CLOUD_DB_FILE = path.join(DATA_DIR, 'cloud_census.json');

// Initialize cloud database file if not present
let cloudData = {
  villageInfo: {
    villageNameKhmer: 'ភូមិព្រែកតូច',
    villageNameLatin: 'Prek Touch Village',
    villageCode: '០៨០៤០២០១',
    communeName: 'ឃុំកោះធំ',
    districtName: 'ស្រុកកោះធំ',
    provinceName: 'ខេត្តកណ្តាល',
    villageChiefName: 'លោក ស៊ឹម សុវណ្ណ',
    villageChiefPhone: '012 889 900',
    surveyorName: 'កញ្ញា ម៉ែន ស្រីពៅ',
    surveyYear: 2026,
    totalGroupsCount: 5,
  },
  households: [] as any[],
  lastSyncedAt: Date.now(),
};

try {
  if (fs.existsSync(CLOUD_DB_FILE)) {
    const raw = fs.readFileSync(CLOUD_DB_FILE, 'utf-8');
    cloudData = JSON.parse(raw);
  } else {
    fs.writeFileSync(CLOUD_DB_FILE, JSON.stringify(cloudData, null, 2));
  }
} catch (e) {
  console.warn('Could not read cloud_census.json, using in-memory default', e);
}

function saveCloudData() {
  try {
    cloudData.lastSyncedAt = Date.now();
    fs.writeFileSync(CLOUD_DB_FILE, JSON.stringify(cloudData, null, 2));
  } catch (e) {
    console.error('Failed to write to cloud_census.json', e);
  }
}

// ----------------- API ROUTES ----------------- //

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), householdsCount: cloudData.households.length });
});

// Get Village Cloud Info
app.get('/api/village', (req, res) => {
  res.json({ success: true, villageInfo: cloudData.villageInfo });
});

// Update Village Cloud Info
app.post('/api/village', (req, res) => {
  if (req.body && req.body.villageInfo) {
    cloudData.villageInfo = req.body.villageInfo;
    saveCloudData();
    res.json({ success: true, villageInfo: cloudData.villageInfo });
  } else {
    res.status(400).json({ success: false, message: 'Invalid villageInfo payload' });
  }
});

// Get all Cloud Households
app.get('/api/households', (req, res) => {
  res.json({ success: true, households: cloudData.households, total: cloudData.households.length });
});

// Two-way synchronization endpoint
app.post('/api/census/sync', (req, res) => {
  try {
    const { queue, localHouseholds, villageInfo, clientTimestamp } = req.body;

    if (villageInfo) {
      cloudData.villageInfo = villageInfo;
    }

    // Process queued operations
    if (Array.isArray(queue) && queue.length > 0) {
      for (const item of queue) {
        if (item.action === 'delete') {
          cloudData.households = cloudData.households.filter((h: any) => h.id !== item.householdId);
        } else if (item.data) {
          const idx = cloudData.households.findIndex((h: any) => h.id === item.householdId);
          if (idx >= 0) {
            // Compare timestamps / versions for conflict resolution
            if (!cloudData.households[idx].updatedAt || item.data.updatedAt >= cloudData.households[idx].updatedAt) {
              cloudData.households[idx] = item.data;
            }
          } else {
            cloudData.households.push(item.data);
          }
        }
      }
    }

    // If server had no households yet and client uploaded their local list
    if (cloudData.households.length === 0 && Array.isArray(localHouseholds) && localHouseholds.length > 0) {
      cloudData.households = [...localHouseholds];
    } else if (Array.isArray(localHouseholds)) {
      // Merge any new client households not present on server
      for (const localH of localHouseholds) {
        const found = cloudData.households.find((h: any) => h.id === localH.id);
        if (!found) {
          cloudData.households.push(localH);
        } else if (localH.updatedAt > (found.updatedAt || 0)) {
          const idx = cloudData.households.indexOf(found);
          cloudData.households[idx] = localH;
        }
      }
    }

    saveCloudData();

    res.json({
      success: true,
      serverHouseholds: cloudData.households,
      serverVillageInfo: cloudData.villageInfo,
      lastSyncedAt: Date.now(),
      message: 'Synchronization successful',
    });
  } catch (err: unknown) {
    console.error('Sync error:', err);
    res.status(500).json({ success: false, message: 'Server synchronization error' });
  }
});

// AI Census Insights Analysis via Gemini API
app.post('/api/census/ai-report', async (req, res) => {
  const { village, households } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    // Graceful structured analytical fallback
    return res.json({
      summaryHtml: `<p><strong>ការវិភាគស្ថិតិភូមិ ${village?.villageNameKhmer || ''}៖</strong> មានប្រជាជនសរុប ${households?.reduce((acc: number, h: any) => acc + (h.members?.length || 0), 0) || 0} នាក់ លើ ${households?.length || 0} គ្រួសារ។</p>`,
      recommendations: [
        'ពង្រឹងការបណ្តុះបណ្តាលមុខរបរបន្ថែមដល់គ្រួសារកសិករ',
        'ជំរុញការទទួលបានប្រភពទឹកស្អាត និងបង្គន់អនាម័យ ១០០%',
        'ពង្រីកការផ្សព្វផ្សាយអំពីប័ណ្ណមូលនិធិសមធម៌សុខាភិបាល និង ប.ស.ស'
      ]
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
អ្នកគឺជាអ្នកជំនាញវិភាគស្ថិតិប្រជាសាស្ត្រ និងអភិវឌ្ឍន៍សហគមន៍ភូមិ-ឃុំនៅប្រទេសកម្ពុជា។
សូមវិភាគទិន្នន័យជំរឿនភូមិខាងក្រោម ហើយផ្តល់របាយការណ៍វិភាគសង្ខេបជាភាសាខ្មែរ (Khmer language)៖

ព័ត៌មានភូមិ: ${JSON.stringify(village || {})}
ទិន្នន័យគ្រួសារនិងប្រជាជនសរុប: ${households?.length || 0} គ្រួសារ
ទិន្នន័យសង្ខេប:
${JSON.stringify(
  (households || []).slice(0, 15).map((h: any) => ({
    code: h.householdCode,
    poverty: h.povertyLevel,
    members: h.members?.length,
    water: h.wash?.waterSourceDry,
    latrine: h.wash?.hasLatrine,
    electricity: h.energyAssets?.electricitySource,
    land: h.energyAssets?.agriculturalLandHectares
  }))
)}

សូមឆ្លើយតបជាទម្រង់ JSON ដែលមាន 2 fields:
{
  "summaryHtml": "<p>កថាខណ្ឌវិភាគសង្ខេបអំពីស្ថានភាពប្រជាសាស្ត្រ ជីវភាព និងសេដ្ឋកិច្ចសង្គមក្នុងភូមិ...</p>",
  "recommendations": ["អនុសាសន៍ទី១...", "អនុសាសន៍ទី២...", "អនុសាសន៍ទី៣...", "អនុសាសន៍ទី៤..."]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error) {
    console.error('Gemini analysis error:', error);
    res.json({
      summaryHtml: `<p>របាយការណ៍វិភាគស្ថិតិភូមិ ${village?.villageNameKhmer || ''}៖ គ្រួសារសរុប ${households?.length || 0} គ្រួសារ។</p>`,
      recommendations: [
        'លើកកម្ពស់អនាម័យនិងទឹកស្អាតជនបទ',
        'គាំទ្រការបង្កើតមុខរបរដល់គ្រួសារក្រីក្រ',
        'តាមដានការអប់រំរបស់កុមារក្នុងភូមិ'
      ]
    });
  }
});

// ----------------- VITE MIDDLEWARE ----------------- //

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Village Census Server running on http://localhost:${PORT}`);
  });
}

startServer();
