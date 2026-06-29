import ResetPasswordCard from '@/components/auth/ResetPassword/ResetPasswordCard'

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token = '' } = await searchParams

  return <ResetPasswordCard token={token} />
}
