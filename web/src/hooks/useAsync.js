import { useCallback, useState } from 'react'

export const useAsync = (asyncFunction) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await asyncFunction(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [asyncFunction],
  )

  return { execute, loading, error, data, setData, setError }
}
