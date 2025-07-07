import Link from 'next/link';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const faqs = [
  {
    question: 'How is the Invoice & Quotation numbering logic implemented?',
    answer:
      "Both invoice and quotation numbers are designed to auto-increment sequentially. They follow a standard format like Q-YYYY-NNN for quotes and YYYY-NNNN for invoices. The sequence number automatically resets to '001' at the beginning of each new year, which is standard accounting practice.",
  },
  {
    question: 'How do I convert a Quotation into an Invoice?',
    answer:
      'On the Price Quotation page, once your quote is finalized, simply click the "Create Invoice" button. The system will automatically carry over all relevant information—client details, your details, and pricing—to the invoice form. The prices will be converted to the customer-facing "display currency" from the quote. You just need to set the due date and download the PDF.',
  },
  {
    question:
      'What is the difference between "Pricing Currency" and "Display Currency" in Quotations?',
    answer:
      '"Pricing Currency" is your internal currency, used for your own cost calculations. "Display Currency" is the currency your customer will see. You can set an exchange rate to automatically convert prices for the customer-facing quote. When an invoice is created, it is finalized in the "Display Currency".',
  },
  {
    question: 'How can I back up or move my data?',
    answer:
      'On the main dashboard, the Price Quotation page, and the Invoice Builder page, you can use the "Export JSON" button. This saves a file containing all the data for that specific calculation or document. You can then use the "Import JSON" button on another device or browser to load that data back in.',
  },
  {
    question: 'What does "Wastage (units)" mean?',
    answer:
      'In the "Processing Steps" section, "Wastage" refers to the number of hair units that are lost or become unusable during a specific treatment (like coloring or trimming). This amount is subtracted from your initial quantity to calculate the final number of sellable units and is also used to determine the total cost of lost materials.',
  },
];

export default function HelpPage() {
  return (
    <div className="bg-muted min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
              <LifeBuoy className="h-10 w-10" />
            </div>
            <CardTitle className="text-4xl font-bold tracking-tight">
              Help Center
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Find answers to common questions about using the HairProfit app.
            </p>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
