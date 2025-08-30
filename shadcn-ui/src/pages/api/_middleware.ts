import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextApiHandler } from 'next'

export function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set')
      }
      return await handler(req, res)
    } catch (error: any) {
      console.error('API Error:', error)
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
