'use server';
/**
 * @fileOverview AI Badminton Coach Flow.
 * 
 * - analyzePerformance: Analyzes match history to provide insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchInfoSchema = z.object({
  date: z.string(),
  type: z.string(),
  opponent: z.string(),
  result: z.string(),
  myScore: z.array(z.number()),
  opponentScore: z.array(z.number()),
  notes: z.string().optional(),
});

const AnalyzePerformanceInputSchema = z.object({
  matches: z.array(MatchInfoSchema),
  playerName: z.string(),
});
export type AnalyzePerformanceInput = z.infer<typeof AnalyzePerformanceInputSchema>;

const AnalyzePerformanceOutputSchema = z.object({
  analysis: z.string().describe('A summary of the overall performance.'),
  strengths: z.array(z.string()).describe('List of identified strengths.'),
  weaknesses: z.array(z.string()).describe('List of areas for improvement.'),
  recommendations: z.array(z.string()).describe('Specific training tips.'),
});
export type AnalyzePerformanceOutput = z.infer<typeof AnalyzePerformanceOutputSchema>;

export async function analyzePerformance(input: AnalyzePerformanceInput): Promise<AnalyzePerformanceOutput> {
  return analyzePerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePerformancePrompt',
  input: { schema: AnalyzePerformanceInputSchema },
  output: { schema: AnalyzePerformanceOutputSchema },
  prompt: `You are a world-class professional badminton coach. 
Analyze the match history for the player named "{{{playerName}}}".

Match Data:
{{#each matches}}
- Date: {{{date}}}, Type: {{{type}}}, vs {{{opponent}}}, Result: {{{result}}}
  Scores: {{{myScore}}} vs {{{opponentScore}}}
  Notes: {{{notes}}}
{{/each}}

Identify trends in their wins and losses. Look at score gaps (tight games vs blowouts) and any patterns in their notes. 
Provide a professional, encouraging, and highly technical analysis.`,
});

const analyzePerformanceFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceFlow',
    inputSchema: AnalyzePerformanceInputSchema,
    outputSchema: AnalyzePerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate analysis');
    return output;
  }
);
