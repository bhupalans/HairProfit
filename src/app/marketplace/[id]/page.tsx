import { getListing } from '@/app/actions';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
    const { success, data: listing, error } = await getListing(params.id);

    if (!success || !listing) {
        notFound();
    }
    
    const listingTypeDisplay = listing.type === 'For Sale' ? 'For Sale' : 'Looking to Buy';
    const listingTypeColor = listing.type === 'For Sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';


    return (
        <main className="bg-muted/30 min-h-screen py-8 sm:py-12">
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
                        <div>
                            <Image
                                src={listing.imageUrl}
                                data-ai-hint={listing.imageHint}
                                alt={listing.title}
                                width={800}
                                height={800}
                                className="w-full h-full object-cover aspect-square"
                            />
                        </div>
                        <div className="flex flex-col p-6 sm:p-8">
                            <CardHeader className="p-0">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-3xl font-bold tracking-tight">{listing.title}</CardTitle>
                                    <Badge className={listingTypeColor}>{listingTypeDisplay}</Badge>
                                </div>
                                <CardDescription className="text-2xl text-primary font-bold pt-2">{listing.price}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 pt-6 flex-grow">
                                <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
                            </CardContent>
                            <div className="pt-6">
                                <ContactInfo contact={listing.contact} />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </main>
    );
}
