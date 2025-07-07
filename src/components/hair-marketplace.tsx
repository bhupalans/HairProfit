
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PlusCircle, ShoppingCart, Search, Handshake, Loader2, Mail, Phone, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { MarketplaceListing, MarketplaceListingFormData } from '@/types';
import { marketplaceListingFormSchema } from '@/types';
import { getListings, createListing } from '@/app/actions';

const ListingSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader>
            <Skeleton className="w-full rounded-lg aspect-[3/2]" />
            <Skeleton className="h-6 w-3/4 mt-4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

const ContactInfo = ({ contact }: { contact: string }) => {
    const isEmail = contact.includes('@');
    const isPhone = /^\+?[0-9\s-()]+$/.test(contact);
    
    let Icon = MessageSquare;
    let href = '#';
    if (isEmail) {
        Icon = Mail;
        href = `mailto:${contact}`;
    } else if (isPhone) {
        Icon = Phone;
        href = `tel:${contact}`;
    }

    return (
        <Button asChild className="w-full">
            <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="mr-2" /> Contact
            </a>
        </Button>
    )
};

export default function HairMarketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<MarketplaceListingFormData>({
    resolver: zodResolver(marketplaceListingFormSchema),
    defaultValues: {
      type: 'For Sale',
      title: '',
      description: '',
      price: '',
      contact: '',
    },
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const response = await getListings();
    if (response.success && response.data) {
      setListings(response.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to load listings',
        description: response.error,
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onSubmit = async (values: MarketplaceListingFormData) => {
    const response = await createListing(values);
    if (response.success) {
      toast({
        title: 'Listing Created!',
        description: 'Your new listing is now live on the marketplace.',
      });
      setIsDialogOpen(false);
      form.reset();
      fetchListings(); // Refetch to show the new listing
    } else {
       toast({
        variant: 'destructive',
        title: 'Failed to create listing',
        description: response.error,
      });
    }
  };

  const forSaleListings = listings.filter(l => l.type === 'For Sale');
  const lookingForListings = listings.filter(l => l.type === 'Looking to Buy');

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Hair Marketplace</h1>
            <p className="text-muted-foreground mt-2">
              Discover opportunities. Connect with buyers and sellers in the hair industry.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <PlusCircle className="mr-2" />
                Create Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a New Listing</DialogTitle>
                <DialogDescription>
                  Share what you're selling or looking to buy. Fill out the details below.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="For Sale">Selling Hair</SelectItem>
                            <SelectItem value="Looking to Buy">Looking for Hair</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Premium Vietnamese Bone Straight" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Include details like length, texture, quantity, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price / Budget</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $85 per bundle" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Info</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email or phone number" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                   <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Listing
                        </Button>
                    </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </header>

        <Tabs defaultValue="for-sale">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="for-sale">
              <ShoppingCart className="mr-2" /> For Sale
            </TabsTrigger>
            <TabsTrigger value="looking-to-buy">
              <Search className="mr-2" /> Looking to Buy
            </TabsTrigger>
          </TabsList>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => <ListingSkeleton key={i} />)
            ) : (
                <>
                    <TabsContent value="for-sale" className="contents">
                        <AnimatePresence>
                        {forSaleListings.map(listing => (
                            <motion.div layout key={listing.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Card className="flex flex-col h-full">
                            <CardHeader>
                                <Image
                                src={listing.imageUrl}
                                data-ai-hint={listing.imageHint}
                                alt={listing.title}
                                width={600}
                                height={400}
                                className="w-full rounded-lg aspect-[3/2] object-cover"
                                />
                                <CardTitle className="pt-4">{listing.title}</CardTitle>
                                <CardDescription className="text-primary font-semibold">{listing.price}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{listing.description}</p>
                            </CardContent>
                            <CardFooter>
                                <ContactInfo contact={listing.contact} />
                            </CardFooter>
                            </Card>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="looking-to-buy" className="contents">
                        <AnimatePresence>
                        {lookingForListings.map(listing => (
                            <motion.div layout key={listing.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Card key={listing.id} className="flex flex-col h-full">
                            <CardHeader>
                                <Image
                                src={listing.imageUrl}
                                data-ai-hint={listing.imageHint}
                                alt={listing.title}
                                width={600}
                                height={400}
                                className="w-full rounded-lg aspect-[3/2] object-cover"
                                />
                                <CardTitle className="pt-4">{listing.title}</CardTitle>
                                <CardDescription className="text-primary font-semibold">{listing.price}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{listing.description}</p>
                            </CardContent>
                            <CardFooter>
                                <ContactInfo contact={listing.contact} />
                            </CardFooter>
                            </Card>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </TabsContent>
                </>
            )}
            </div>
            {!loading && forSaleListings.length === 0 && (
                <TabsContent value="for-sale">
                    <div className="text-center col-span-full py-12">
                        <p className="text-muted-foreground">No "For Sale" listings yet. Be the first!</p>
                    </div>
                </TabsContent>
            )}
            {!loading && lookingForListings.length === 0 && (
                 <TabsContent value="looking-to-buy">
                    <div className="text-center col-span-full py-12">
                        <p className="text-muted-foreground">No "Looking to Buy" listings yet. Be the first!</p>
                    </div>
                </TabsContent>
            )}
        </Tabs>
      </div>
    </div>
  );
}
