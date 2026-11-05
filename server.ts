import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to format currency
function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

// Fallback generator if AI API key is not yet set or hits a rate limit
function generateRuleBasedThreeSentenceSummary(data: any): {
  summary: string;
  sentence1: string;
  sentence2: string;
  sentence3: string;
  mostChangedRegion: string;
  citedNumbers: string[];
} {
  const top = data.mostChangedAbsolute || (data.regionsData && data.regionsData[0]);
  if (!top) {
    const s1 = "No regional comparison data was available between Q2 and Q3.";
    const s2 = "Please ensure the uploaded CSV contains records for both Q2 and Q3.";
    const s3 = "Review your dataset quarters to re-run the regional revenue change analysis.";
    return {
      summary: `${s1} ${s2} ${s3}`,
      sentence1: s1,
      sentence2: s2,
      sentence3: s3,
      mostChangedRegion: "N/A",
      citedNumbers: [],
    };
  }

  const direction = top.deltaRevenue >= 0 ? "an increase" : "a decrease";
  const sign = top.deltaRevenue >= 0 ? "+" : "";
  const pctStr = `${sign}${top.pctChange.toFixed(1)}%`;
  const deltaStr = formatCurrency(Math.abs(top.deltaRevenue));
  const q2Str = formatCurrency(top.q2Revenue);
  const q3Str = formatCurrency(top.q3Revenue);

  // Sentence 1: Identification & exact numbers
  const sentence1 = `${top.region} experienced the largest revenue change from Q2 to Q3, moving from ${q2Str} to ${q3Str}, representing ${direction} of ${deltaStr} (${pctStr}).`;

  // Sentence 2: Why (drivers)
  let sentence2 = "";
  if (top.topProductDriver) {
    const p = top.topProductDriver;
    const pSign = p.deltaRevenue >= 0 ? "+" : "";
    sentence2 = `This shift was primarily driven by the ${p.product} product line, where revenue shifted from ${formatCurrency(p.q2Revenue)} to ${formatCurrency(p.q3Revenue)} (${pSign}${p.pctChange.toFixed(1)}%) alongside a ${p.deltaUnits >= 0 ? 'gain' : 'drop'} of ${Math.abs(p.deltaUnits).toLocaleString()} units.`;
  } else if (top.deltaUnits !== undefined) {
    sentence2 = `The regional change was fueled by total unit volume moving from ${top.q2Units.toLocaleString()} to ${top.q3Units.toLocaleString()} units with an average discount rate of ${top.avgDiscountQ3 ? top.avgDiscountQ3.toFixed(1) : 0}%.`;
  } else {
    sentence2 = `Performance was heavily influenced by shifts in order volume and quarterly channel mix across the regional sales footprint.`;
  }

  // Sentence 3: Context / comparison
  const overallDelta = data.overallStats?.deltaRevenue ?? 0;
  const overallPct = data.overallStats?.pctChange ?? 0;
  const overallSign = overallDelta >= 0 ? "+" : "";
  const sentence3 = `Across the entire company, total quarterly revenue shifted by ${overallSign}${formatCurrency(overallDelta)} (${overallSign}${overallPct.toFixed(1)}%), highlighting ${top.region}'s pivotal role in the quarter-over-quarter trend.`;

  return {
    summary: `${sentence1} ${sentence2} ${sentence3}`,
    sentence1,
    sentence2,
    sentence3,
    mostChangedRegion: top.region,
    citedNumbers: [q2Str, q3Str, deltaStr, pctStr],
  };
}

// API endpoint to generate strictly calculated 3-sentence summary
app.post('/api/summarize-q2-q3', async (req, res) => {
  try {
    const { regionsData, mostChangedAbsolute, mostChangedPercentage, overallStats } = req.body;

    if (!regionsData || !Array.isArray(regionsData) || regionsData.length === 0) {
      return res.status(400).json({ error: 'Missing calculated regionsData payload.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Falling back to deterministic mathematical summary.');
      const fallbackResult = generateRuleBasedThreeSentenceSummary({
        regionsData,
        mostChangedAbsolute,
        mostChangedPercentage,
        overallStats,
      });
      return res.json({
        ...fallbackResult,
        source: 'calculated_rule_engine',
        note: 'Generated using deterministic calculated figures (Gemini API key not detected in environment).',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextPayload = {
      overallQuarterlyTotals: {
        companyQ2TotalRevenue: formatCurrency(overallStats?.q2Revenue || 0),
        companyQ3TotalRevenue: formatCurrency(overallStats?.q3Revenue || 0),
        companyDeltaRevenue: formatCurrency(overallStats?.deltaRevenue || 0),
        companyPctChange: `${(overallStats?.pctChange || 0).toFixed(1)}%`,
      },
      regionWithLargestAbsoluteChange: mostChangedAbsolute ? {
        region: mostChangedAbsolute.region,
        q2Revenue: formatCurrency(mostChangedAbsolute.q2Revenue),
        q3Revenue: formatCurrency(mostChangedAbsolute.q3Revenue),
        dollarChange: `${mostChangedAbsolute.deltaRevenue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(mostChangedAbsolute.deltaRevenue))}`,
        percentageChange: `${mostChangedAbsolute.deltaRevenue >= 0 ? '+' : ''}${mostChangedAbsolute.pctChange.toFixed(1)}%`,
        q2Units: mostChangedAbsolute.q2Units.toLocaleString(),
        q3Units: mostChangedAbsolute.q3Units.toLocaleString(),
        unitChange: `${mostChangedAbsolute.deltaUnits >= 0 ? '+' : ''}${mostChangedAbsolute.deltaUnits.toLocaleString()}`,
        avgDiscountQ2: `${(mostChangedAbsolute.avgDiscountQ2 || 0).toFixed(1)}%`,
        avgDiscountQ3: `${(mostChangedAbsolute.avgDiscountQ3 || 0).toFixed(1)}%`,
        topProductDrivers: mostChangedAbsolute.productDrivers?.slice(0, 3).map((p: any) => ({
          product: p.product,
          q2Revenue: formatCurrency(p.q2Revenue),
          q3Revenue: formatCurrency(p.q3Revenue),
          deltaRevenue: `${p.deltaRevenue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(p.deltaRevenue))}`,
          pctChange: `${p.deltaRevenue >= 0 ? '+' : ''}${p.pctChange.toFixed(1)}%`,
          deltaUnits: `${p.deltaUnits >= 0 ? '+' : ''}${p.deltaUnits.toLocaleString()}`,
        })),
        channelBreakdown: mostChangedAbsolute.channelDrivers?.slice(0, 3).map((c: any) => ({
          channel: c.channel,
          q2Revenue: formatCurrency(c.q2Revenue),
          q3Revenue: formatCurrency(c.q3Revenue),
          pctChange: `${c.deltaRevenue >= 0 ? '+' : ''}${c.pctChange.toFixed(1)}%`,
        })),
      } : null,
      regionWithLargestPercentageChange: mostChangedPercentage ? {
        region: mostChangedPercentage.region,
        percentageChange: `${mostChangedPercentage.deltaRevenue >= 0 ? '+' : ''}${mostChangedPercentage.pctChange.toFixed(1)}%`,
        dollarChange: `${mostChangedPercentage.deltaRevenue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(mostChangedPercentage.deltaRevenue))}`,
      } : null,
      allRegionsSummary: regionsData.map((r: any) => ({
        region: r.region,
        q2Revenue: formatCurrency(r.q2Revenue),
        q3Revenue: formatCurrency(r.q3Revenue),
        deltaRevenue: `${r.deltaRevenue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(r.deltaRevenue))}`,
        pctChange: `${r.deltaRevenue >= 0 ? '+' : ''}${r.pctChange.toFixed(1)}%`,
      })),
    };

    const systemInstruction = `You are a rigorous financial analytics engine.
Your task is to write an executive summary that is EXACTLY THREE SENTENCES long.
CRITICAL RULES:
1. Length: Exactly 3 sentences. No more, no fewer.
2. Grounding: You MUST ONLY use the numbers, dollar amounts, percentages, and units explicitly provided in the calculated data payload. Do NOT fabricate, extrapolate, round differently, or introduce any figures not present in the payload.
3. Content:
   - Sentence 1: Identify which region changed most from Q2 to Q3, citing its exact starting Q2 revenue, Q3 revenue, and the exact dollar and percentage change calculated.
   - Sentence 2: Explain WHY that region changed, citing specific calculated numbers such as product driver changes, unit volume fluctuations, or channel trends provided in the payload.
   - Sentence 3: Compare this region's performance against overall company performance or the second-ranked region using only the provided numbers.`;

    const userPrompt = `Here are the exact numbers calculated by the application for Q2 to Q3 sales performance:
${JSON.stringify(contextPayload, null, 2)}

Write an executive three-sentence summary answering: Which region changed most from Q2 to Q3, and why? Use ONLY the numbers above.`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out (15s limit)')), 15000)
    );

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'The complete three-sentence summary text.',
            },
            sentence1: {
              type: Type.STRING,
              description: 'The first sentence identifying the region that changed most and its Q2 to Q3 numbers.',
            },
            sentence2: {
              type: Type.STRING,
              description: 'The second sentence explaining why it changed using product/channel/unit drivers.',
            },
            sentence3: {
              type: Type.STRING,
              description: 'The third sentence providing comparative context using company or regional figures.',
            },
            mostChangedRegion: {
              type: Type.STRING,
              description: 'The name of the region that changed most.',
            },
            citedNumbers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of exact formatted numbers cited in the summary (e.g. $1,234,567, +14.2%).',
            },
          },
          required: ['summary', 'sentence1', 'sentence2', 'sentence3', 'mostChangedRegion'],
        },
      },
    });

    const response: any = await Promise.race([aiPromise, timeoutPromise]);

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    // Graceful fallback to calculated rule engine so the user still gets a 100% accurate 3-sentence summary based on the app's calculations
    const fallbackResult = generateRuleBasedThreeSentenceSummary(req.body);
    return res.json({
      ...fallbackResult,
      source: 'calculated_rule_engine',
      note: 'Generated using calculated figures due to model response fallback: ' + (error?.message || 'Gemini service unreachable'),
    });
  }
});

// Setup dev server middlewares or static file serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
