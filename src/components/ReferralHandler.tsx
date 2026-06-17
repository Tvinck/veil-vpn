import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ReferralHandler() {
  const { referrer } = useParams<{ referrer: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (referrer) {
      console.log('Referral tracked from:', referrer)
      localStorage.setItem('veil_referrer', referrer.trim().toLowerCase())
    }
    // Redirect to landing page
    navigate('/', { replace: true })
  }, [referrer, navigate])

  return null
}
