import RegisterCard from '@/components/auth/Register/RegisterCard'
import RegisterForm from '@/components/auth/Register/RegisterForm'
import React from 'react'

function page() {
  return (
    <div>
      <div className="px-6 py-8">
        <h1>Inscription</h1>
      </div>
      <RegisterCard />
    </div>
  )
}

export default page