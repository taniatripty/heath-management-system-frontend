import LoginForm from '@/components/module/Auth/loginForm'
import React from 'react'

interface loginParams{
  searchParams:Promise<{
    redirect?:string
  }>

}

export default async function LoginPage({searchParams}:loginParams) {
  const params=await searchParams
  const redirectPath=params.redirect || "/"

  return (
    <div>
      <LoginForm redirectPath={redirectPath}/>
    </div>
  )
}
