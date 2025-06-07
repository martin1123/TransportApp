import React, { createContext, useState, useContext } from 'react'

const EarningsContext = createContext()

export const EarningsProvider = ({ children }) => {
  const [earnings, setEarnings] = useState([])

  const updateEarnings = (data) => {
    setEarnings(data)
  }

  return (
    <EarningsContext.Provider value={{ earnings, updateEarnings }}>
      {children}
    </EarningsContext.Provider>
  )
}

export const useEarnings = () => useContext(EarningsContext)
