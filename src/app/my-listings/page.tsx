'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MoreVertical, Trash2, CheckCircle2, Share2, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getMyListings, updateListingStatus, deleteListing } from '@/app/actions';
import type { MarketplaceListing } from '@/types';
import AuthGuard from '@/components/auth-guard';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const response = await getMyListings(user.uid);
    if (response.success && response.data) {
      setListings(response.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: response.error || 'Failed to load your listings.',
      });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchUserListings();
  }, [fetchUserListings]);

  const handleMarkAsCompleted = async (listing: MarketplaceListing) => {
    const newStatus = listing.type === 'sell' ? 'sold' : 'fulfilled';
    const res = await updateListingStatus(listing.id, newStatus);
    if (res.success) {
      toast({ 
        title: 'Status Updated', 
        description: `Marked as ${newStatus}.` 
      });
      fetchUserListings();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    const res = await deleteListing(id);
    if (res.success) {
      toast({ title: 'Listing Deleted' });
      fetchUserListings();
    }
  };

  const handleShare = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/marketplace/${id}`;
      navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied', description: 'URL copied to clipboard.' });
    }
  };

  const renderPrice = (listing: MarketplaceListing) => {
    if (typeof listing.price === 'string') return listing.price;
    const symbol = listing.currency === 'USD' ? '$' : '₹';
    return `${symbol}${listing.price} per ${listing.unit}`;
  };

  return (
    <AuthGuard>
      <div className="bg-muted/30 min-h-screen">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <Button asChild variant="ghost" className="pl-0">
              <Link href="/marketplace">
                <ArrowLeft className="mr-2" />
                Back to Marketplace
              </Link>
            </Button>
          </div>

          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">My Listings</h1>
            <p className="text-muted-foreground mt-2">Manage the listings you've posted.</p>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="flex flex-col">
                  <Skeleton className="w-full aspect-[3/2] rounded-t-lg" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-transparent">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
              </div>
              <CardTitle className="text-xl">No listings found</CardTitle>
              <CardDescription className="mt-2 max-w-md mx-auto">
                You haven't created any marketplace listings yet. Once you post items for sale or purchase requests, they will appear here.
              </CardDescription>
              <Button asChild className="mt-6">
                <Link href="/marketplace">Go to Marketplace</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => {
                const isSold = listing.type === 'sell' && listing.status === 'sold';
                const isFulfilled = listing.type === 'buy' && (listing.status === 'fulfilled' || listing.status === 'sold');
                const isCompleted = isSold || isFulfilled;

                return (
                  <Card key={listing.id} className="flex flex-col h-full relative group">
                    {isSold && <Badge className="absolute top-3 left-3 z-10 bg-red-600 font-bold" variant="destructive">SOLD</Badge>}
                    {isFulfilled && <Badge className="absolute top-3 left-3 z-10 bg-green-600 font-bold">FULFILLED</Badge>}
                    
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur shadow-sm hover:bg-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleShare(listing.id)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share Listing
                          </DropdownMenuItem>
                          {!isCompleted && (
                            <DropdownMenuItem onClick={() => handleMarkAsCompleted(listing)}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Mark as {listing.type === 'sell' ? 'Sold' : 'Fulfilled'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(listing.id)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Listing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Link href={`/marketplace/${listing.id}`} className="flex flex-col h-full">
                      <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg bg-muted">
                        {listing.imageUrls?.[0] ? (
                          <Image 
                            src={listing.imageUrls[0]} 
                            alt={listing.title} 
                            fill 
                            className={cn("object-cover transition-transform group-hover:scale-105", isCompleted && "opacity-60 grayscale-[30%]")} 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit capitalize text-[10px] tracking-wider mb-1">{listing.type}</Badge>
                          <CardTitle className={cn("text-lg line-clamp-1", isCompleted && "text-muted-foreground line-through")}>
                            {listing.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="font-bold text-lg text-primary">
                          {renderPrice(listing)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
                        <span>Posted {new Date(listing.createdAt).toLocaleDateString()}</span>
                        <Badge variant={listing.status === 'active' ? 'secondary' : 'default'} className="text-[10px] uppercase">
                          {listing.status}
                        </Badge>
                      </CardFooter>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
