export function traductStatus(status: 'pending' | 'approved' | 'rejected') {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'approved':
      return 'Approuvée';
    case 'rejected':
      return 'Rejetée';
    default:
      return status;
  }
}