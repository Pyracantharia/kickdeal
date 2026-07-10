import AdminClubMembersPage from '@/components/admin/AdminClubMembersPage'
export default async function Page({ params }: { params: Promise<{clubId:string}> }) { const {clubId}=await params; return <AdminClubMembersPage clubId={clubId}/> }
