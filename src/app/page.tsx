import Link from 'next/link';
import {
  Calculator,
  BarChart2,
  Users,
  FileText,
  Receipt,
  Sparkles,
  Beaker,
  Store,
  Bot,
  Settings,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const tools = [
  {
    title: 'Hair Marketplace',
    description: 'Find buyers and sellers. Post listings to attract opportunities.',
    href: '/marketplace',
    icon: <Store className="h-8 w-8" />,
  },
  {
    title: 'Profit Calculator',
    description: 'Calculate costs, profit, and margin for your hair products.',
    href: '/profit-calculator',
    icon: <Calculator className="h-8 w-8" />,
  },
  {
    title: 'Advanced Calculator',
    description: 'Auto-price byproducts based on cost and target profit margin.',
    href: '/advanced-calculator',
    icon: <Beaker className="h-8 w-8" />,
  },
  {
    title: 'Advanced AI Calculator',
    description: 'Auto-price byproducts with anchor logic and AI market suggestions.',
    href: '/advanced-AI-calculator',
    icon: <Bot className="h-8 w-8" />,
  },
  {
    title: 'Reverse Calculator',
    description: 'Validate buyer quotes instantly based on raw costs and yields.',
    href: '/reverse-calculator',
    icon: <ArrowRightLeft className="h-8 w-8" />,
  },
  {
    title: 'Market Comparison',
    description: 'Get AI-powered market price estimations for any hair type.',
    href: '/market-comparison',
    icon: <BarChart2 className="h-8 w-8" />,
  },
  {
    title: 'Buyer Analysis',
    description: 'Generate detailed buyer personas for your target markets.',
    href: '/buyer-analysis',
    icon: <Users className="h-8 w-8" />,
  },
  {
    title: 'Price Quotation',
    description: 'Create and manage professional price quotations for clients.',
    href: '/price-quotation',
    icon: <FileText className="h-8 w-8" />,
  },
  {
    title: 'Invoice Builder',
    description: 'Generate and download PDF invoices from your quotations.',
    href: '/invoice',
    icon: <Receipt className="h-8 w-8" />,
  },
  {
    title: 'Business Settings',
    description: 'Manage default terms, conditions, and payment details.',
    href: '/settings/business',
    icon: <Settings className="h-8 w-8" />,
  },
];

const PRO_ROUTES = [
  '/marketplace',
  '/advanced-AI-calculator',
  '/reverse-calculator',
  '/market-comparison',
  '/buyer-analysis',
  '/price-quotation',
  '/invoice'
];

export default function Home() {
  
  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-left mb-12">
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <h1 className="text-4xl sm:text-4xl font-bold tracking-tight">
              Hair Business Dashboard
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
            The business software for the hair trade. Calculate profit, create quotes, and analyze market prices for hair extensions, wigs, and bundles.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
  const isPro = PRO_ROUTES.includes(tool.href);

  return (
    <Link href={tool.href} key={tool.title} className="group">
      <Card className="relative h-full flex flex-col hover:border-primary hover:shadow-lg transition-all duration-200">
        
        {isPro && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
            PRO
          </div>
        )}

        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="bg-primary/10 text-primary p-3 rounded-lg group-hover:scale-110 transition-transform">
            {tool.icon}
          </div>
          <div>
            <CardTitle className="text-2xl">{tool.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <CardDescription className="text-base">
            {tool.description}
          </CardDescription>
        </CardContent>

      </Card>
    </Link>
  );
})}
        </div>
      </div>
    </main>
  );
}
