import SubscribeClient from './subscribe-client';

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const from = (params.from as string) || '/';

  return <SubscribeClient from={from} />;
}
