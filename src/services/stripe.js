/**
 * Stripe Service for TherapyTrack
 * Handles subscription management and payment processing for therapy practices
 */

import { loadStripe } from '@stripe/stripe-js'
import { config, apiRequest } from '../utils/api.js'

// Initialize Stripe
let stripePromise
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(config.stripe.publishableKey)
  }
  return stripePromise
}

/**
 * Subscription Plans Configuration
 */
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    priceId: 'price_starter_monthly', // Stripe Price ID
    features: [
      'Up to 25 patients',
      'Basic exercise library',
      'Patient progress tracking',
      'Email support'
    ],
    maxPatients: 25
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    priceId: 'price_professional_monthly',
    features: [
      'Up to 100 patients',
      'Full exercise library',
      'Advanced analytics',
      'Video feedback',
      'Priority support'
    ],
    maxPatients: 100
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceId: 'price_enterprise_monthly',
    features: [
      'Unlimited patients',
      'Custom exercise library',
      'Advanced analytics',
      'Video feedback',
      'API access',
      'Dedicated support'
    ],
    maxPatients: -1 // Unlimited
  }
}

/**
 * Subscription Management Service
 */
export const subscriptionService = {
  /**
   * Create a new subscription checkout session
   */
  async createCheckoutSession(planId, therapistId, successUrl, cancelUrl) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()]
      if (!plan) {
        throw new Error('Invalid subscription plan')
      }

      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        body: JSON.stringify({
          priceId: plan.priceId,
          therapistId,
          successUrl,
          cancelUrl,
          metadata: {
            planId: plan.id,
            maxPatients: plan.maxPatients
          }
        })
      })

      const stripe = await getStripe()
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.sessionId
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Checkout session creation failed:', error)
      throw error
    }
  },

  /**
   * Create a customer portal session for subscription management
   */
  async createPortalSession(customerId, returnUrl) {
    try {
      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/create-portal-session`, {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          returnUrl
        })
      })

      // Redirect to customer portal
      window.location.href = response.url
    } catch (error) {
      console.error('Portal session creation failed:', error)
      throw error
    }
  },

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/subscription/${subscriptionId}`)
      return response
    } catch (error) {
      console.error('Failed to get subscription:', error)
      throw error
    }
  },

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/subscription/${subscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          priceId: newPriceId
        })
      })
      return response
    } catch (error) {
      console.error('Failed to update subscription:', error)
      throw error
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/subscription/${subscriptionId}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      throw error
    }
  },

  /**
   * Get usage statistics for billing
   */
  async getUsageStats(therapistId) {
    try {
      const response = await apiRequest(`${config.app.apiUrl}/api/billing/usage/${therapistId}`)
      return response
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      throw error
    }
  }
}

/**
 * Payment Processing Service
 */
export const paymentService = {
  /**
   * Process one-time payment (for additional features)
   */
  async processPayment(amount, description, therapistId) {
    try {
      const stripe = await getStripe()
      
      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/create-payment-intent`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          description,
          therapistId
        })
      })

      const { error, paymentIntent } = await stripe.confirmCardPayment(response.clientSecret)

      if (error) {
        throw new Error(error.message)
      }

      return paymentIntent
    } catch (error) {
      console.error('Payment processing failed:', error)
      throw error
    }
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(customerId) {
    try {
      const response = await apiRequest(`${config.app.apiUrl}/api/stripe/payments/${customerId}`)
      return response
    } catch (error) {
      console.error('Failed to get payment history:', error)
      throw error
    }
  }
}

/**
 * Billing Utilities
 */
export const billingUtils = {
  /**
   * Calculate prorated amount for plan changes
   */
  calculateProration(currentPlan, newPlan, daysRemaining, totalDays) {
    const currentDailyRate = currentPlan.price / totalDays
    const newDailyRate = newPlan.price / totalDays
    const currentCredit = currentDailyRate * daysRemaining
    const newCharge = newDailyRate * daysRemaining
    
    return Math.max(0, newCharge - currentCredit)
  },

  /**
   * Format price for display
   */
  formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  },

  /**
   * Get plan by price ID
   */
  getPlanByPriceId(priceId) {
    return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId)
  },

  /**
   * Check if therapist can add more patients
   */
  canAddPatients(currentPatientCount, planId) {
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()]
    if (!plan) return false
    
    return plan.maxPatients === -1 || currentPatientCount < plan.maxPatients
  },

  /**
   * Get remaining patient slots
   */
  getRemainingPatientSlots(currentPatientCount, planId) {
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()]
    if (!plan) return 0
    
    if (plan.maxPatients === -1) return Infinity
    return Math.max(0, plan.maxPatients - currentPatientCount)
  }
}

/**
 * Webhook Event Handlers (for server-side processing)
 */
export const webhookHandlers = {
  /**
   * Handle successful subscription creation
   */
  handleSubscriptionCreated(event) {
    const subscription = event.data.object
    console.log('Subscription created:', subscription.id)
    
    // Update therapist subscription status in database
    // This would typically be handled server-side
    return {
      therapistId: subscription.metadata.therapistId,
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.metadata.planId
    }
  },

  /**
   * Handle subscription updates
   */
  handleSubscriptionUpdated(event) {
    const subscription = event.data.object
    console.log('Subscription updated:', subscription.id)
    
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    }
  },

  /**
   * Handle failed payments
   */
  handlePaymentFailed(event) {
    const invoice = event.data.object
    console.log('Payment failed for subscription:', invoice.subscription)
    
    // Notify therapist of failed payment
    // Potentially downgrade service or send reminder
    return {
      subscriptionId: invoice.subscription,
      customerId: invoice.customer,
      amountDue: invoice.amount_due
    }
  },

  /**
   * Handle subscription cancellation
   */
  handleSubscriptionCanceled(event) {
    const subscription = event.data.object
    console.log('Subscription canceled:', subscription.id)
    
    // Update therapist status, potentially archive data
    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      canceledAt: subscription.canceled_at
    }
  }
}

export default {
  subscriptionService,
  paymentService,
  billingUtils,
  webhookHandlers,
  SUBSCRIPTION_PLANS
}
