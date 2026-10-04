import { MerchantDetailPage } from '@/views/merchants-page'

export default async function Page({
  params,
}: {
  params: Promise<{ merchant: string }>
}) {
  const resolvedParams = await params
  return <MerchantDetailPage params={resolvedParams} />
}
