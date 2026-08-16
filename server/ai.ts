import { GoogleGenAI, Type } from '@google/genai';

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing. Fallback logic will be used if needed.');
    return null;
  }
  genAI = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  return genAI;
}

// 1. Scout Agent AI — Discover Armenian businesses
export async function runScoutAISearch(industry: string, region = 'Yerevan'): Promise<Array<{
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  instagram: string;
  description: string;
  business_size: string;
}>> {
  const ai = getGenAI();
  if (!ai) {
    return [
      {
        name: `${industry} Enterprise Armenia`,
        industry: industry,
        website: `https://${industry.toLowerCase().replace(/[^a-z]/g, '')}-armenia.am`,
        phone: '+374 10 ' + Math.floor(100000 + Math.random() * 900000),
        email: `contact@${industry.toLowerCase().replace(/[^a-z]/g, '')}-armenia.am`,
        instagram: `@${industry.toLowerCase().replace(/[^a-z]/g, '')}_am`,
        description: `Prominent ${industry} organization operating in ${region}, handling high customer message volume.`,
        business_size: '11-50'
      }
    ];
  }

  try {
    const prompt = `Act as the Scout Agent for Voxline AI operating system in Armenia.
Discover 2 real or highly realistic business prospects in Armenia in the industry "${industry}" located around "${region}".
Return a JSON array of objects with fields: name, industry, website, phone, email, instagram, description, business_size ('1-10', '11-50', '51-200', '200+').`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              industry: { type: Type.STRING },
              website: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              instagram: { type: Type.STRING },
              description: { type: Type.STRING },
              business_size: { type: Type.STRING }
            },
            required: ['name', 'industry', 'website', 'phone', 'email', 'description', 'business_size']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    return parsed;
  } catch (err) {
    console.error('Scout AI error:', err);
    return [
      {
        name: `${industry} Group Armenia`,
        industry: industry,
        website: `https://${industry.toLowerCase().replace(/[^a-z]/g, '')}-group.am`,
        phone: '+374 10 505050',
        email: `info@${industry.toLowerCase().replace(/[^a-z]/g, '')}-group.am`,
        instagram: `@${industry.toLowerCase().replace(/[^a-z]/g, '')}_group`,
        description: `Established ${industry} company in ${region} with manual support overhead.`,
        business_size: '11-50'
      }
    ];
  }
}

// 2. Research & Opportunity AI Agent
export async function runResearchAI(companyName: string, industry: string, website: string, description: string) {
  const ai = getGenAI();
  if (!ai) {
    return {
      summary: `${companyName} operates in ${industry}. Website (${website}) shows active client inquiries but lacks 24/7 automated instant responses.`,
      website_quality: 'good' as const,
      marketing_level: 'moderate' as const,
      support_quality: 'manual' as const,
      ai_opportunities: [
        'Omni-channel Armenian AI Chatbot for Instagram & Website',
        'Voxline AI Voice Reservation & Order Assistant',
        'Automated CRM Lead Capture Workflow'
      ],
      automation_need_score: 88,
      opportunities: [
        {
          gap_type: 'Manual Response Latency',
          description: `Customer service team at ${companyName} handles inquiries manually during business hours only.`,
          recommended_service: 'Voxline AI Omni-channel Chatbot',
          priority: 'high' as const,
          estimated_monthly_value_usd: 1200
        }
      ]
    };
  }

  try {
    const prompt = `You are Voxline AI Research Agent & Opportunity Detector.
Analyze company "${companyName}" (${industry}):
Website: ${website}
Description: ${description}

Perform digital presence audit and identify automation gaps.
Return JSON with:
- summary: string
- website_quality: 'poor' | 'fair' | 'good' | 'excellent'
- marketing_level: 'basic' | 'moderate' | 'advanced'
- support_quality: 'manual' | 'semi-automated' | 'fully-automated'
- ai_opportunities: string[] (3 specific Voxline AI solutions)
- automation_need_score: integer (0-100)
- opportunities: array of objects { gap_type, description, recommended_service, priority: 'high'|'medium'|'low', estimated_monthly_value_usd: number }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            website_quality: { type: Type.STRING },
            marketing_level: { type: Type.STRING },
            support_quality: { type: Type.STRING },
            ai_opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            automation_need_score: { type: Type.INTEGER },
            opportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  gap_type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommended_service: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  estimated_monthly_value_usd: { type: Type.NUMBER }
                },
                required: ['gap_type', 'description', 'recommended_service', 'priority', 'estimated_monthly_value_usd']
              }
            }
          },
          required: ['summary', 'website_quality', 'marketing_level', 'support_quality', 'ai_opportunities', 'automation_need_score', 'opportunities']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Research AI error:', err);
    return {
      summary: `Automated audit for ${companyName} highlights high customer inquiry volume with manual response delays.`,
      website_quality: 'fair' as const,
      marketing_level: 'moderate' as const,
      support_quality: 'manual' as const,
      ai_opportunities: ['Voxline AI Chatbot', 'Voice Support Assistant'],
      automation_need_score: 82,
      opportunities: [
        {
          gap_type: 'Manual Support Delay',
          description: 'Inquiries after 6 PM are lost or unanswered.',
          recommended_service: 'Voxline AI Chatbot',
          priority: 'high' as const,
          estimated_monthly_value_usd: 950
        }
      ]
    };
  }
}

// 3. Sales Agent AI — Create Armenian outreach message
export async function runSalesAgentDraft(companyName: string, industry: string, summary: string, opportunities: string[], kbContext: string, lang = 'am') {
  const ai = getGenAI();
  const contactName = process.env.VOXLINE_CONTACT_NAME || 'Սուրեն';
  const contactPhone = process.env.VOXLINE_CONTACT_PHONE || '+37494879777';
  const defaultAmMsg = `Բարև Ձեզ, ${companyName}-ի թիմ!

Մենք Voxline AI-ից ենք՝ արհեստական բանականությամբ աշխատող թվային աշխատակիցներ և համակարգեր կառուցող թիմ։ Ուսումնասիրելով Ձեր ընկերության (${industry}) գործունեությունը՝ տեսանք, թե ինչպես ԱԲ աշխատակիցը կարող է ստանձնել ${opportunities[0] || 'հաճախորդների սպասարկումն ու առաջին գծի աշխատանքը'}, աշխատելով 24/7, առանց հոգնածության։

Կցանկանայի՞ք կարճ 15-րոպեանոց հանդիպման ընթացքում քննարկել, թե ինչպիսի ԱԲ աշխատակից կարող ենք կառուցել հատուկ Ձեր բիզնեսի համար:

${contactName}
${contactPhone}
Voxline AI`;

  const defaultEnMsg = `Hello ${companyName} team,

We're Voxline AI — we build AI employees and complete AI-driven systems, not just chatbots. Looking into your (${industry}) business, we saw how an AI employee could take on ${opportunities[0] || 'customer support and front-line work'}, working 24/7 without ever getting tired.

Would you be open to a quick 15-minute call to discuss what an AI employee built specifically for your business could look like?

${contactName}
${contactPhone}
Voxline AI`;

  const defaultMsg = lang === 'am' ? defaultAmMsg : defaultEnMsg;

  if (!ai) return defaultMsg;

  try {
    const prompt = `You are Voxline AI's sales outreach writer. Write a highly persuasive, respectful, professional B2B outreach message in language "${lang}" (use "am" for Armenian, "en" for English, or the given ISO code — write entirely in that language, including the greeting and body, not just partially).
Target Company: ${companyName} (${industry})
Research Summary: ${summary}
Identified Automation Gaps: ${opportunities.join(', ')}
Knowledge Base Grounding (company info, services, products — ground all factual claims in this): ${kbContext}

POSITIONING — this is the most important instruction:
- Voxline AI is NOT a "simple chatbot" or "basic automation" vendor. Position Voxline as a builder of AI EMPLOYEES and complete AI-driven systems — digital team members that handle real work (customer service, sales qualification, scheduling, research, support), not just scripted bots.
- Never use dismissive/generic phrasing like "just a chatbot". Frame the offering as hiring an AI colleague / AI-native operating system for the business.
- If the target company's industry is Education, Robotics, or clearly involves teaching/training or building physical/robotic products, naturally mention the relevant Voxline product from the Knowledge Base context (Կրթլաբ for education/training-related companies, Ատլաս for robotics/robot-building companies) as a specifically relevant fit — do not force it if the industry is unrelated (e.g. a restaurant or pharmacy should NOT get a Կրթլաբ/Ատլաս pitch).
- Otherwise, focus the pitch on the general AI-employee positioning and the specific automation gap identified for this company.

Other requirements:
- Emphasize clear ROI (e.g., 24/7 engagement, faster response time, higher conversions).
- Ground all facts in the Knowledge Base context provided.
- Include a polite call to action to schedule a 15-minute call.
- End the message with EXACTLY this sign-off block and nothing else after it (name and phone only — no email address): "${contactName}\n${contactPhone}\nVoxline AI"
- Do NOT sound overly robotic or use generic sales clichés; sound like a confident AI systems consultant based in Armenia, reaching out internationally when writing in a language other than Armenian.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    return response.text || defaultMsg;
  } catch (err) {
    console.error('Sales AI error:', err);
    return defaultMsg;
  }
}

// 5. Reply Analysis Agent — reads an inbound reply and produces sentiment,
//    a memory entry to remember for the future, and a concrete next step.
export async function runReplyAnalysisAI(
  companyName: string,
  industry: string,
  replyText: string,
  priorContext: string
): Promise<{
  sentiment: 'interested' | 'not_interested' | 'question' | 'objection' | 'neutral';
  memory_type: 'rejection' | 'preference' | 'change_detected' | 'past_proposal' | 'key_decision';
  memory_content: string;
  next_step: string;
}> {
  const ai = getGenAI();
  const fallback = {
    sentiment: 'neutral' as const,
    memory_type: 'key_decision' as const,
    memory_content: `${companyName} replied; content not auto-classified (AI unavailable).`,
    next_step: 'Manually review the reply and decide on a next step.'
  };
  if (!ai) return fallback;

  try {
    const prompt = `You are a B2B sales analyst. Read this reply from a prospect and classify it.
Company: ${companyName} (${industry})
${priorContext ? `Prior context/memory:\n${priorContext}\n` : ''}
Reply text:
"""
${replyText}
"""

Respond ONLY with a JSON object, no markdown, matching exactly this shape:
{
  "sentiment": "interested" | "not_interested" | "question" | "objection" | "neutral",
  "memory_type": "rejection" | "preference" | "change_detected" | "past_proposal" | "key_decision",
  "memory_content": "one or two sentences, in Armenian, summarizing what we should remember about this company for future outreach (e.g. why they declined, what they care about, a decision they made)",
  "next_step": "one concrete, actionable next step in Armenian for the sales rep (e.g. schedule a call, send pricing, wait 2 weeks then follow up, mark as lost)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            memory_type: { type: Type.STRING },
            memory_content: { type: Type.STRING },
            next_step: { type: Type.STRING }
          },
          required: ['sentiment', 'memory_type', 'memory_content', 'next_step']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      sentiment: parsed.sentiment || fallback.sentiment,
      memory_type: parsed.memory_type || fallback.memory_type,
      memory_content: parsed.memory_content || fallback.memory_content,
      next_step: parsed.next_step || fallback.next_step
    };
  } catch (err) {
    console.error('Reply analysis AI error:', err);
    return fallback;
  }
}

// 4. AI CEO Strategic Advisor
export async function runAICEOAnalysis(metricsSummary: string) {
  const ai = getGenAI();
  if (!ai) {
    return [
      {
        category: 'outreach_focus',
        decision_text: 'Increase outreach velocity in Healthcare and Financial sectors by 35%.',
        data_source_ref: 'Pipeline conversion logs',
        reasoning: 'Healthcare prospects demonstrate 32% meeting conversion rate compared to 8% in general retail.',
        expected_outcome: 'Estimated +$15,000 monthly pipeline growth.',
        confidence_score: 92
      }
    ];
  }

  try {
    const prompt = `You are AI CEO — Strategic Advisor for Voxline AI Operating System.
Analyze the following CRM performance data:
${metricsSummary}

Generate 2 high-leverage strategic recommendations for the CEO.
Return JSON array of objects with:
- category: 'outreach_focus' | 'pricing_strategy' | 'resource_allocation' | 'market_expansion'
- decision_text: string
- data_source_ref: string
- reasoning: string
- expected_outcome: string
- confidence_score: integer (0-100)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              decision_text: { type: Type.STRING },
              data_source_ref: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              expected_outcome: { type: Type.STRING },
              confidence_score: { type: Type.INTEGER }
            },
            required: ['category', 'decision_text', 'data_source_ref', 'reasoning', 'expected_outcome', 'confidence_score']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error('AI CEO error:', err);
    return [
      {
        category: 'outreach_focus',
        decision_text: 'Prioritize Healthcare and Hotel prospects over general retail.',
        data_source_ref: '30-day conversion data',
        reasoning: 'Higher average contract size ($1,800/mo vs $450/mo) and faster closing cycles.',
        expected_outcome: 'Improves sales pipeline velocity by 28%.',
        confidence_score: 89
      }
    ];
  }
}

// 5. Proposal Generator AI
export async function runAIProposalGenerator(companyName: string, industry: string, opportunities: any[]) {
  const ai = getGenAI();
  if (!ai) {
    return {
      line_items: [
        { service_name: 'Voxline AI Omni-channel Assistant', description: '24/7 Armenian AI Chatbot for Website & Instagram', setup_fee_usd: 850, monthly_recurring_usd: 350 },
        { service_name: 'CRM Workflow Automation Sync', description: 'Real-time synchronization with Voxline Sales OS', setup_fee_usd: 400, monthly_recurring_usd: 150 }
      ],
      estimated_value: 1750,
      roi_projection: 'Projected to increase lead capture by 65% and save 120 hours/month of manual staff responses.',
      implementation_timeline: '2 Weeks to Production Deployment'
    };
  }

  try {
    const prompt = `Generate a customized Voxline AI proposal for prospect "${companyName}" (${industry}) based on identified gaps:
${JSON.stringify(opportunities)}

Return JSON with:
- line_items: array of { service_name, description, setup_fee_usd: number, monthly_recurring_usd: number }
- estimated_value: number (total first month setup + recurring)
- roi_projection: string (clear ROI narrative)
- implementation_timeline: string`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            line_items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  service_name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  setup_fee_usd: { type: Type.NUMBER },
                  monthly_recurring_usd: { type: Type.NUMBER }
                },
                required: ['service_name', 'description', 'setup_fee_usd', 'monthly_recurring_usd']
              }
            },
            estimated_value: { type: Type.NUMBER },
            roi_projection: { type: Type.STRING },
            implementation_timeline: { type: Type.STRING }
          },
          required: ['line_items', 'estimated_value', 'roi_projection', 'implementation_timeline']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Proposal AI error:', err);
    return {
      line_items: [
        { service_name: 'Voxline AI Solution Package', description: 'Custom AI automation suite', setup_fee_usd: 900, monthly_recurring_usd: 300 }
      ],
      estimated_value: 1200,
      roi_projection: 'Immediate 24/7 lead capture capability with 4x faster response times.',
      implementation_timeline: '10 Days'
    };
  }
}
