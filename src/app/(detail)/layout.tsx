import { DetailModalFrame } from '@/components/pseudo-modal/DetailModalFrame'

export default function DetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DetailModalFrame>
      {children}
    </DetailModalFrame>
  )
}
