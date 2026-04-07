
import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InputSchema = z.object({
  products: z.array(z.object({
    size: z.string(),
    quantity: z.union([z.string(), z.number()])
  })),
  costPerUnit: z.number()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { products, costPerUnit } = InputSchema.parse(body);

    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
        // Fallback for demo if no keys, but in production we expect keys
        return NextResponse.json({ anchorSize: "12", price: costPerUnit * 1.5 });
    }

    const response = await ai.generate({
      prompt: `You are a world-class human hair market expert. 
      Given the following byproduct inventory and our internal cost per unit, suggest a single "anchor" selling price for one of the sizes.
      
      Cost per unit: ${costPerUnit}
      Inventory: ${JSON.stringify(products)}
      
      Rules:
      1. Suggest ONE anchor size (prefer mid-range like 10, 12, or 14 inches).
      2. Suggest a realistic market price that ensures a healthy profit (at least 30-50% margin).
      3. Return ONLY a JSON object in this format: {"anchorSize": "string", "price": number}
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
