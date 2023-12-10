import { useNavigate } from 'react-router-dom'
import useStore from '../store'
import { Credential } from '../types'
import { useError } from './useError'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export const useMutateAuth = () => {
  const navigate = useNavigate()
  const resetEditedTask = useStore((state) => state.resetEditedTask)
  const { switchErrorHandling } = useError()

  const loginMutation = useMutation({
    mutationFn: (user: Credential) =>
      axios.post(`${import.meta.env.VITE_API_URL}/login`, user),
    onSuccess: () => {
      navigate('/todo')
    },
    onError: (err: any) => {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
    },
  })

  const registerMutation = useMutation({
    mutationFn: (user: Credential) =>
      axios.post(`${import.meta.env.VITE_API_URL}/signup`, user),
    onError: (err: any) => {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => axios.post(`${import.meta.env.VITE_API_URL}/logout`),
    onSuccess: () => {
      resetEditedTask()
      navigate('/')
    },
    onError: (err: any) => {
      if (err.response.data.message) {
        switchErrorHandling(err.response.data.message)
      } else {
        switchErrorHandling(err.response.data)
      }
    },
  })

  return { loginMutation, registerMutation, logoutMutation }
}
