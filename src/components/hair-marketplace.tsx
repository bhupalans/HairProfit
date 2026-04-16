'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PlusCircle, ShoppingCart, Search, Loader2, Upload, X, Heart, User } from 'lucide-react';
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
import { getListings, createListing, addBookmark, removeBookmark, getUserBookmarks } from '@/app/actions';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, auth } from "@/lib/firebase";
import { useAuth } from '@/contexts/auth-context';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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

const ListingCard = ({ 
  listing, 
  isBookmarked, 
  onToggleBookmark 
}: { 
  listing: MarketplaceListing, 
  isBookmarked: boolean, 
  onToggleBookmark: (id: string) => void 
}) => {
  const { user } = useAuth();
  const isOwner = user?.uid === listing.userId;
  
  // Status check logic
  const isSold = listing.type === 'sell' && listing.status === 'sold';
  const isFulfilled = listing.type === 'buy' && (listing.status === 'fulfilled' || listing.status === 'sold');
  const isCompleted = isSold || isFulfilled;

  const renderPrice = (listing: MarketplaceListing) => {
    if (typeof listing.price === 'string') {
        return listing.price;
    }
    const symbol = listing.currency === 'USD' ? '$' : '₹';
    return `${symbol}${listing.price} per ${listing.unit}`;
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-200 hover:border-primary hover:shadow-lg relative group">
      {isSold && (
        <Badge className="absolute top-3 left-3 z-10 bg-red-600 text-white font-bold" variant="destructive">SOLD</Badge>
      )}
      {isFulfilled && (
        <Badge className="absolute top-3 left-3 z-10 bg-green-600 text-white font-bold" variant="default">FULFILLED</Badge>
      )}
      
      {user && !isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(listing.id);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
        >
          <Heart 
            className={cn(
              "h-5 w-5 transition-colors", 
              isBookmarked ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )} 
          />
        </button>
      )}

      <Link href={`/marketplace/${listing.id}`} className="flex flex-col h-full">
        <CardHeader className="pb-4">
            {listing.imageUrls && listing.imageUrls.length > 0 && (
              <Image
                src={listing.imageUrls[0]}
                data-ai-hint={listing.imageHint}
                alt={listing.title}
                width={600}
                height={400}
                className={cn(
                  "w-full rounded-lg aspect-[3/2] object-cover mb-4",
                  isCompleted && "opacity-60 grayscale-[50%]"
                )}
              />
            )}
            <CardTitle className={cn(isCompleted && "text-muted-foreground line-through")}>{listing.title}</CardTitle>
            <CardDescription className="text-primary font-semibold">
                {renderPrice(listing)}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-muted-foreground line-clamp-3">{listing.description}</p>
        </CardContent>
         <CardFooter>
            <Button variant="secondary" className="w-full">View Details</Button>
         </CardFooter>
      </Link>
    </Card>
  );
};

export default function HairMarketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const form = useForm<MarketplaceListingFormData>({
    resolver: zodResolver(marketplaceListingFormSchema),
    defaultValues: {
      type: 'sell',
      title: '',
      description: '',
      price: 0,
      currency: 'USD',
      unit: 'bundle',
      contactEmail: '',
      contactPhone: '',
    },
  });

  const listingType = form.watch('type');

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

    if (user) {
      const bookmarkResponse = await getUserBookmarks(user.uid);
      if (bookmarkResponse.success && bookmarkResponse.data) {
        setBookmarkedIds(new Set(bookmarkResponse.data));
      }
    }

    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleToggleBookmark = async (id: string) => {
    if (!user) return;
    
    const isCurrentlyBookmarked = bookmarkedIds.has(id);
    
    // Optimistic UI update
    const newBookmarks = new Set(bookmarkedIds);
    if (isCurrentlyBookmarked) {
      newBookmarks.delete(id);
      setBookmarkedIds(newBookmarks);
      await removeBookmark(user.uid, id);
    } else {
      newBookmarks.add(id);
      setBookmarkedIds(newBookmarks);
      await addBookmark(user.uid, id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: 'You can upload a maximum of 3 images.',
      });
      return;
    }
    setImageFiles(files);
  };

  const removeFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: MarketplaceListingFormData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please login to create a listing.',
      });
      return;
    }

    const userUid = currentUser.uid;

    if (values.type === 'sell' && imageFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Images Required',
        description: 'Please upload at least one image for your sale listing.',
      });
      return;
    }

    const imageUrls: string[] = [];

    try {
      if (values.type === 'sell' && imageFiles.length > 0) {
        const storage = getStorage(app);
        
        const uploadPromises = imageFiles.map(async (file) => {
          const storageRef = ref(storage, `listing-images/${userUid}/${Date.now()}-${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });

        const urls = await Promise.all(uploadPromises);
        imageUrls.push(...urls);
      }

      const response = await createListing({
        ...values,
        imageUrls,
        userId: userUid,
      });

      if (response.success) {
        toast({
          title: 'Listing Created!',
          description: 'Your new listing is now live on the marketplace.',
        });
        setIsDialogOpen(false);
        form.reset();
        setImageFiles([]);
        fetchListings();
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create listing',
          description: response.error,
        });
      }
    } catch (error: any) {
      console.error("Listing creation failed", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || "Could not upload images or create listing.",
      });
    }
  };

  const forSaleListings = listings.filter(l => l.type === 'sell');
  const lookingForListings = listings.filter(l => l.type === 'buy');

  const renderListings = (list: MarketplaceListing[]) => (
    <AnimatePresence>
      {list.map(listing => (
        <motion.div layout key={listing.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ListingCard 
            listing={listing} 
            isBookmarked={bookmarkedIds.has(listing.id)} 
            onToggleBookmark={handleToggleBookmark} 
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );

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
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {user && (
              <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-initial">
                <Link href="/my-listings">
                  <User className="mr-2 h-4 w-4" />
                  My Listings
                </Link>
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex-1 sm:flex-initial">
                  <PlusCircle className="mr-2" />
                  Create Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create a New Listing</DialogTitle>
                  <DialogDescription>
                    Share what you're selling or looking to buy.
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
                              <SelectItem value="sell">Selling Hair</SelectItem>
                              <SelectItem value="buy">Looking for Hair</SelectItem>
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                          <FormItem className="sm:col-span-1">
                              <FormLabel>{listingType === 'sell' ? 'Price' : 'Budget'}</FormLabel>
                              <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="INR">INR (₹)</SelectItem>
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="bundle">per Bundle</SelectItem>
                                  <SelectItem value="kg">per Kg</SelectItem>
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</Label>
                      <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                              <Input type="email" placeholder="name@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Phone / WhatsApp (Optional)</FormLabel>
                              <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                    </div>
                    
                    {listingType === 'sell' && (
                      <div className="space-y-2 border-t pt-4">
                        <Label htmlFor="image-upload" className="text-sm font-medium">Listing Images (Required, Max 3)</Label>
                        <div className="space-y-3">
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="cursor-pointer"
                          />
                          
                          {imageFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {imageFiles.map((file, idx) => (
                                <div key={idx} className="relative group">
                                  <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-[10px] text-center p-1 overflow-hidden">
                                    {file.name}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
          </div>
        </header>

        <Tabs defaultValue="sell">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sell">
              <ShoppingCart className="mr-2" /> For Sale
            </TabsTrigger>
            <TabsTrigger value="buy">
              <Search className="mr-2" /> Looking to Buy
            </TabsTrigger>
          </TabsList>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {loading ? (
                Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)
            ) : (
                <>
                    <TabsContent value="sell" className="contents">
                        {renderListings(forSaleListings)}
                    </TabsContent>

                    <TabsContent value="buy" className="contents">
                       {renderListings(lookingForListings)}
                    </TabsContent>
                </>
            )}
            </div>
            {!loading && forSaleListings.length === 0 && (
                <TabsContent value="sell">
                    <div className="text-center col-span-full py-12">
                        <p className="text-muted-foreground">No "For Sale" listings yet. Be the first!</p>
                    </div>
                </TabsContent>
            )}
            {!loading && lookingForListings.length === 0 && (
                 <TabsContent value="buy">
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
