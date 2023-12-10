import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useError } from './useError'
import useStore from '../store'
import { Task } from '../types'
import axios from 'axios'

export const useMutateTask = () => {
  const queryClient = useQueryClient()
  const { switchErrorHandling } = useError()
  const resetEditedTask = useStore((state) => state.resetEditedTask)

  const createTaskMutation = useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) =>
      axios.post<Task>(`${import.meta.env.VITE_API_URL}/tasks`, task),
    onSuccess: (res) => {
      resetEditedTask()
      const data = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })
      if (!data.length) {
        return
      }
      const previousTasks = data[0][1]
      if (previousTasks) {
        queryClient.setQueriesData({ queryKey: ['tasks'] }, [
          ...previousTasks,
          res.data,
        ])
      }
    },
    onError: (err: any) => {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: (task: Omit<Task, 'created_at' | 'updated_at'>) =>
      axios.put<Task>(`${import.meta.env.VITE_API_URL}/tasks/${task.id}`, task),
    onSuccess: (res, variables) => {
      resetEditedTask()
      const data = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })
      if (!data.length) {
        return
      }
      const previousTasks = data[0][1]
      if (previousTasks) {
        queryClient.setQueriesData(
          { queryKey: ['tasks'] },
          previousTasks.map((task) =>
            task.id === variables.id ? res.data : task,
          ),
        )
      }
    },
    onError: (err: any) => {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`${import.meta.env.VITE_API_URL}/tasks/${id}`),
    onSuccess: (_, variables) => {
      const data = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })
      if (!data.length) {
        return
      }
      const previousTasks = data[0][1]
      if (previousTasks) {
        queryClient.setQueriesData(
          { queryKey: ['tasks'] },
          previousTasks.filter((task) => task.id !== variables),
        )
      }
      resetEditedTask()
    },
    onError: (err: any) => {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
    },
  })

  return { createTaskMutation, updateTaskMutation, deleteTaskMutation }
}
