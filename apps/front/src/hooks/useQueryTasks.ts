import axios from 'axios'
import { Task } from '../types'
import { useQuery } from '@tanstack/react-query'
import { useError } from './useError'

export const useQueryTasks = () => {
  const { switchErrorHandling } = useError()
  const getTasks = async () => {
    try {
      const { data } = await axios.get<Task[]>(
        `${import.meta.env.VITE_API_URL}/tasks`,
        { withCredentials: true },
      )
      return data
    } catch (err: any) {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
      throw err
    }
  }

  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: getTasks,
    staleTime: Infinity,
  })
}
