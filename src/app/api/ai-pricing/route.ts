import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InputSchema = z.object({
  products: z.array(z.object({
    size: z.string(),
    quantity: z.union([z.string(), z.number()])
  })),
  costPerUnit: z.number(),
  category: z.string().optional().default('Non-Remy Hair')
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { products, costPerUnit, category } = InputSchema.parse(body);

    const response = await ai.generate({
      prompt: `You are a professional human hair trader. 
      
      Category: ${category}
      Our internal cost per unit: ${costPerUnit}
      Current byproduct inventory: ${JSON.stringify(products)}
      
      Rules:
      1. Suggest ONE anchor size (prefer 10, 12, 14, or 16 inches).
      2. Suggest a realistic market price that ensures at least a 20-40% profit margin.
      3. Follow realistic market behavior for the "${category}" category:
         - Non-Remy: 6–8 inch are often very low price (bulk market), long sizes increase gradually.
         - Remy: Premium pricing across all sizes with significant jumps for longer lengths.
         - Extensions: Long sizes (20"+) are significantly more expensive.
         - Wigs: Less price variation purely by length compared to bundles.
      4. Return ONLY a JSON object in this format: {"anchorSize": "string", "price": number}
      `,
      output: {
        schema: z.object({
          anchorSize: z.string(),
          price: z.number()
        })
      }
    });

    const output = response.output;
    if (!output) {
        throw new Error("No output from AI");
    }

    return NextResponse.json(output);
  } catch (error: any) {
    console.error('AI Pricing API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
