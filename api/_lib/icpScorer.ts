import { Company } from '../../src/types/index.js';

interface IcpScoreInput {
  company: Partial<Company>;
  targetProfile?: {
    industries?: string[];
    companySizes?: string[];
    keywords?: string[];
    minScore?: number;
  };
}

export function computeIcpScore({ company, targetProfile = {} }: IcpScoreInput) {
  let score = 50;
  const reasons: string[] = [];

  const targetIndustries = (targetProfile.industries || []).map((i) => i.toLowerCase());
  if (targetIndustries.length && company.industry && targetIndustries.includes(company.industry.toLowerCase())) {
    score += 20;
    reasons.push(`Industry match: ${company.industry}`);
  }

  const targetSizes = targetProfile.companySizes || [];
  if (targetSizes.length && company.business_size && targetSizes.includes(company.business_size)) {
    score += 15;
    reasons.push(`Company size match: ${company.business_size}`);
  }

  if (company.website) {
    score += 10;
    reasons.push('Has website for research and personalization');
  }

  if (company.email || company.phone) {
    score += 15;
    reasons.push('Has a direct contact channel');
  }

  const text = `${company.name || ''} ${company.description || ''}`.toLowerCase();
  for (const keyword of targetProfile.keywords || []) {
    if (text.includes(keyword.toLowerCase())) {
      score += 5;
      reasons.push(`Keyword signal: ${keyword}`);
    }
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const priority: 'high' | 'medium' | 'low' = finalScore >= 80 ? 'high' : finalScore >= 60 ? 'medium' : 'low';

  if (!reasons.length) reasons.push('Baseline ICP score from discovery data');
  return { score: finalScore, reasons, priority };
}
