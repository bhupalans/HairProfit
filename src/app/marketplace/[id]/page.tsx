'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, notFound, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MessageSquare, Clock, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

import { getListing } from '@/app/actions';
import type { MarketplaceListing } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth-guard';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const ContactInfo = ({ contact }: { contact: string }) => {
    const isEmail = contact.includes('@');
    const isPhone = /^\+?[0-9\s-()]+$/.test(contact);
    
    let Icon = MessageSquare;
    let href = '#';
    let text = "Contact Seller";
    if (isEmail) {
        Icon = Mail;
        href = `mailto:${contact}`;
        text = `Email: ${contact}`;
    } else if (isPhone) {
        Icon = Phone;
        href = `tel:${contact}`;
        text = `Call: ${contact}`;
    }

    return (
        <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
            <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="mr-2" /> {text}
            </a>
        </Button>
    )
};

const PageSkeleton = () => (
    <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
            <Skeleton className="h-10 w-48" />
        </div>
        <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <Skeleton className="w-full aspect-square" />
                <div className="flex flex-col p-6 sm:p-8 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                        <Skeleton className="h-9 w-3/4" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-5 w-1/2" />
                    <div className="flex-grow space-y-2 pt-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                    <div className="pt-6">
                        <Skeleton className="h-12 w-40" />
                    </div>
                </div>
            </div>
        </Card>
    </div>
);

export default function ListingDetailPage() {
    const params = useParams<{ id: string }>();
    const [listing, setListing] = useState<MarketplaceListing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchListingData = async () => {
            if (!params.id) return;
            const { success, data } = await getListing(params.id);
            if (success && data) {
                setListing(data);
            } else {
                notFound();
            }
            setIsLoading(false);
        };
        fetchListingData();
    }, [params.id]);
    
    const listingTypeDisplay = listing?.type === 'For Sale' ? 'For Sale' : 'Looking to Buy';
    const badgeVariant = listing?.type === 'For Sale' ? 'default' : 'secondary';
    const postedDate = listing ? formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }) : '';

    const imageUrls = listing?.imageUrls || [];
    const mainImage = imageUrls[activeImageIdx] || "/placeholder.png";

    return (
        <AuthGuard>
            <main className="bg-muted/30 min-h-screen py-8 sm:py-12">
                {isLoading ? (
                    <PageSkeleton />
                ) : listing && (
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="mb-8">
                        <Button asChild variant="ghost" className="pl-0">
                            <Link href="/marketplace">
                                <ArrowLeft className="mr-2" />
                                Back to Marketplace
                            </Link>
                        </Button>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="space-y-4 p-4 md:p-0">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="aspect-square relative rounded-lg overflow-hidden border group cursor-zoom-in">
                                            <Image
                                                src={mainImage}
                                                data-ai-hint={listing.imageHint}
                                                alt={listing.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute bottom-3 right-3 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Maximize2 className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] max-h-[95vh] border-none bg-transparent shadow-none p-0 flex items-center justify-center outline-none">
                                        <div className="relative w-full h-[90vh]">
                                            <Image
                                                src={mainImage}
                                                alt={listing.title}
                                                fill
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                
                                {imageUrls.length > 1 && (
                                    <div className="flex gap-2 px-2 pb-2">
                                        {imageUrls.map((url, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImageIdx(idx)}
                                                className={cn(
                                                    "w-16 h-16 rounded border overflow-hidden relative",
                                                    activeImageIdx === idx ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                                                )}
                                            >
                                                <Image src={url} alt={`${listing.title} ${idx + 1}`} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col p-6 sm:p-8">
                                <CardHeader className="p-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-3xl font-bold tracking-tight">{listing.title}</CardTitle>
                                        <Badge variant={badgeVariant} className="shrink-0">{listingTypeDisplay}</Badge>
                                    </div>
                                    <CardDescription className="text-2xl text-primary font-bold pt-4">{listing.price}</CardDescription>
                                    <div className="flex items-center text-sm text-muted-foreground pt-2">
                                        <Clock className="h-4 w-4 mr-1.5" />
                                        Posted {postedDate}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 pt-6 flex-grow">
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                                </CardContent>
                                <div className="pt-6">
                                    <ContactInfo contact={listing.contact} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                )}
            </main>
        </AuthGuard>
    );
}