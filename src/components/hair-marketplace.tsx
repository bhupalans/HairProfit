
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PlusCircle, ShoppingCart, Search, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { MarketplaceListing } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const initialListings: MarketplaceListing[] = [
  {
    id: '1',
    type: 'For Sale',
    title: 'Premium Vietnamese Bone Straight',
    description: '50 bundles of 20-inch, double-drawn, virgin bone straight hair. Natural black color. Perfect for luxury wigs and extensions.',
    price: '$85 per bundle',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'straight hair',
  },
  {
    id: '2',
    type: 'For Sale',
    title: 'High-Quality Brazilian Body Wave',
    description: 'Bulk lot of 100 bundles, 14-inch to 22-inch mix. Grade 12A Remy hair, excellent for salon resale.',
    price: 'Contact for bulk pricing',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'wavy hair',
  },
  {
    id: '3',
    type: 'Looking to Buy',
    title: 'Seeking Raw Indian Temple Hair',
    description: 'Looking for a reliable supplier of raw, unprocessed Indian temple hair. Specifically seeking curly and wavy textures, 18-26 inches. Minimum order 5kg.',
    price: 'Open to negotiation',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'curly hair',
  },
];

export default function HairMarketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>(initialListings);
  const [newListing, setNewListing] = useState<Omit<MarketplaceListing, 'id' | 'imageUrl' | 'imageHint'>>({
    type: 'For Sale',
    title: '',
    description: '',
    price: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateListing = () => {
    const listingToAdd: MarketplaceListing = {
      ...newListing,
      id: crypto.randomUUID(),
      imageUrl: 'https://placehold.co/600x400.png',
      imageHint: `${newListing.title.split(' ')[1] || 'hair'} ${newListing.title.split(' ')[2] || 'extensions'}`,
    };
    setListings(prev => [listingToAdd, ...prev]);
    setIsDialogOpen(false);
    setNewListing({ type: 'For Sale', title: '', description: '', price: '' });
    toast({
      title: 'Listing Created!',
      description: 'Your new listing is now live on the marketplace.',
    });
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a New Listing</DialogTitle>
                <DialogDescription>
                  Share what you're selling or looking to buy. Fill out the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">I am...</Label>
                   <Select
                      value={newListing.type}
                      onValueChange={(value: 'For Sale' | 'Looking to Buy') => setNewListing(prev => ({...prev, type: value}))}
                    >
                      <SelectTrigger id="type" className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="For Sale">Selling Hair</SelectItem>
                        <SelectItem value="Looking to Buy">Looking for Hair</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" value={newListing.title} onChange={e => setNewListing(prev => ({...prev, title: e.target.value}))} className="col-span-3" placeholder="e.g., Premium Brazilian Hair" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" value={newListing.description} onChange={e => setNewListing(prev => ({...prev, description: e.target.value}))} className="col-span-3" placeholder="Include details like length, texture, quantity, etc." />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price</Label>
                  <Input id="price" value={newListing.price} onChange={e => setNewListing(prev => ({...prev, price: e.target.value}))} className="col-span-3" placeholder="e.g., $80 per bundle" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" onClick={handleCreateListing}>Create Listing</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Tabs defaultValue="for-sale">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="for-sale">
              <ShoppingCart className="mr-2" /> For Sale ({forSaleListings.length})
            </TabsTrigger>
            <TabsTrigger value="looking-to-buy">
              <Search className="mr-2" /> Looking to Buy ({lookingForListings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="for-sale">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {forSaleListings.map(listing => (
                <Card key={listing.id} className="flex flex-col">
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
                    <Button className="w-full" onClick={() => toast({ title: 'Contact details would be shown here.'})}>
                      <Handshake className="mr-2" /> Contact Seller
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="looking-to-buy">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {lookingForListings.map(listing => (
                <Card key={listing.id} className="flex flex-col">
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
                    <Button className="w-full" onClick={() => toast({ title: 'Contact details would be shown here.'})}>
                      <Handshake className="mr-2" /> Contact Buyer
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
