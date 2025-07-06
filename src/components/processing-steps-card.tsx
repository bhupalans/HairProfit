'use client';

import type { ProcessingStep } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Wrench, HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProcessingStepsCardProps {
  steps: ProcessingStep[];
  currency: string;
  onStepChange: (index: number, field: keyof Omit<ProcessingStep, 'id'>, value: string | number) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
}

export default function ProcessingStepsCard({
  steps,
  currency,
  onStepChange,
  onAddStep,
  onRemoveStep,
}: ProcessingStepsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          Processing Steps
        </CardTitle>
        <CardDescription>Add costs and wastage for processing and treatments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <AnimatePresence>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3"
              >
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor={`step-name-${index}`}>Process Name</Label>
                  <Input
                    id={`step-name-${index}`}
                    placeholder="e.g., Coloring"
                    value={step.name}
                    onChange={(e) => onStepChange(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`step-cost-${index}`}>Expense ({currency})</Label>
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-5 w-5 cursor-help" type="button">
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total fixed cost for this step (materials, labor, etc.).<br/>This is NOT a per-unit cost.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id={`step-cost-${index}`}
                    type="number"
                    className="w-28"
                    placeholder="e.g., 250"
                    value={step.cost}
                    onChange={(e) => onStepChange(index, 'cost', e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`step-wastage-${index}`}>Wastage (units)</Label>
                     <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-5 w-5 cursor-help" type="button">
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of hair units lost or discarded during this step.<br/>This is subtracted from your initial purchase quantity.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id={`step-wastage-${index}`}
                    type="number"
                    className="w-28"
                    placeholder="e.g., 5"
                    value={step.wastage}
                    onChange={(e) => onStepChange(index, 'wastage', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveStep(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddStep}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Processing Step
        </Button>
      </CardContent>
    </Card>
  );
}
