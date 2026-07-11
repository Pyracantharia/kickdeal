import AdminClubPlayersPage from '@/components/admin/AdminClubPlayersPage'
export default async function Page({ params }: { params: Promise<{clubId:string}> }) { const {clubId}=await params; return <AdminClubPlayersPage clubId={clubId}/> }
